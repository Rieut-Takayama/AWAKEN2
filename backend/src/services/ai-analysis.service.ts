import Anthropic from '@anthropic-ai/sdk';
import { mexcService } from './mexc.service';
import { telegramService } from './telegram.service';
import { technicalAnalysisService } from './technical-analysis.service';
import { databaseService } from './database.service';

interface AnalysisResult {
    symbol: string;
    score: number;
    recommendation: 'BUY' | 'HOLD' | 'SELL';
    reasoning: string;
    keyFactors: string[];  // 主要な判断根拠（最大3つ）
    timestamp: Date;
}

export class AIAnalysisService {
    private anthropic: Anthropic | null = null;
    private userApiKey: string | null = null;
    private scoreThreshold: number = 75;
    private notificationInterval: number = 60; // 通知間隔（分）
    private notificationHistory: Map<string, number> = new Map(); // 通知履歴
    private notificationsEnabled: boolean = false; // 通知機能の有効/無効
    private dailyNotificationCount: Map<string, { count: number; date: string }> = new Map(); // 日別通知数
    private quietHoursStart: number = 0; // 通知しない時間帯の開始（0-23）
    private quietHoursEnd: number = 6; // 通知しない時間帯の終了（0-23）
    private analysisInterval: NodeJS.Timeout | null = null; // リアルタイム分析のインターバル

    constructor() {
        // ユーザーごとのAPIキーを使うので、ここでは初期化しない
    }
    
    // ユーザーのAPIキーを設定
    setUserApiKey(apiKey: string): void {
        this.userApiKey = apiKey;
        this.anthropic = new Anthropic({
            apiKey: apiKey
        });
    }

