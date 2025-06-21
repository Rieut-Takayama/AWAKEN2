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

class AIAnalysisService {
    private anthropic: Anthropic;
    private scoreThreshold: number = 75;
    private notificationInterval: number = 60; // 通知間隔（分）
    private notificationHistory: Map<string, number> = new Map(); // 通知履歴
    private notificationsEnabled: boolean = false; // 通知機能の有効/無効

    constructor() {
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY || ''
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
            
            const prompt = `
仮想通貨取引の専門家として、以下の詳細なテクニカルデータを分析し、0-100点の買い度スコアを算出してください。

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

以下の形式で回答してください：
SCORE: [0-100の数値]
RECOMMENDATION: [BUY/HOLD/SELL]
REASONING: [1-2文の簡潔な理由]
`;

            const response = await this.anthropic.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: 200,
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
            console.error('AI analysis error:', error);
            // エラー時は中立的な値を返す
            return {
                symbol,
                score: 50,
                recommendation: 'HOLD',
                reasoning: '分析エラー',
                keyFactors: [],
                timestamp: new Date()
            };
        }
    }

    // 複数通貨を分析
    async analyzeMultipleCurrencies(symbols: string[]): Promise<AnalysisResult[]> {
        const priceDataList = await mexcService.getMultipleTickerPrices(symbols);
        const results: AnalysisResult[] = [];

        for (const priceData of priceDataList) {
            const analysis = await this.analyzePrice(priceData.symbol, priceData);
            results.push(analysis);

            // 高スコアの場合は通知（60分に1回まで）
            if (analysis.score >= this.scoreThreshold) {
                const lastNotified = this.notificationHistory.get(analysis.symbol) || 0;
                const now = Date.now();
                
                // 60分以上経過している場合のみ通知
                if (now - lastNotified > 60 * 60 * 1000) {
                    await telegramService.sendHighScoreAlert(
                        analysis.symbol,
                        analysis.score,
                        priceData.price,
                        `${priceData.change24h > 0 ? '+' : ''}${priceData.change24h}%`,
                        analysis.keyFactors // 判断根拠を渡す
                    );
                    this.notificationHistory.set(analysis.symbol, now);
                }
            }
            
            // 分析結果をRedisにキャッシュ
            const redis = databaseService.getRedisClient();
            if (redis) {
                await redis.setex(
                    `analysis:${analysis.symbol}`,
                    30, // 30秒キャッシュ
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

    // リアルタイム監視と分析
    async startRealtimeAnalysis(symbols: string[], interval: number = 5000): Promise<void> {
        console.log(`Starting AI analysis for: ${symbols.join(', ')}`);
        console.log('⚠️ Telegram通知は一時的に無効化されています');

        // 初回分析（通知なし）
        // await this.analyzeMultipleCurrencies(symbols);

        // 定期分析（通知なし）
        setInterval(async () => {
            console.log(`Running AI analysis at ${new Date().toISOString()}`);
            // await this.analyzeMultipleCurrencies(symbols);
        }, interval);
    }
}

export const aiAnalysisService = new AIAnalysisService();