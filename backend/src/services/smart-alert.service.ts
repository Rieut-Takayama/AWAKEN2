import { mexcService } from './mexc.service';
import { telegramService } from './telegram.service';
import { databaseService } from './database.service';

interface PriceSnapshot {
    symbol: string;
    price: number;
    volume: number;
    timestamp: Date;
}

interface AlertConfig {
    enabled: boolean;
    symbols: string[];
    // 各アラートの閾値
    surgeThreshold: number;        // 急騰検知（デフォルト5%）
    dropThreshold: number;         // 急落検知（デフォルト5%）
    volumeMultiplier: number;      // 出来高倍率（デフォルト3倍）
    volatilityThreshold: number;   // ボラティリティ（デフォルト10%）
    stagnationHours: number;       // 停滞時間（デフォルト2時間）
    whipsawCount: number;          // 往復ビンタ回数（デフォルト2回）
}

export class SmartAlertService {
    private priceHistory: Map<string, PriceSnapshot[]> = new Map();
    private alertHistory: Map<string, Map<string, number>> = new Map(); // アラートタイプごとのクールダウン
    private monitoringInterval: NodeJS.Timeout | null = null;
    private config: AlertConfig = {
        enabled: false,
        symbols: [],
        surgeThreshold: 2.0,
        dropThreshold: 2.0,
        volumeMultiplier: 2.0,
        volatilityThreshold: 5.0,
        stagnationHours: 2,
        whipsawCount: 2
    };
    private supportResistanceLevels: Map<string, { support: number; resistance: number }> = new Map();
    private telegramToken: string = '';
    private telegramChatId: string = '';

    // 設定を更新
    updateConfig(config: Partial<AlertConfig>): void {
        this.config = { ...this.config, ...config };
        console.log('📊 スマートアラート設定更新:', this.config);
    }

    // Telegram設定を設定
    setTelegramConfig(token: string, chatId: string): void {
        this.telegramToken = token;
        this.telegramChatId = chatId;
    }

    // 監視開始（オールインワン！）
    async startMonitoring(symbols: string[], intervalMinutes: number = 1): Promise<void> {
        if (this.monitoringInterval) {
            console.log('⚠️ スマートアラートは既に実行中です');
            return;
        }

        this.config.symbols = symbols;
        this.config.enabled = true;
        
        console.log(`🚀 スマートアラート開始！ ${symbols.length}個の通貨を${intervalMinutes}分間隔で監視`);
        
        // 初回実行
        await this.checkAllAlerts();
        
        // 定期実行
        this.monitoringInterval = setInterval(async () => {
            await this.checkAllAlerts();
        }, intervalMinutes * 60 * 1000);
    }

