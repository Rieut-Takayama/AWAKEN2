interface CandleData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface TechnicalIndicators {
    rsi: number;
    macd: {
        macd: number;
        signal: number;
        histogram: number;
    };
    bollingerBands: {
        upper: number;
        middle: number;
        lower: number;
    };
    ema: {
        ema12: number;
        ema26: number;
        ema50: number;
    };
    volumeAnalysis: {
        volumeRatio: number; // 現在の出来高 / 平均出来高
        volumeTrend: 'increasing' | 'decreasing' | 'stable';
    };
    priceAction: {
        trend: 'bullish' | 'bearish' | 'sideways';
        support: number;
        resistance: number;
    };
}

interface MultiTimeframeAnalysis {
    timeframe: string;
    priority: number;
    indicators: TechnicalIndicators;
    score: number;
    weight: number;
}

export class TechnicalAnalysisService {
    // RSI計算（14期間）
    calculateRSI(prices: number[], period: number = 14): number {
        if (prices.length < period + 1) return 50;

        let gains = 0;
        let losses = 0;

        for (let i = 1; i <= period; i++) {
            const difference = prices[i] - prices[i - 1];
            if (difference > 0) {
                gains += difference;
            } else {
                losses -= difference;
            }
        }

        const avgGain = gains / period;
        const avgLoss = losses / period;

        if (avgLoss === 0) return 100;

        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));

        return Math.round(rsi);
    }

    // MACD計算
    calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
        const ema12 = this.calculateEMA(prices, 12);
        const ema26 = this.calculateEMA(prices, 26);
        const macd = ema12 - ema26;

        // Signal line (9-period EMA of MACD)
        const macdValues = [];
        for (let i = 26; i < prices.length; i++) {
            const shortEMA = this.calculateEMA(prices.slice(0, i + 1), 12);
            const longEMA = this.calculateEMA(prices.slice(0, i + 1), 26);
            macdValues.push(shortEMA - longEMA);
        }

        const signal = this.calculateEMA(macdValues, 9);
        const histogram = macd - signal;

        return { macd, signal, histogram };
    }

    // EMA計算
    calculateEMA(prices: number[], period: number): number {
        if (prices.length < period) return prices[prices.length - 1];

        const k = 2 / (period + 1);
        let ema = prices[0];

        for (let i = 1; i < prices.length; i++) {
            ema = prices[i] * k + ema * (1 - k);
        }

        return ema;
    }

    // ボリンジャーバンド計算
    calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): {
        upper: number;
        middle: number;
        lower: number;
    } {
        const sma = prices.slice(-period).reduce((a, b) => a + b, 0) / period;
        
        const variance = prices.slice(-period).reduce((sum, price) => {
            return sum + Math.pow(price - sma, 2);
        }, 0) / period;
        
        const standardDeviation = Math.sqrt(variance);

        return {
            upper: sma + (standardDeviation * stdDev),
            middle: sma,
            lower: sma - (standardDeviation * stdDev)
        };
    }

    // 出来高分析
    analyzeVolume(volumes: number[]): { volumeRatio: number; volumeTrend: 'increasing' | 'decreasing' | 'stable' } {
        const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
        const currentVolume = volumes[volumes.length - 1];
        const volumeRatio = currentVolume / avgVolume;

        // 直近5期間の出来高トレンド
        const recentVolumes = volumes.slice(-5);
        let increasing = 0;
        for (let i = 1; i < recentVolumes.length; i++) {
            if (recentVolumes[i] > recentVolumes[i - 1]) increasing++;
        }

        let volumeTrend: 'increasing' | 'decreasing' | 'stable';
        if (increasing >= 3) volumeTrend = 'increasing';
        else if (increasing <= 1) volumeTrend = 'decreasing';
        else volumeTrend = 'stable';

        return { volumeRatio, volumeTrend };
    }

    // 価格アクション分析
    analyzePriceAction(candles: CandleData[]): {
        trend: 'bullish' | 'bearish' | 'sideways';
        support: number;
        resistance: number;
    } {
        const closes = candles.map(c => c.close);
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);

        // トレンド判定（単純移動平均を使用）
        const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
        const sma50 = closes.slice(-50).reduce((a, b) => a + b, 0) / 50;
        const currentPrice = closes[closes.length - 1];

        let trend: 'bullish' | 'bearish' | 'sideways';
        if (currentPrice > sma20 && sma20 > sma50) trend = 'bullish';
        else if (currentPrice < sma20 && sma20 < sma50) trend = 'bearish';
        else trend = 'sideways';

        // サポート・レジスタンス（直近の高値・安値）
        const recentHighs = highs.slice(-20);
        const recentLows = lows.slice(-20);
        const resistance = Math.max(...recentHighs);
        const support = Math.min(...recentLows);

        return { trend, support, resistance };
    }

    // 全インジケーター計算
    calculateAllIndicators(candles: CandleData[]): TechnicalIndicators {
        const closes = candles.map(c => c.close);
        const volumes = candles.map(c => c.volume);

        return {
            rsi: this.calculateRSI(closes),
            macd: this.calculateMACD(closes),
            bollingerBands: this.calculateBollingerBands(closes),
            ema: {
                ema12: this.calculateEMA(closes, 12),
                ema26: this.calculateEMA(closes, 26),
                ema50: this.calculateEMA(closes, 50)
            },
            volumeAnalysis: this.analyzeVolume(volumes),
            priceAction: this.analyzePriceAction(candles)
        };
    }

    // 買いシグナル判定
    generateBuySignals(indicators: TechnicalIndicators, currentPrice: number): {
        signals: string[];
        strength: number; // 0-100
    } {
        const signals: string[] = [];
        let strength = 0;

        // RSIシグナル
        if (indicators.rsi < 30) {
            signals.push('RSI売られすぎ');
            strength += 20;
        } else if (indicators.rsi < 40) {
            signals.push('RSI低水準');
            strength += 10;
        }

        // MACDシグナル
        if (indicators.macd.histogram > 0 && indicators.macd.macd > indicators.macd.signal) {
            signals.push('MACD買いシグナル');
            strength += 20;
        }

        // ボリンジャーバンド
        if (currentPrice < indicators.bollingerBands.lower) {
            signals.push('ボリンジャーバンド下限突破');
            strength += 15;
        }

        // 移動平均線
        if (indicators.ema.ema12 > indicators.ema.ema26) {
            signals.push('ゴールデンクロス形成');
            strength += 15;
        }

        // 出来高
        if (indicators.volumeAnalysis.volumeRatio > 1.5 && indicators.volumeAnalysis.volumeTrend === 'increasing') {
            signals.push('出来高急増');
            strength += 20;
        }

        // トレンド
        if (indicators.priceAction.trend === 'bullish') {
            signals.push('上昇トレンド');
            strength += 10;
        }

        return { signals, strength: Math.min(strength, 100) };
    }

    // 複数時間足の複合分析（優先度順：15m, 30m, 1h, 1d, 5m）
    analyzeMultiTimeframe(multiTimeframeData: {[key: string]: CandleData[]}): {
        analyses: MultiTimeframeAnalysis[],
        finalScore: number,
        recommendation: 'BUY' | 'SELL' | 'HOLD',
        reasoning: string,
        keyFactors: string[]
    } {
        // 時間足の優先度と重み（指定された順序）
        const timeframeConfig = {
            '15m': { priority: 1, weight: 0.30 },  // 15分足: 最優先
            '30m': { priority: 2, weight: 0.25 },  // 30分足: 2番目
            '1h':  { priority: 3, weight: 0.20 },  // 1時間足: 3番目
            '1d':  { priority: 4, weight: 0.15 },  // 日足: 4番目
            '5m':  { priority: 5, weight: 0.10 }   // 5分足: 最後
        };

        const analyses: MultiTimeframeAnalysis[] = [];

        // 各時間足を分析
        for (const [timeframe, candles] of Object.entries(multiTimeframeData)) {
            if (candles && candles.length > 0) {
                const indicators = this.calculateAllIndicators(candles);
                const score = this.calculateTimeframeScore(indicators, candles);
                const config = timeframeConfig[timeframe as keyof typeof timeframeConfig];

                analyses.push({
                    timeframe,
                    priority: config?.priority || 99,
                    indicators,
                    score,
                    weight: config?.weight || 0.05
                });
            }
        }

        // 優先度順にソート
        analyses.sort((a, b) => a.priority - b.priority);

        // 重み付き最終スコア計算
        let finalScore = 0;
        let totalWeight = 0;

        analyses.forEach(analysis => {
            finalScore += analysis.score * analysis.weight;
            totalWeight += analysis.weight;
        });

        finalScore = totalWeight > 0 ? Math.round(finalScore / totalWeight) : 50;

        // 推奨アクション決定
        let recommendation: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
        if (finalScore >= 75) recommendation = 'BUY';
        else if (finalScore <= 35) recommendation = 'SELL';

        // 理由とキーファクター生成
        const { reasoning, keyFactors } = this.generateDetailedReasoning(analyses, finalScore);

        return {
            analyses,
            finalScore,
            recommendation,
            reasoning,
            keyFactors
        };
    }

    // 時間足別スコア計算
    private calculateTimeframeScore(indicators: TechnicalIndicators, candles: CandleData[]): number {
        const currentPrice = candles[candles.length - 1].close;
        
        // RSIスコア（売られすぎを重視）
        let rsiScore = 50;
        if (indicators.rsi <= 25) rsiScore = 100;
        else if (indicators.rsi <= 30) rsiScore = 90;
        else if (indicators.rsi <= 35) rsiScore = 80;
        else if (indicators.rsi <= 40) rsiScore = 70;
        else if (indicators.rsi >= 75) rsiScore = 20;
        else if (indicators.rsi >= 70) rsiScore = 30;

        // MACDスコア（ゴールデンクロスを重視）
        let macdScore = 50;
        if (indicators.macd.histogram > 0 && indicators.macd.macd > indicators.macd.signal) {
            macdScore = 80; // 上昇トレンド
        } else if (indicators.macd.histogram < 0) {
            macdScore = 30; // 下降トレンド
        }

        // BBスコア（下限突破を最重視）
        let bbScore = 50;
        const bbPosition = ((currentPrice - indicators.bollingerBands.lower) / 
                           (indicators.bollingerBands.upper - indicators.bollingerBands.lower)) * 100;
        
        if (bbPosition <= 5) bbScore = 100;      // 下限大幅突破
        else if (bbPosition <= 10) bbScore = 90; // 下限突破
        else if (bbPosition <= 20) bbScore = 80; // 下限付近
        else if (bbPosition <= 30) bbScore = 70;
        else if (bbPosition >= 80) bbScore = 30; // 上限付近
        else if (bbPosition >= 90) bbScore = 20; // 上限突破

        // 出来高スコア（爆発的出来高を重視）
        let volumeScore = 50;
        if (indicators.volumeAnalysis.volumeRatio >= 3) volumeScore = 90;
        else if (indicators.volumeAnalysis.volumeRatio >= 2) volumeScore = 80;
        else if (indicators.volumeAnalysis.volumeRatio >= 1.5) volumeScore = 70;
        else if (indicators.volumeAnalysis.volumeRatio < 0.5) volumeScore = 30;

        // 仮想通貨の特性を考慮した新しい重み配分
        // BBは重要だが、他の指標も組み合わせてバランスを取る
        const weights = {
            bb: 0.40,      // BB: 40%（依然重要だが単独支配を避ける）
            rsi: 0.25,     // RSI: 25%（売られすぎは重要なシグナル）
            macd: 0.20,    // MACD: 20%（トレンド方向の確認）
            volume: 0.15   // Volume: 15%（出来高は補助的だが重要）
        };

        // さらに、複数の条件が揃った場合のボーナススコアを追加
        let bonusScore = 0;
        
        // ダブルボトム形成（BB下限突破 + RSI売られすぎ）
        if (bbPosition <= 20 && indicators.rsi <= 35) {
            bonusScore += 10;
        }
        
        // トリプルシグナル（BB + RSI + 出来高増加）
        if (bbPosition <= 30 && indicators.rsi <= 40 && indicators.volumeAnalysis.volumeRatio >= 1.5) {
            bonusScore += 15;
        }
        
        // パーフェクトストーム（全指標が買いシグナル）
        if (bbScore >= 80 && rsiScore >= 80 && macdScore >= 70 && volumeScore >= 70) {
            bonusScore += 20;
        }

        // 基本スコア計算
        const baseScore = Math.round(
            rsiScore * weights.rsi +
            macdScore * weights.macd +
            bbScore * weights.bb +
            volumeScore * weights.volume
        );

        // 最終スコア（ボーナスを加算、ただし100を超えない）
        return Math.min(baseScore + bonusScore, 100);
    }

    // 詳細な分析理由の生成
    private generateDetailedReasoning(analyses: MultiTimeframeAnalysis[], finalScore: number): {
        reasoning: string,
        keyFactors: string[]
    } {
        const keyFactors: string[] = [];
        
        // 各時間足の主要シグナルを収集
        analyses.forEach(analysis => {
            const currentPrice = analysis.indicators.bollingerBands.middle; // 仮の現在価格
            const bbPosition = ((currentPrice - analysis.indicators.bollingerBands.lower) / 
                               (analysis.indicators.bollingerBands.upper - analysis.indicators.bollingerBands.lower)) * 100;

            // BB下限突破
            if (bbPosition <= 10) {
                keyFactors.push(`${analysis.timeframe}足でBB下限突破（${bbPosition.toFixed(1)}%位置）`);
            }
            
            // RSI売られすぎ
            if (analysis.indicators.rsi <= 30) {
                keyFactors.push(`${analysis.timeframe}足でRSI売られすぎ（${analysis.indicators.rsi}）`);
            }
            
            // MACD買いシグナル
            if (analysis.indicators.macd.histogram > 0 && analysis.indicators.macd.macd > analysis.indicators.macd.signal) {
                keyFactors.push(`${analysis.timeframe}足でMACDゴールデンクロス形成`);
            }
            
            // 出来高急増
            if (analysis.indicators.volumeAnalysis.volumeRatio >= 2) {
                keyFactors.push(`${analysis.timeframe}足で出来高${analysis.indicators.volumeAnalysis.volumeRatio.toFixed(1)}倍に急増`);
            }
        });

        // 総合判断の理由生成
        let reasoning = '';
        if (finalScore >= 75) {
            const highScoreTimeframes = analyses.filter(a => a.score >= 70).length;
            reasoning = `複数時間足分析の結果、${highScoreTimeframes}つの時間足で強い買いシグナルを検出。`;
            
            if (keyFactors.some(f => f.includes('BB下限突破'))) {
                reasoning += 'ボリンジャーバンド下限突破による統計的な反発期待。';
            }
            
            if (keyFactors.some(f => f.includes('RSI売られすぎ'))) {
                reasoning += 'RSI売られすぎ水準からの回復期待。';
            }
        } else if (finalScore <= 35) {
            reasoning = '複数時間足で売りシグナル優勢。慎重な判断が必要。';
        } else {
            reasoning = '時間足間でシグナルが混在。明確なトレンドは確認されず。';
        }

        return {
            reasoning,
            keyFactors: keyFactors.slice(0, 5) // 最大5つまで
        };
    }
}

export const technicalAnalysisService = new TechnicalAnalysisService();