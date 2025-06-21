import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

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
    const validKeys = process.env.TRIAL_KEYS?.split(',') || ['TRIAL2025', 'AWAKEN2'];
    
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

// モックデータ用API
app.get('/api/realtime/:symbol', async (req, res) => {
    const { symbol } = req.params;
    
    // モックデータを返す
    const mockAnalysis = {
        symbol: symbol,
        score: Math.floor(Math.random() * 30) + 70, // 70-100のランダムスコア
        recommendation: 'BUY',
        reasoning: 'テクニカル指標が買いシグナルを示しています',
        keyFactors: [
            `RSI${Math.floor(Math.random() * 20) + 20}（売られすぎ）`,
            `出来高${(Math.random() * 2 + 1).toFixed(1)}倍`,
            '強い上昇トレンド'
        ].slice(0, Math.floor(Math.random() * 3) + 1),
        timestamp: new Date()
    };
    
    res.json({
        success: true,
        data: mockAnalysis
    });
});

// ヘルスチェック
app.get('/api/system/health', (req, res) => {
    res.json({
        status: 'healthy',
        services: {
            telegram: 'mocked',
            mexc: 'mocked',
            ai: 'mocked'
        },
        timestamp: new Date()
    });
});

// フロントエンドルーティング
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`✅ Mock server running at http://localhost:${PORT}`);
    console.log('🎮 オラ、サーバー起動したぞ！！');
    console.log(`🔑 Trial keys: TRIAL2025, AWAKEN2`);
});