    // 価格データをAIで分析してスコアを算出
    async analyzePrice(symbol: string, priceData: any): Promise<AnalysisResult> {
        try {
            // ローソク足データ取得
            const candles = await mexcService.getCandleData(symbol, '5m', 100);
            
            // テクニカル指標計算
            const indicators = technicalAnalysisService.calculateAllIndicators(candles);
            const buySignals = technicalAnalysisService.generateBuySignals(indicators, priceData.price);
            
            // 🎯 買いシグナルが出ていない時はAI分析をスキップしてコスト大幅削減！
            const currentPrice = priceData.price;
            const bbPercentage = ((currentPrice - indicators.bollingerBands.lower) / (indicators.bollingerBands.upper - indicators.bollingerBands.lower)) * 100;
            
            // 買いシグナルの条件チェック（BB下限ブレイク重視！）
            const hasBuySignal = 
                bbPercentage < 5 ||   // BB下限に非常に近い、またはブレイク（下から5%以内）
                (bbPercentage < 10 && indicators.rsi < 30) ||  // BB下限近く＋RSI売られすぎ
                (bbPercentage < 15 && indicators.volumeAnalysis.volumeRatio > 2.0); // BB下限付近＋出来高急増
            
            if (!hasBuySignal) {
                console.log(`📊 ${symbol}に買いシグナルなし（RSI:${indicators.rsi.toFixed(1)}, BB位置:${bbPercentage.toFixed(1)}%）AI分析スキップでコスト削減！`);
                
                // 買いシグナルがない時の簡易レスポンス
                const analysis: any = {
                    symbol: symbol,
                    price: priceData.price,
                    change24h: priceData.change24h || 0,
                    volume24h: priceData.volume || 0,
                    score: 30, // 低スコア
                    recommendation: 'HOLD',
                    confidence: 0.9,
                    reasoning: '買いシグナルが出ていません。次のチャンスを待ちましょう。',
                    indicators: {
                        rsi: { value: indicators.rsi, signal: 'neutral' },
                        macd: indicators.macd,
                        bb: indicators.bollingerBands,
                        bbPosition: bbPercentage
                    },
                    timestamp: new Date(),
                    isSimpleAnalysis: true,
                    skipReason: 'no_buy_signal'
                };
                
                return analysis;
            }
            
            console.log(`🔥 ${symbol}に買いシグナル検出！（BB位置:${bbPercentage.toFixed(1)}%, RSI:${indicators.rsi.toFixed(1)}）AI詳細分析を実行`);
            
            
            const prompt = `
短期トレード専門の仮想通貨トレーダーとして、以下のデータから1-3%の利益を狙えるエントリーポイントを判断して0-100点で採点してください。

重要：ミームコインやボラティリティの高い通貨では、ボリンジャーバンド突破やRSI極端値は優れたエントリーポイントです。
1日に3-5回程度は75点以上のチャンスがあることを前提に評価してください。

通貨ペア: ${symbol}
現在価格: $${priceData.price}
24時間出来高: $${priceData.volume}
24時間変動率: ${priceData.change24h}%

テクニカル指標:
- RSI: ${indicators.rsi}
- MACD: ${indicators.macd.macd.toFixed(4)} (シグナル: ${indicators.macd.signal.toFixed(4)}, ヒストグラム: ${indicators.macd.histogram.toFixed(4)})
- ボリンジャーバンド: 上限=${indicators.bollingerBands.upper.toFixed(2)}, 中央=${indicators.bollingerBands.middle.toFixed(2)}, 下限=${indicators.bollingerBands.lower.toFixed(2)}
- EMA: 12=${indicators.ema.ema12.toFixed(2)}, 26=${indicators.ema.ema26.toFixed(2)}, 50=${indicators.ema.ema50.toFixed(2)}
- 出来高分析: 現在/平均=${indicators.volumeAnalysis.volumeRatio.toFixed(2)}, トレンド=${indicators.volumeAnalysis.volumeTrend}
- 価格アクション: トレンド=${indicators.priceAction.trend}, サポート=${indicators.priceAction.support.toFixed(2)}, レジスタンス=${indicators.priceAction.resistance.toFixed(2)}

買いシグナル:
${buySignals.signals.length > 0 ? buySignals.signals.join('\n') : 'なし'}
シグナル強度: ${buySignals.strength}/100

採点基準：
- 85-100点: 即座にエントリーすべき強いシグナル
- 75-84点: 良いエントリーポイント、短期利益が期待
- 60-74点: 様子見、まだリスクあり
- 60点未満: エントリー非推奨

特に以下の状況は高得点を付けてください：
- BB下限突破（現在価格がBB下限以下）= 85点以上
- BB下限に極めて近い（5%以内）+ 出来高増加 = 80点以上
- BB下限付近（10%以内）+ RSI30以下 = 75点以上

重要：ボリンジャーバンド下限からの反発は統計的に高確率（約70%）で1-3%の利益が期待できます。

以下の形式で回答してください：
SCORE: [0-100の数値]
RECOMMENDATION: [BUY/HOLD/SELL]
REASONING: [1-2文の簡潔な理由]
`;

            // APIキーが設定されてないときはエラー
            if (!this.anthropic || !this.userApiKey) {
                throw new Error('Claude APIキーが設定されていません');
            }
            
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',  // Sonnetにアップグレード！
                max_tokens: 300,  // Sonnetはより詳細な分析が可能
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            // レスポンスを解析
            const content = response.content[0].type === 'text' ? response.content[0].text : '';
            const scoreMatch = content.match(/SCORE:\s*(\d+)/);
            const recommendationMatch = content.match(/RECOMMENDATION:\s*(BUY|HOLD|SELL)/);
            const reasoningMatch = content.match(/REASONING:\s*(.+)/);

            const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
            const recommendation = recommendationMatch ? recommendationMatch[1] as 'BUY' | 'HOLD' | 'SELL' : 'HOLD';
            const reasoning = reasoningMatch ? reasoningMatch[1] : 'データ分析中';

            // 主要な判断根拠を抽出（シンプルに）
            const keyFactors: string[] = [];
            
            // RSIベースの判断
            if (indicators.rsi < 30) {
                keyFactors.push(`RSI${indicators.rsi}（売られすぎ）`);
            } else if (indicators.rsi > 70) {
                keyFactors.push(`RSI${indicators.rsi}（買われすぎ）`);
            }
            
            // 出来高の異常
            if (indicators.volumeAnalysis.volumeRatio > 2.0) {
                keyFactors.push(`出来高${indicators.volumeAnalysis.volumeRatio.toFixed(1)}倍`);
            }
            
            // 価格位置
            if (priceData.price < indicators.bollingerBands.lower) {
                keyFactors.push('BB下限突破');
            } else if (priceData.price > indicators.bollingerBands.upper) {
                keyFactors.push('BB上限突破');
            }
            
            // トレンド
            if (indicators.priceAction.trend === 'bullish' && buySignals.strength > 60) {
                keyFactors.push('強い上昇トレンド');
            }

            // 最大3つまで
            const topFactors = keyFactors.slice(0, 3);

            return {
                symbol,
                score,
                recommendation,
                reasoning,
                keyFactors: topFactors,
                timestamp: new Date()
            };
        } catch (error) {
            console.error('AI分析エラー:', error);
            // エラー時はエラーであることを明示
            const errorMessage = error instanceof Error ? error.message : '不明なエラー';
            throw new Error(`AI分析中にエラーが発生しました: ${errorMessage}`);
        }
    }

