import { mexcService } from './services/mexc.service';
import { technicalAnalysisService } from './services/technical-analysis.service';

interface BBAnalysisResult {
    symbol: string;
    timeframe: string;
    totalCandles: number;
    bbLowerBreachCount: number;
    breachPercentage: number;
    breachDetails: {
        time: Date;
        price: number;
        bbLower: number;
        breachDepth: number; // 下限からの乖離率（%）
    }[];
    currentBB: {
        upper: number;
        middle: number;
        lower: number;
    };
    currentPrice: number;
    currentPosition: number; // BBバンド内での現在位置（%）
}

async function analyzePEPEBollingerBands(): Promise<BBAnalysisResult> {
    const symbol = 'PEPEUSDT';
    const timeframe = '15m';
    const period = 20; // ボリンジャーバンドの期間
    const stdDev = 2; // 標準偏差の倍数
    
    console.log(`\n🔍 ${symbol} ${timeframe}足のボリンジャーバンド分析を開始...`);
    
    try {
        // 15分足データを取得（過去24時間 = 96本）
        const candles = await mexcService.getCandleData(symbol, timeframe, 96);
        
        if (!candles || candles.length === 0) {
            throw new Error('ローソク足データの取得に失敗しました');
        }
        
        console.log(`✅ ${candles.length}本のローソク足データを取得`);
        
        // BB下限突破の詳細を記録
        const breachDetails: BBAnalysisResult['breachDetails'] = [];
        let bbLowerBreachCount = 0;
        
        // 各時点でボリンジャーバンドを計算（最初の20本は計算できない）
        for (let i = period; i < candles.length; i++) {
            // i時点までのデータでBBを計算
            const pricesUpToNow = candles.slice(0, i + 1).map(c => c.close);
            const bb = technicalAnalysisService.calculateBollingerBands(pricesUpToNow, period, stdDev);
            
            const currentCandle = candles[i];
            const currentPrice = currentCandle.close;
            
            // BB下限突破をチェック
            if (currentPrice < bb.lower) {
                bbLowerBreachCount++;
                const breachDepth = ((bb.lower - currentPrice) / bb.lower) * 100;
                
                breachDetails.push({
                    time: new Date(currentCandle.time),
                    price: currentPrice,
                    bbLower: bb.lower,
                    breachDepth: breachDepth
                });
                
                console.log(`📉 BB下限突破検出: ${new Date(currentCandle.time).toLocaleString()} - 価格: $${currentPrice.toFixed(8)}, BB下限: $${bb.lower.toFixed(8)}, 乖離: ${breachDepth.toFixed(2)}%`);
            }
        }
        
        // 現在のボリンジャーバンドを計算
        const allPrices = candles.map(c => c.close);
        const currentBB = technicalAnalysisService.calculateBollingerBands(allPrices, period, stdDev);
        const currentPrice = candles[candles.length - 1].close;
        
        // 現在の位置を計算（0% = 下限, 100% = 上限）
        const currentPosition = ((currentPrice - currentBB.lower) / (currentBB.upper - currentBB.lower)) * 100;
        
        const result: BBAnalysisResult = {
            symbol,
            timeframe,
            totalCandles: candles.length - period, // BB計算可能な本数
            bbLowerBreachCount,
            breachPercentage: ((bbLowerBreachCount / (candles.length - period)) * 100),
            breachDetails,
            currentBB,
            currentPrice,
            currentPosition
        };
        
        // 結果サマリーを表示
        console.log('\n📊 分析結果サマリー:');
        console.log(`- 分析期間: ${new Date(candles[0].time).toLocaleString()} 〜 ${new Date(candles[candles.length - 1].time).toLocaleString()}`);
        console.log(`- 分析対象ローソク足: ${result.totalCandles}本`);
        console.log(`- BB下限突破回数: ${result.bbLowerBreachCount}回`);
        console.log(`- BB下限突破率: ${result.breachPercentage.toFixed(2)}%`);
        console.log(`\n💰 現在の状況:`);
        console.log(`- 現在価格: $${currentPrice.toFixed(8)}`);
        console.log(`- BB上限: $${currentBB.upper.toFixed(8)}`);
        console.log(`- BB中央: $${currentBB.middle.toFixed(8)}`);
        console.log(`- BB下限: $${currentBB.lower.toFixed(8)}`);
        console.log(`- BBバンド内位置: ${currentPosition.toFixed(2)}% (0%=下限, 100%=上限)`);
        
        if (currentPosition < 20) {
            console.log(`⚠️  現在価格はBB下限付近にあります！`);
        } else if (currentPosition > 80) {
            console.log(`⚠️  現在価格はBB上限付近にあります！`);
        }
        
        // 最近の突破情報
        if (breachDetails.length > 0) {
            console.log(`\n🕒 直近のBB下限突破:`);
            const recentBreaches = breachDetails.slice(-3); // 最後の3回
            recentBreaches.forEach(breach => {
                console.log(`  - ${breach.time.toLocaleString()}: 価格 $${breach.price.toFixed(8)} (乖離 ${breach.breachDepth.toFixed(2)}%)`);
            });
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ エラーが発生しました:', error);
        throw error;
    }
}

// 実行
if (require.main === module) {
    analyzePEPEBollingerBands()
        .then(result => {
            console.log('\n✅ 分析完了');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ 分析失敗:', error);
            process.exit(1);
        });
}

export { analyzePEPEBollingerBands };