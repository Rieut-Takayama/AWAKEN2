import { Router } from 'express';
import { requireAuth } from '@/common/middlewares/auth.middleware';
import { aiAnalysisService } from '@/services/ai-analysis.service';
import { mexcService } from '@/services/mexc.service';
import { databaseService } from '@/services/database.service';

const router = Router();

// リアルタイムデータ取得
router.get('/:symbol', requireAuth, async (req, res) => {
    try {
        const { symbol } = req.params;
        
        // Redisキャッシュから最新の分析結果を取得
        const redis = databaseService.getRedisClient();
        if (redis) {
            const cached = await redis.get(`analysis:${symbol}`);
            if (cached) {
                const analysis = JSON.parse(cached);
                res.json({
                    success: true,
                    data: analysis
                });
                return;
            }
        }
        
        // キャッシュがない場合は新規分析
        const priceData = await mexcService.getTickerPrice(symbol);
        const analysis = await aiAnalysisService.analyzePrice(symbol, priceData);
        
        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        console.error('リアルタイムデータ取得エラー:', error);
        res.status(500).json({
            success: false,
            error: 'データの取得に失敗しました'
        });
    }
});

export const realtimeRoutes = router;