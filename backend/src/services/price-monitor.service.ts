import { mexcService } from './mexc.service';
import { telegramService } from './telegram.service';
import { databaseService } from './database.service';

interface PriceHistory {
    symbol: string;
    prices: Array<{
        price: number;
        timestamp: Date;
    }>;
}

class PriceMonitorService {
    private priceHistory: Map<string, PriceHistory> = new Map();
    private monitoringInterval: NodeJS.Timeout | null = null;
    private monitoredSymbols: Set<string> = new Set();
    private dropThreshold: number = 5; // デフォルト5%下落で通知
    private notificationCooldown: Map<string, number> = new Map(); // 通知クールダウン管理
    private cooldownMinutes: number = 30; // 同じ通貨の通知は30分間隔

    // 監視する通貨を追加
    addSymbols(symbols: string[]): void {
        symbols.forEach(symbol => this.monitoredSymbols.add(symbol));
        console.log(`📊 監視通貨追加: ${symbols.join(', ')}`);
    }

    // 監視する通貨を削除
    removeSymbol(symbol: string): void {
        this.monitoredSymbols.delete(symbol);
        this.priceHistory.delete(symbol);
        console.log(`🚫 監視通貨削除: ${symbol}`);
    }

    // 急落検知閾値を設定
    setDropThreshold(percentage: number): void {
        this.dropThreshold = percentage;
        console.log(`📉 急落検知閾値を${percentage}%に設定`);
    }

    // 価格監視を開始（Claude API使わないからコスト0！）
    async startMonitoring(intervalMinutes: number = 1): Promise<void> {
        if (this.monitoringInterval) {
            console.log('⚠️ 価格監視は既に実行中です');
            return;
        }

        console.log(`🚀 価格監視開始！ ${intervalMinutes}分間隔で監視`);
        
        // 初回実行
        await this.checkPrices();
        
        // 定期実行
        this.monitoringInterval = setInterval(async () => {
            await this.checkPrices();
        }, intervalMinutes * 60 * 1000);
    }

    // 価格監視を停止
    stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('🛑 価格監視を停止しました');
        }
    }

    // 価格チェックと急落検知
    private async checkPrices(): Promise<void> {
        console.log(`🔍 ${this.monitoredSymbols.size}個の通貨をチェック中...`);
        
        const symbols = Array.from(this.monitoredSymbols);
        const priceData = await mexcService.getMultipleTickerPrices(symbols);
        
        for (const data of priceData) {
            // 価格履歴を更新
            this.updatePriceHistory(data.symbol, data.price);
            
            // 急落チェック
            await this.checkForPriceDrop(data.symbol, data.price);
        }
    }

    // 価格履歴を更新
    private updatePriceHistory(symbol: string, currentPrice: number): void {
        if (!this.priceHistory.has(symbol)) {
            this.priceHistory.set(symbol, {
                symbol,
                prices: []
            });
        }
        
        const history = this.priceHistory.get(symbol)!;
        history.prices.push({
            price: currentPrice,
            timestamp: new Date()
        });
        
        // 最新20件のみ保持（メモリ節約）
        if (history.prices.length > 20) {
            history.prices = history.prices.slice(-20);
        }
    }

    // 急落チェック
    private async checkForPriceDrop(symbol: string, currentPrice: number): Promise<void> {
        const history = this.priceHistory.get(symbol);
        if (!history || history.prices.length < 2) return;
        
        // 5分前、10分前、30分前の価格と比較
        const now = new Date().getTime();
        const timeframes = [
            { minutes: 5, label: '5分' },
            { minutes: 10, label: '10分' },
            { minutes: 30, label: '30分' }
        ];
        
        for (const timeframe of timeframes) {
            const targetTime = now - (timeframe.minutes * 60 * 1000);
            const pastPrice = this.findPriceAtTime(history.prices, targetTime);
            
            if (pastPrice) {
                const dropPercentage = ((pastPrice - currentPrice) / pastPrice) * 100;
                
                // 閾値を超えた急落を検知
                if (dropPercentage >= this.dropThreshold) {
                    // クールダウンチェック
                    if (this.canSendNotification(symbol)) {
                        console.log(`🚨 ${symbol} が${timeframe.label}で${dropPercentage.toFixed(2)}%下落！`);
                        
                        // Telegram通知（AI分析なし、コスト0！）
                        await telegramService.sendPriceDropAlert(
                            symbol,
                            currentPrice,
                            pastPrice,
                            dropPercentage,
                            timeframe.label
                        );
                        
                        // クールダウン設定
                        this.setNotificationCooldown(symbol);
                        
                        // 最も大きな下落のみ通知するためbreak
                        break;
                    }
                }
            }
        }
    }

    // 指定時刻に最も近い価格を検索
    private findPriceAtTime(prices: Array<{price: number, timestamp: Date}>, targetTime: number): number | null {
        let closestPrice = null;
        let closestTimeDiff = Infinity;
        
        for (const pricePoint of prices) {
            const timeDiff = Math.abs(pricePoint.timestamp.getTime() - targetTime);
            if (timeDiff < closestTimeDiff && timeDiff < 60000) { // 1分以内の誤差を許容
                closestPrice = pricePoint.price;
                closestTimeDiff = timeDiff;
            }
        }
        
        return closestPrice;
    }

    // 通知可能かチェック
    private canSendNotification(symbol: string): boolean {
        const lastNotification = this.notificationCooldown.get(symbol);
        if (!lastNotification) return true;
        
        const now = Date.now();
        return (now - lastNotification) > (this.cooldownMinutes * 60 * 1000);
    }

    // 通知クールダウンを設定
    private setNotificationCooldown(symbol: string): void {
        this.notificationCooldown.set(symbol, Date.now());
    }

    // ステータス取得
    getStatus(): {
        isMonitoring: boolean;
        monitoredSymbols: string[];
        dropThreshold: number;
        priceHistorySize: number;
    } {
        return {
            isMonitoring: this.monitoringInterval !== null,
            monitoredSymbols: Array.from(this.monitoredSymbols),
            dropThreshold: this.dropThreshold,
            priceHistorySize: this.priceHistory.size
        };
    }
}

export const priceMonitorService = new PriceMonitorService();