    // 複数通貨を分析
    async analyzeMultipleCurrencies(symbols: string[]): Promise<AnalysisResult[]> {
        const priceDataList = await mexcService.getMultipleTickerPrices(symbols);
        const results: AnalysisResult[] = [];

        for (const priceData of priceDataList) {
            const analysis = await this.analyzePrice(priceData.symbol, priceData);
            results.push(analysis);

            // 高スコアの場合は通知（制限付き）
            if (analysis.score >= this.scoreThreshold && this.notificationsEnabled) {
                const now = Date.now();
                const nowDate = new Date();
                const currentHour = nowDate.getHours();
                const today = nowDate.toDateString();
                
                // 通知しない時間帯チェック
                const inQuietHours = this.quietHoursStart <= this.quietHoursEnd 
                    ? (currentHour >= this.quietHoursStart && currentHour < this.quietHoursEnd)
                    : (currentHour >= this.quietHoursStart || currentHour < this.quietHoursEnd);
                    
                if (inQuietHours) {
                    console.log(`🤫 静かな時間帯（${this.quietHoursStart}時-${this.quietHoursEnd}時）なので通知をスキップ`);
                } else {
                    // 1日5回制限チェック
                    const userKey = 'global'; // 後でユーザーごとに変更可能
                    const dailyData = this.dailyNotificationCount.get(userKey);
                    
                    if (dailyData && dailyData.date === today && dailyData.count >= 5) {
                        console.log(`🛑 本日の通知上限（5回）に達しました`);
                    } else {
                        // 通知間隔チェック
                        const lastNotified = this.notificationHistory.get(analysis.symbol) || 0;
                        
                        if (now - lastNotified > this.notificationInterval * 60 * 1000) {
                            await telegramService.sendHighScoreAlert(
                                analysis.symbol,
                                analysis.score,
                                priceData.price,
                                `${priceData.change24h > 0 ? '+' : ''}${priceData.change24h}%`,
                                analysis.keyFactors // 判断根拠を渡す
                            );
                            this.notificationHistory.set(analysis.symbol, now);
                            
                            // 日別カウントを更新
                            if (!dailyData || dailyData.date !== today) {
                                this.dailyNotificationCount.set(userKey, { count: 1, date: today });
                            } else {
                                this.dailyNotificationCount.set(userKey, { 
                                    count: dailyData.count + 1, 
                                    date: today 
                                });
                            }
                            
                            console.log(`📨 通知送信完了！本日${this.dailyNotificationCount.get(userKey)?.count}/5回`);
                        }
                    }
                }
            }
            
            // 分析結果をRedisにキャッシュ（5分間！）
            const redis = databaseService.getRedisClient();
            if (redis) {
                await redis.setex(
                    `analysis:${analysis.symbol}`,
                    300, // 30秒→5分（300秒）キャッシュ！コスト大幅削減だ！
                    JSON.stringify(analysis)
                );
            }

            // レート制限を考慮して少し待機
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        return results;
    }

    // スコア閾値を設定
    setScoreThreshold(threshold: number): void {
        this.scoreThreshold = threshold;
    }
    
    // 通知間隔を設定（分単位）
    setNotificationInterval(minutes: number): void {
        this.notificationInterval = minutes;
        console.log(`通知間隔を${minutes}分に設定しました`);
    }
    
    // 通知機能の有効化/無効化
    setNotificationsEnabled(enabled: boolean): void {
        this.notificationsEnabled = enabled;
        console.log(`通知機能を${enabled ? '有効' : '無効'}にしました`);
    }
    
    // 通知機能の現在の状態を取得
    getNotificationsEnabled(): boolean {
        return this.notificationsEnabled;
    }
    
    // 通知しない時間帯を設定
    setQuietHours(start: number, end: number): void {
        this.quietHoursStart = start;
        this.quietHoursEnd = end;
        console.log(`🌙 ${start}時から${end}時は通知しません`);
    }
    
    // 今日の通知回数を取得
    getDailyNotificationCount(userKey: string = 'global'): number {
        const today = new Date().toDateString();
        const dailyData = this.dailyNotificationCount.get(userKey);
        return (dailyData && dailyData.date === today) ? dailyData.count : 0;
    }

    // リアルタイム監視と分析
    async startRealtimeAnalysis(symbols: string[], interval: number = 5000): Promise<void> {
        console.log(`Starting AI analysis for: ${symbols.join(', ')}`);
        console.log('💪 Telegram通知を有効化しました');
        
        // 既存の分析を停止
        this.stopRealtimeAnalysis();

        // 初回分析（通知あり）
        await this.analyzeMultipleCurrencies(symbols);

        // 定期分析（通知あり）
        this.analysisInterval = setInterval(async () => {
            console.log(`🔥 AI分析実行中 ${new Date().toISOString()}`);
            await this.analyzeMultipleCurrencies(symbols);
        }, interval);
    }
    
    // リアルタイム分析を停止
    stopRealtimeAnalysis(): void {
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
            console.log('🚫 リアルタイム分析を停止しました');
        }
    }
}

export const aiAnalysisService = new AIAnalysisService();