    // 監視停止
    stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            this.config.enabled = false;
            console.log('🛑 スマートアラートを停止しました');
        }
    }

    // 全アラートチェック
    private async checkAllAlerts(): Promise<void> {
        console.log(`🔍 スマートアラート: ${this.config.symbols.length}個の通貨をチェック中...`);
        
        const priceData = await mexcService.getMultipleTickerPrices(this.config.symbols);
        
        for (const data of priceData) {
            // 価格履歴を更新
            this.updatePriceHistory(data.symbol, data.price, data.volume);
            
            const history = this.priceHistory.get(data.symbol);
            if (!history || history.length < 2) continue;
            
            // 各種アラートをチェック（全部コスト0円！）
            await this.checkSurgeAlert(data.symbol, history);         // 急騰
            await this.checkDropAlert(data.symbol, history);          // 急落
            await this.checkVolumeAlert(data.symbol, history);        // 出来高爆発
            await this.checkVolatilityAlert(data.symbol, history);    // ボラティリティ
            await this.checkStagnationAlert(data.symbol, history);    // 停滞
            await this.checkWhipsawAlert(data.symbol, history);       // 往復ビンタ
            await this.checkSupportResistance(data.symbol, data.price); // サポレジ
            await this.checkConsecutiveBars(data.symbol, history);    // 連続陽線/陰線
            await this.checkVolumeDryUp(data.symbol, history);        // 出来高枯渇
        }
    }

    // 1. 急騰アラート
    private async checkSurgeAlert(symbol: string, history: PriceSnapshot[]): Promise<void> {
        const current = history[history.length - 1];
        const fiveMinAgo = this.findPriceAtTime(history, 5);
        
        if (fiveMinAgo) {
            const surgePercent = ((current.price - fiveMinAgo.price) / fiveMinAgo.price) * 100;
            
            if (surgePercent >= this.config.surgeThreshold && this.canSendAlert(symbol, 'surge')) {
                await telegramService.sendMessage({
                    chatId: '',
                    text: `🚀 <b>急騰アラート！</b> 🚀

💎 <b>通貨:</b> ${symbol}
📈 <b>上昇率:</b> <b>+${surgePercent.toFixed(2)}%</b> (5分間)
💰 <b>現在価格:</b> $${current.price.toLocaleString()}

${surgePercent >= 10 ? '🔥 <b>爆上げ中！利確タイミングかも？</b>' : '⚡ <b>上昇トレンド開始か？</b>'}

💡 <i>急騰後は一時的な調整の可能性があります</i>`,
                    parseMode: 'HTML'
                });
                
                this.setAlertCooldown(symbol, 'surge');
            }
        }
    }

    // 2. 急落アラート（既存のprice-monitorから移行）
    private async checkDropAlert(symbol: string, history: PriceSnapshot[]): Promise<void> {
        const current = history[history.length - 1];
        const fiveMinAgo = this.findPriceAtTime(history, 5);
        
        if (fiveMinAgo) {
            const dropPercent = ((fiveMinAgo.price - current.price) / fiveMinAgo.price) * 100;
            
            if (dropPercent >= this.config.dropThreshold && this.canSendAlert(symbol, 'drop')) {
                // ボリンジャーバンド情報も取得して表示
                const candles = await mexcService.getCandleData(symbol, '5m', 20);
                const bb = this.calculateBollingerBands(candles);
                const bbPosition = ((current.price - bb.lower) / (bb.upper - bb.lower)) * 100;
                
                let additionalInfo = '';
                if (bbPosition < 0) {
                    additionalInfo = '\n\n🎯 <b>BB下限ブレイク中！反発の可能性大！</b>';
                } else if (bbPosition < 10) {
                    additionalInfo = `\n\n⚡ BB下限付近（${bbPosition.toFixed(1)}%）反発準備か？`;
                }
                
                await telegramService.sendMessage({
                    chatId: '',
                    text: `🔻 <b>急落アラート！</b> 🔻

💎 <b>通貨:</b> ${symbol}
📉 <b>下落率:</b> <b>-${dropPercent.toFixed(2)}%</b> (5分間)
💰 <b>現在価格:</b> $${current.price.toLocaleString()}
📊 <b>BB位置:</b> ${bbPosition.toFixed(1)}%${additionalInfo}

<i>${new Date().toLocaleString('ja-JP')}</i>`,
                    parseMode: 'HTML'
                });
                
                this.setAlertCooldown(symbol, 'drop');
            }
        }
    }

    // 3. 出来高爆発アラート
    private async checkVolumeAlert(symbol: string, history: PriceSnapshot[]): Promise<void> {
        const current = history[history.length - 1];
        const avgVolume = this.calculateAverageVolume(history.slice(-20));
        const volumeRatio = current.volume / avgVolume;
        
        if (volumeRatio >= this.config.volumeMultiplier && this.canSendAlert(symbol, 'volume')) {
            await telegramService.sendMessage({
                chatId: '',
                text: `💥 <b>出来高爆発アラート！</b> 💥

💎 <b>通貨:</b> ${symbol}
📊 <b>出来高:</b> 通常の<b>${volumeRatio.toFixed(1)}倍</b>
💰 <b>現在価格:</b> $${current.price.toLocaleString()}

🐋 <b>大口が動いている可能性があります！</b>
価格の大きな変動に備えてください。

<i>${new Date().toLocaleString('ja-JP')}</i>`,
                parseMode: 'HTML'
            });
            
            this.setAlertCooldown(symbol, 'volume');
        }
    }

    // 4. ボラティリティ異常アラート
    private async checkVolatilityAlert(symbol: string, history: PriceSnapshot[]): Promise<void> {
        const thirtyMinAgo = this.findPriceAtTime(history, 30);
        if (!thirtyMinAgo) return;
        
        // 30分間の最高値と最安値を計算
        const recentPrices = history.slice(-30).map(h => h.price);
        const high = Math.max(...recentPrices);
        const low = Math.min(...recentPrices);
        const volatility = ((high - low) / low) * 100;
        
        if (volatility >= this.config.volatilityThreshold && this.canSendAlert(symbol, 'volatility')) {
            await telegramService.sendMessage({
                chatId: '',
                text: `🎢 <b>高ボラティリティアラート！</b> 🎢

💎 <b>通貨:</b> ${symbol}
📊 <b>変動幅:</b> <b>${volatility.toFixed(2)}%</b> (30分間)
📈 <b>高値:</b> $${high.toLocaleString()}
📉 <b>安値:</b> $${low.toLocaleString()}

⚡ <b>激しい値動き中！スキャルピングのチャンス！</b>
リスク管理を忘れずに。

<i>${new Date().toLocaleString('ja-JP')}</i>`,
                parseMode: 'HTML'
            });
            
            this.setAlertCooldown(symbol, 'volatility');
        }
    }

    // 5. 停滞アラート
    private async checkStagnationAlert(symbol: string, history: PriceSnapshot[]): Promise<void> {
        const hoursAgo = this.findPriceAtTime(history, this.config.stagnationHours * 60);
        if (!hoursAgo) return;
        
        const current = history[history.length - 1];
        const changePercent = Math.abs((current.price - hoursAgo.price) / hoursAgo.price * 100);
        
        if (changePercent < 0.5 && this.canSendAlert(symbol, 'stagnation', 120)) { // 2時間に1回
            await telegramService.sendMessage({
                chatId: '',
                text: `💤 <b>停滞アラート</b> 💤

💎 <b>通貨:</b> ${symbol}
⏰ <b>停滞時間:</b> ${this.config.stagnationHours}時間以上
📊 <b>変動率:</b> ${changePercent.toFixed(2)}%のみ
💰 <b>現在価格:</b> $${current.price.toLocaleString()}

🌪️ <b>嵐の前の静けさ？</b>
ブレイクアウトに備えて準備しましょう。

<i>${new Date().toLocaleString('ja-JP')}</i>`,
                parseMode: 'HTML'
            });
            
            this.setAlertCooldown(symbol, 'stagnation', 120);
        }
    }

    // 6. 往復ビンタアラート
    private async checkWhipsawAlert(symbol: string, history: PriceSnapshot[]): Promise<void> {
        const oneHourHistory = history.slice(-60); // 直近1時間
        if (oneHourHistory.length < 20) return;
        
        let whipsawCount = 0;
        let lastDirection: 'up' | 'down' | null = null;
        
        for (let i = 5; i < oneHourHistory.length; i += 5) {
            const current = oneHourHistory[i].price;
            const previous = oneHourHistory[i - 5].price;
            const changePercent = ((current - previous) / previous) * 100;
            
            if (Math.abs(changePercent) >= 5) {
                const direction = changePercent > 0 ? 'up' : 'down';
                if (lastDirection && direction !== lastDirection) {
                    whipsawCount++;
                }
                lastDirection = direction;
            }
        }
        
        if (whipsawCount >= this.config.whipsawCount && this.canSendAlert(symbol, 'whipsaw')) {
            await telegramService.sendMessage({
                chatId: '',
                text: `🎯 <b>往復ビンタアラート！</b> 🎯

💎 <b>通貨:</b> ${symbol}
🔄 <b>往復回数:</b> ${whipsawCount}回（1時間）
💰 <b>現在価格:</b> $${history[history.length - 1].price.toLocaleString()}

💥 <b>激しい上下動！デイトレのチャンス！</b>
ポジションサイズに注意して取引してください。

<i>${new Date().toLocaleString('ja-JP')}</i>`,
                parseMode: 'HTML'
            });
            
            this.setAlertCooldown(symbol, 'whipsaw');
        }
    }

    // 8. サポート/レジスタンス接近アラート
    private async checkSupportResistance(symbol: string, currentPrice: number): Promise<void> {
        // 初回は履歴からサポレジを計算
        if (!this.supportResistanceLevels.has(symbol)) {
            const history = this.priceHistory.get(symbol);
            if (!history || history.length < 50) return;
            
            const prices = history.map(h => h.price);
            const support = Math.min(...prices.slice(-50));
            const resistance = Math.max(...prices.slice(-50));
            
            this.supportResistanceLevels.set(symbol, { support, resistance });
        }
        
        const levels = this.supportResistanceLevels.get(symbol)!;
        const supportDistance = Math.abs((currentPrice - levels.support) / levels.support * 100);
        const resistanceDistance = Math.abs((currentPrice - levels.resistance) / levels.resistance * 100);
        
        // サポート接近
        if (supportDistance < 2 && currentPrice > levels.support && this.canSendAlert(symbol, 'support')) {
            await telegramService.sendMessage({
                chatId: '',
                text: `🛡️ <b>サポートライン接近！</b> 🛡️

💎 <b>通貨:</b> ${symbol}
💰 <b>現在価格:</b> $${currentPrice.toLocaleString()}
📊 <b>サポート:</b> $${levels.support.toLocaleString()}
📏 <b>距離:</b> ${supportDistance.toFixed(2)}%

🎯 <b>反発の可能性あり！</b>
エントリーポイントかもしれません。

<i>${new Date().toLocaleString('ja-JP')}</i>`,
                parseMode: 'HTML'
            });
            
            this.setAlertCooldown(symbol, 'support');
        }
        
        // レジスタンス接近
        if (resistanceDistance < 2 && currentPrice < levels.resistance && this.canSendAlert(symbol, 'resistance')) {
            await telegramService.sendMessage({
                chatId: '',
                text: `🚧 <b>レジスタンスライン接近！</b> 🚧

💎 <b>通貨:</b> ${symbol}
💰 <b>現在価格:</b> $${currentPrice.toLocaleString()}
📊 <b>レジスタンス:</b> $${levels.resistance.toLocaleString()}
📏 <b>距離:</b> ${resistanceDistance.toFixed(2)}%

⚠️ <b>反落の可能性あり！</b>
利確タイミングかもしれません。

<i>${new Date().toLocaleString('ja-JP')}</i>`,
                parseMode: 'HTML'
            });
            
            this.setAlertCooldown(symbol, 'resistance');
        }
    }

    // ユーティリティメソッド
    private updatePriceHistory(symbol: string, price: number, volume: number): void {
        if (!this.priceHistory.has(symbol)) {
            this.priceHistory.set(symbol, []);
        }
        
        const history = this.priceHistory.get(symbol)!;
        history.push({
            symbol,
            price,
            volume,
            timestamp: new Date()
        });
        
        // 最新100件のみ保持
        if (history.length > 100) {
            this.priceHistory.set(symbol, history.slice(-100));
        }
    }

    private findPriceAtTime(history: PriceSnapshot[], minutesAgo: number): PriceSnapshot | null {
        const targetTime = Date.now() - (minutesAgo * 60 * 1000);
        
        for (let i = history.length - 1; i >= 0; i--) {
            const snapshot = history[i];
            const timeDiff = Math.abs(snapshot.timestamp.getTime() - targetTime);
            
            if (timeDiff < 60000) { // 1分以内の誤差
                return snapshot;
            }
        }
        
        return null;
    }

    private calculateAverageVolume(history: PriceSnapshot[]): number {
        if (history.length === 0) return 0;
        const sum = history.reduce((acc, h) => acc + h.volume, 0);
        return sum / history.length;
    }

    private canSendAlert(symbol: string, alertType: string, cooldownMinutes: number = 30): boolean {
        if (!this.alertHistory.has(symbol)) {
            this.alertHistory.set(symbol, new Map());
        }
        
        const symbolAlerts = this.alertHistory.get(symbol)!;
        const lastAlert = symbolAlerts.get(alertType);
        
        if (!lastAlert) return true;
        
        const now = Date.now();
        return (now - lastAlert) > (cooldownMinutes * 60 * 1000);
    }

    private setAlertCooldown(symbol: string, alertType: string, cooldownMinutes: number = 30): void {
        if (!this.alertHistory.has(symbol)) {
            this.alertHistory.set(symbol, new Map());
        }
        
        const symbolAlerts = this.alertHistory.get(symbol)!;
        symbolAlerts.set(alertType, Date.now());
    }

    // 8. 連続陽線/陰線アラート
    private async checkConsecutiveBars(symbol: string, history: PriceSnapshot[]): Promise<void> {
        if (history.length < 10) return;
        
        let consecutiveUp = 0;
        let consecutiveDown = 0;
        let lastDirection: 'up' | 'down' | null = null;
        
        // 直近10本のローソク足をチェック
        for (let i = history.length - 10; i < history.length; i++) {
            if (i === 0) continue;
            
            const current = history[i].price;
            const previous = history[i - 1].price;
            
            if (current > previous) {
                if (lastDirection === 'up') {
                    consecutiveUp++;
                } else {
                    consecutiveUp = 1;
                    consecutiveDown = 0;
                }
                lastDirection = 'up';
            } else if (current < previous) {
                if (lastDirection === 'down') {
                    consecutiveDown++;
                } else {
                    consecutiveDown = 1;
                    consecutiveUp = 0;
                }
                lastDirection = 'down';
            }
        }
        
        // 5本以上の連続陽線
        if (consecutiveUp >= 5 && this.canSendAlert(symbol, 'consecutive-up')) {
            await telegramService.sendMessage({
                chatId: '',
                text: `📊 <b>連続陽線アラート！</b> 📊

💎 <b>通貨:</b> ${symbol}
🔥 <b>連続陽線:</b> ${consecutiveUp}本
💰 <b>現在価格:</b> $${history[history.length - 1].price.toLocaleString()}

⚠️ <b>過熱感あり！利確タイミングかも？</b>
上昇が続きすぎると調整が入る可能性があります。

<i>${new Date().toLocaleString('ja-JP')}</i>`,
                parseMode: 'HTML'
            });
            
            this.setAlertCooldown(symbol, 'consecutive-up');
        }
        
        // 5本以上の連続陰線
        if (consecutiveDown >= 5 && this.canSendAlert(symbol, 'consecutive-down')) {
            await telegramService.sendMessage({
                chatId: '',
                text: `📊 <b>連続陰線アラート！</b> 📊

💎 <b>通貨:</b> ${symbol}
💧 <b>連続陰線:</b> ${consecutiveDown}本
💰 <b>現在価格:</b> $${history[history.length - 1].price.toLocaleString()}

🎯 <b>売られすぎ！底値買いのチャンス？</b>
そろそろ反発が期待できるかもしれません。

<i>${new Date().toLocaleString('ja-JP')}</i>`,
                parseMode: 'HTML'
            });
            
            this.setAlertCooldown(symbol, 'consecutive-down');
        }
    }

    // 9. 出来高枯渇アラート
    private async checkVolumeDryUp(symbol: string, history: PriceSnapshot[]): Promise<void> {
        if (history.length < 20) return;
        
        const current = history[history.length - 1];
        const avgVolume = this.calculateAverageVolume(history.slice(-20));
        const volumeRatio = current.volume / avgVolume;
        
        // 出来高が平均の30%以下
        if (volumeRatio <= 0.3 && this.canSendAlert(symbol, 'volume-dryup', 60)) {
            await telegramService.sendMessage({
                chatId: '',
                text: `🌊 <b>出来高枯渇アラート</b> 🌊

💎 <b>通貨:</b> ${symbol}
📊 <b>出来高:</b> 平均の<b>${(volumeRatio * 100).toFixed(0)}%</b>まで減少
💰 <b>現在価格:</b> $${current.price.toLocaleString()}

💤 <b>市場の関心が薄れています</b>
大きな動きの前の静けさかもしれません。
次の大口参入に備えましょう！

<i>${new Date().toLocaleString('ja-JP')}</i>`,
                parseMode: 'HTML'
            });
            
            this.setAlertCooldown(symbol, 'volume-dryup', 60);
        }
    }

    // ステータス取得
    getStatus(): {
        enabled: boolean;
        monitoredSymbols: string[];
        config: AlertConfig;
        alertTypes: string[];
    } {
        return {
            enabled: this.config.enabled,
            monitoredSymbols: this.config.symbols,
            config: this.config,
            alertTypes: [
                '急騰アラート',
                '急落アラート（BB下限ブレイク検知付き）',
                '出来高爆発アラート',
                'ボラティリティアラート',
                '停滞アラート',
                '往復ビンタアラート',
                'サポート/レジスタンスアラート',
                '連続陽線/陰線アラート',
                '出来高枯渇アラート'
            ]
        };
    }

    // ボリンジャーバンド計算（簡易版）
    private calculateBollingerBands(candles: any[]): { upper: number; middle: number; lower: number } {
        const closes = candles.map(c => c.close);
        const middle = closes.reduce((a, b) => a + b, 0) / closes.length;
        
        const squaredDifferences = closes.map(close => Math.pow(close - middle, 2));
        const variance = squaredDifferences.reduce((a, b) => a + b, 0) / closes.length;
        const stdDev = Math.sqrt(variance);
        
        return {
            upper: middle + (2 * stdDev),
            middle: middle,
            lower: middle - (2 * stdDev)
        };
    }
}

export const smartAlertService = new SmartAlertService();