import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { databaseService } from './services/database.service';
import { mexcService } from './services/mexc.service';
import { telegramService } from './services/telegram.service';
import { aiAnalysisService } from './services/ai-analysis.service';

// 環境変数読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 認証エンドポイント
app.post('/api/auth/trial', (req, res) => {
    const { passkey } = req.body;
    const validKeys = process.env.TRIAL_KEYS?.split(',') || [];
    
    if (validKeys.includes(passkey)) {
        res.json({
            success: true,
            token: 'trial-token-' + Date.now(),
            message: 'トライアル認証成功'
        });
    } else {
        res.status(401).json({
            success: false,
            message: '無効なパスキーです'
        });
    }
});

// リアルタイム価格取得API
app.get('/api/prices/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const priceData = await mexcService.getTickerPrice(symbol);
        
        if (priceData) {
            res.json({
                success: true,
                data: priceData
            });
        } else {
            res.status(404).json({
                success: false,
                message: '価格データが見つかりません'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'サーバーエラー'
        });
    }
});

// AI分析結果取得API
app.post('/api/analyze', async (req, res) => {
    try {
        const { symbols } = req.body;
        
        if (!Array.isArray(symbols) || symbols.length === 0) {
            return res.status(400).json({
                success: false,
                message: '通貨ペアを指定してください'
            });
        }

        const results = await aiAnalysisService.analyzeMultipleCurrencies(symbols);
        
        return res.json({
            success: true,
            data: results
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'AI分析エラー'
        });
    }
});

// リアルタイム分析データ取得API
app.get('/api/realtime/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        
        // キャッシュから最新の分析結果を取得
        const redis = databaseService.getRedisClient();
        if (redis) {
            const cached = await redis.get(`analysis:${symbol}`);
            if (cached) {
                return res.json({
                    success: true,
                    data: JSON.parse(cached)
                });
            }
        }
        
        // キャッシュがなければ新規分析
        const priceData = await mexcService.getTickerPrice(symbol);
        if (priceData) {
            const analysis = await aiAnalysisService.analyzePrice(symbol, priceData);
            return res.json({
                success: true,
                data: analysis
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'データが見つかりません'
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: '分析エラー'
        });
    }
});

// 設定更新API
app.post('/api/settings', async (req, res) => {
    try {
        const { threshold, symbols, interval, notificationInterval, notificationsEnabled } = req.body;
        
        if (threshold !== undefined) {
            aiAnalysisService.setScoreThreshold(threshold);
        }
        
        if (notificationInterval !== undefined) {
            aiAnalysisService.setNotificationInterval(notificationInterval);
        }
        
        if (notificationsEnabled !== undefined) {
            aiAnalysisService.setNotificationsEnabled(notificationsEnabled);
        }
        
        res.json({
            success: true,
            message: '設定を更新しました'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '設定更新エラー'
        });
    }
});

// Telegram接続テストAPI
app.post('/api/telegram/test', async (req, res) => {
    try {
        const { token, chatId } = req.body;
        
        if (!token || !chatId) {
            return res.status(400).json({
                success: false,
                message: 'トークンとチャットIDが必要です'
            });
        }
        
        // 一時的にトークンとチャットIDを設定してテスト
        const testResult = await telegramService.testConnectionWithCredentials(token, chatId);
        
        if (testResult) {
            return res.json({
                success: true,
                message: 'Telegram接続成功'
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Telegram接続に失敗しました。トークンとチャットIDを確認してください。'
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'テスト中にエラーが発生しました'
        });
    }
});

// システムヘルスチェック（MongoDBとRedisの表示を削除）
app.get('/api/system/health', async (req, res) => {
    const telegramStatus = await telegramService.testConnection();
    
    res.json({
        status: 'healthy',
        services: {
            telegram: telegramStatus ? 'connected' : 'disconnected',
            mexc: 'active',
            ai: 'active'
        },
        timestamp: new Date()
    });
});

// フロントエンドルーティング
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// サーバー起動
async function startServer() {
    try {
        // データベース接続（内部で使用、ユーザーには見せない）
        await databaseService.initialize();
        console.log('✅ Internal services initialized');
        
        // Telegram接続テスト
        const telegramConnected = await telegramService.testConnection();
        if (telegramConnected) {
            console.log('✅ Telegram bot connected');
        }
        
        // デフォルト監視通貨
        const defaultSymbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'];
        
        // リアルタイム監視開始
        setTimeout(() => {
            console.log('Starting real-time monitoring...');
            aiAnalysisService.startRealtimeAnalysis(defaultSymbols, 5000);
        }, 5000);
        
        app.listen(PORT, () => {
            console.log(`✅ Server running at http://localhost:${PORT}`);
            console.log('🚀 AWAKEN2 is ready for cryptocurrency analysis!');
        });
    } catch (error) {
        console.error('❌ Server startup error:', error);
        process.exit(1);
    }
}

// グレースフルシャットダウン
process.on('SIGINT', async () => {
    console.log('\nShutting down server...');
    await databaseService.close();
    process.exit(0);
});

// サーバー起動
startServer();