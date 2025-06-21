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
}

export const technicalAnalysisService = new TechnicalAnalysisService();