import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { databaseService } from './services/database.service';
import { mexcService } from './services/mexc.service';
import { telegramService } from './services/telegram.service';
import { aiAnalysisService } from './services/ai-analysis.service';
import { aiAnalysisManager } from './services/ai-analysis-manager.service';
import { technicalAnalysisService } from './services/technical-analysis.service';
import { smartAlertManager } from './services/smart-alert-manager.service';
import { UserSettings, UserCredentials } from './models';
import { encryptForUser, decryptForUser } from './utils/user-crypto';
import crypto from 'crypto';

// 環境変数読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// ミドルウェア
app.use(cors());
app.use(express.json());

// キャッシュを無効化とセキュリティヘッダー
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    // CSPヘッダーを追加してフォントの読み込みを許可
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' data: https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' https://api.anthropic.com"
    );
    next();
});

app.use(express.static(path.join(__dirname, '../public')));

// 認証ミドルウェア
const authMiddleware = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            message: '認証が必要です' 
        });
    }
    
    const token = authHeader.substring(7);
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: '無効なトークンです' 
        });
    }
};

// ユーザーIDを生成（emailから一意のIDを作成）
function generateUserId(email: string): string {
    return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
}

// ユーザー登録/ログイン
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, passkey } = req.body;
        
        if (!email || !passkey) {
            return res.status(400).json({
                success: false,
                message: 'メールアドレスとパスキーは必須です'
            });
        }
        
        if (passkey !== 'AWAKEN2') {
            return res.status(400).json({
                success: false,
                message: '無効なパスキーです'
            });
        }
        
        // 一意のユーザーIDを生成
        const userId = generateUserId(email);
        
        const token = jwt.sign(
            { email, userId, type: 'user' },
            process.env.JWT_SECRET!,
            { expiresIn: '30d' }
        );
        
        return res.json({
            success: true,
            token: token,
            message: '登録が完了しました'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'サーバーエラーが発生しました'
        });
    }
});

// ログイン
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, passkey } = req.body;
        
        if (!email || !passkey) {
            return res.status(400).json({
                success: false,
                message: 'メールアドレスとパスキーを入力してください'
            });
        }
        
        if (passkey !== 'AWAKEN2') {
            return res.status(401).json({
                success: false,
                message: '無効なパスキーです'
            });
        }
        
        // 一意のユーザーIDを生成
        const userId = generateUserId(email);
        
        const token = jwt.sign(
            { email, userId, type: 'user' },
            process.env.JWT_SECRET!,
            { expiresIn: '30d' }
        );
        
        return res.json({
            success: true,
            token: token,
            message: 'ログイン成功'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'サーバーエラーが発生しました'
        });
    }
});

// 設定取得API
app.get('/api/settings', authMiddleware, async (req, res) => {
    try {
        const userId = (req as any).user?.userId || generateUserId((req as any).user?.email || '');
        
        console.log('📖 設定読み込み:', { userId, email: (req as any).user?.email });
        
        // デフォルト設定
        let settings: any = {
            threshold: 75,
            notificationInterval: 60,
            notificationsEnabled: true,
            symbolsWithIntervals: [],
            quietHoursStart: null,
            quietHoursEnd: null,
            telegram: { token: '', chatId: '' },
            mexc: { apiKey: '', apiSecret: '' },
            claude: { apiKey: '' }
        };
        
        const db = databaseService.getMongoConnection();
        if (!db) {
            return res.json({
                success: true,
                data: settings
            });
        }
        
        // userIdで検索
        const [userSettings, userCredentials] = await Promise.all([
            UserSettings.findOne({ userId }),
            UserCredentials.findOne({ userId })
        ]);
        
        console.log('🔍 取得したデータ:', {
            hasUserSettings: !!userSettings,
            hasCredentials: !!userCredentials,
            credentialData: userCredentials ? {
                hasMexcKey: !!userCredentials.mexcApiKey,
                hasMexcSecret: !!userCredentials.mexcApiSecret,
                hasClaudeKey: !!userCredentials.claudeApiKey,
                claudeKeyPreview: userCredentials.claudeApiKey ? 
                    userCredentials.claudeApiKey.substring(0, 30) + '...' : 'なし'
            } : null
        });
        
        if (userSettings?.settings) {
            // 設定をマージ（認証情報以外）
            const { telegram, mexc, claude, ...otherSettings } = userSettings.settings as any;
            settings = { ...settings, ...otherSettings };
        }
        
        // 認証情報は返さない（セキュリティのため）
        // フロントエンドには空の値を返すが、設定済みかどうかとマスクした値を伝える
        settings.telegram = { 
            token: '', 
            chatId: '',
            isConfigured: !!(userCredentials?.telegramBotToken && userCredentials?.telegramChatId),
            maskedToken: '',
            maskedChatId: ''
        };
        
        // Telegramの復号化とマスク処理
        if (userCredentials?.telegramBotToken) {
            try {
                const decryptedToken = decryptForUser(userCredentials.telegramBotToken, userId);
                settings.telegram.maskedToken = decryptedToken.substring(0, 10) + '***';
            } catch (e) {
                console.error('Telegram token復号化エラー:', e);
            }
        }
        if (userCredentials?.telegramChatId) {
            try {
                const decryptedChatId = decryptForUser(userCredentials.telegramChatId, userId);
                settings.telegram.maskedChatId = decryptedChatId;
            } catch (e) {
                console.error('Telegram chatId復号化エラー:', e);
            }
        }
        
        settings.mexc = { 
            apiKey: '', 
            apiSecret: '',
            isConfigured: !!(userCredentials?.mexcApiKey && userCredentials?.mexcApiSecret),
            maskedApiKey: ''
        };
        
        // MEXCの復号化とマスク処理
        if (userCredentials?.mexcApiKey) {
            try {
                const decryptedKey = decryptForUser(userCredentials.mexcApiKey, userId);
                settings.mexc.maskedApiKey = decryptedKey.substring(0, 10) + '***';
            } catch (e) {
                console.error('MEXC APIキー復号化エラー:', e);
            }
        }
        
        settings.claude = { 
            apiKey: '',
            isConfigured: !!userCredentials?.claudeApiKey,
            maskedApiKey: ''
        };
        
        // Claudeの復号化とマスク処理
        if (userCredentials?.claudeApiKey) {
            try {
                const decryptedKey = decryptForUser(userCredentials.claudeApiKey, userId);
                settings.claude.maskedApiKey = decryptedKey.substring(0, 13) + '***';
            } catch (e) {
                console.error('Claude APIキー復号化エラー:', e);
            }
        }
        
        return res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('設定取得エラー:', error);
        return res.status(500).json({
            success: false,
            message: '設定取得エラー'
        });
    }
});

// 設定保存API
app.post('/api/settings', authMiddleware, async (req, res) => {
    try {
        const userId = (req as any).user?.userId || generateUserId((req as any).user?.email || '');
        
        console.log('💾 設定保存:', { userId, email: (req as any).user?.email });
        
        const db = databaseService.getMongoConnection();
        if (!db) {
            return res.status(503).json({
                success: false,
                message: 'データベース接続エラー'
            });
        }
        
        // 認証情報を分離
        const { telegram, mexc, claude, ...otherSettings } = req.body;
        
        console.log('🔍 受信したMEXCデータ:', {
            apiKey: mexc?.apiKey ? `${mexc.apiKey.substring(0, 5)}...` : 'なし',
            apiSecret: mexc?.apiSecret ? '***' : 'なし'
        });
        
        // 1. 通常の設定を保存（認証情報以外）
        await UserSettings.findOneAndUpdate(
            { userId },
            { 
                userId,
                settings: otherSettings,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );
        
        // 2. 認証情報は値が入力されている場合のみ更新
        const updateFields: any = {
            userId,
            updatedAt: new Date()
        };
        
        // 空でない値のみユーザー固有のキーで暗号化して保存
        if (telegram?.token && telegram.token.trim()) {
            updateFields.telegramBotToken = encryptForUser(telegram.token, userId);
        }
        if (telegram?.chatId && telegram.chatId.trim()) {
            updateFields.telegramChatId = encryptForUser(telegram.chatId, userId);
        }
        if (mexc?.apiKey && mexc.apiKey.trim()) {
            updateFields.mexcApiKey = encryptForUser(mexc.apiKey, userId);
        }
        if (mexc?.apiSecret && mexc.apiSecret.trim()) {
            updateFields.mexcApiSecret = encryptForUser(mexc.apiSecret, userId);
        }
        if (claude?.apiKey && claude.apiKey.trim()) {
            updateFields.claudeApiKey = encryptForUser(claude.apiKey, userId);
        }
        
        // 既存の認証情報を保持しながら更新
        await UserCredentials.findOneAndUpdate(
            { userId },
            { $set: updateFields },
            { upsert: true, new: true }
        );
        
        // 3. AIサービスの設定も更新
        const userAIService = await aiAnalysisManager.getUserInstance(userId);
        if (userAIService) {
            if (req.body.threshold !== undefined) {
                userAIService.setScoreThreshold(req.body.threshold);
            }
            if (req.body.notificationInterval !== undefined) {
                userAIService.setNotificationInterval(req.body.notificationInterval);
            }
            if (req.body.notificationsEnabled !== undefined) {
                userAIService.setNotificationsEnabled(req.body.notificationsEnabled);
            }
            
            // 自動分析の開始/停止を制御
            if (req.body.notificationsEnabled && req.body.symbolsWithIntervals?.length > 0) {
                // 銘柄リストを作成
                const symbols = req.body.symbolsWithIntervals.map((item: any) => 
                    item.symbol.replace('/', '')
                );
                
                // リアルタイム分析を開始（既存の分析は自動的に停止される）
                await userAIService.startRealtimeAnalysis(symbols, 5000);
                console.log(`🔄 ユーザー ${userId} の自動分析を更新: ${symbols.join(', ')}`);
            } else {
                // 通知が無効化されたか、銘柄が選択されていない場合は分析を停止
                userAIService.stopRealtimeAnalysis();
                console.log(`⏸️ ユーザー ${userId} の自動分析を停止`);
            }
        }
        
        console.log('✅ 設定保存完了');
        return res.json({
            success: true,
            message: '設定を保存しました'
        });
        
    } catch (error) {
        console.error('設定保存エラー:', error);
        return res.status(500).json({
            success: false,
            message: '設定保存エラー'
        });
    }
});

// リアルタイム分析データ取得API
app.get('/api/realtime/analyze/:symbol', authMiddleware, async (req, res) => {
    try {
        const { symbol } = req.params;
        
        const priceData = await mexcService.getTickerPrice(symbol);
        if (!priceData) {
            return res.status(404).json({
                success: false,
                message: 'データが見つかりません'
            });
        }
        
        const multiTimeframeData = await mexcService.getMultiTimeframeData(symbol);
        
        if (Object.keys(multiTimeframeData).length === 0) {
            return res.json({
                success: true,
                data: {
                    symbol: symbol,
                    name: symbol.includes('USDT') ? symbol.replace('USDT', '/USDT') : symbol,
                    price: priceData.price,
                    score: 50,
                    trend: 'sideways',
                    change24h: `${priceData.change24h?.toFixed(2) || '0.0'}%`,
                    scoreHistory: Array.from({length: 10}, () => Math.floor(Math.random() * 30) + 50),
                    indicators: {
                        rsi: { score: 50 },
                        macd: { score: 50 },
                        bb: { score: 50 }
                    }
                }
            });
        }
        
        const multiAnalysis = technicalAnalysisService.analyzeMultiTimeframe(multiTimeframeData);
        
        const primary15m = multiAnalysis.analyses.find(a => a.timeframe === '15m');
        const indicators = primary15m?.indicators || {
            rsi: 50,
            macd: { macd: 0, signal: 0, histogram: 0 },
            bollingerBands: { upper: 0, middle: 0, lower: 0 }
        };
        
        // 実際のスコア計算（technicalAnalysisService.calculateTimeframeScoreと同じロジック）
        const currentPrice = priceData.price;
        
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
        
        const analysisData = {
            symbol: symbol,
            name: symbol.includes('USDT') ? symbol.replace('USDT', '/USDT') : symbol,
            price: priceData.price,
            score: multiAnalysis.finalScore,
            trend: multiAnalysis.finalScore > 75 ? 'up' : multiAnalysis.finalScore < 60 ? 'down' : 'sideways',
            change24h: `${priceData.change24h?.toFixed(2) || '0.0'}%`,
            scoreHistory: Array.from({length: 10}, () => Math.floor(Math.random() * 20) + (multiAnalysis.finalScore - 10)),
            indicators: {
                rsi: { score: rsiScore },
                macd: { score: macdScore },
                bb: { score: bbScore }
            }
        };
        
        return res.json({
            success: true,
            data: analysisData
        });
    } catch (error) {
        console.error('分析エラー:', error);
        return res.status(500).json({
            success: false,
            message: '分析エラー'
        });
    }
});

// MEXC全銘柄取得API
app.get('/api/mexc/symbols', authMiddleware, async (req, res) => {
    try {
        const { search } = req.query;
        
        // MEXC APIから全取引ペアを取得
        const allSymbols = await mexcService.getAllSymbols();
        
        if (!allSymbols || allSymbols.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }
        
        // USDT建ての通貨のみフィルタリング
        let filteredSymbols = allSymbols
            .filter((symbol: any) => symbol.symbol.endsWith('USDT'))
            .map((symbol: any) => ({
                symbol: symbol.symbol.replace('USDT', '/USDT'),
                baseAsset: symbol.baseAsset,
                quoteAsset: symbol.quoteAsset
            }));
        
        // 検索文字列がある場合はフィルタリング
        if (search && typeof search === 'string') {
            const searchLower = search.toLowerCase();
            filteredSymbols = filteredSymbols.filter((symbol: any) => 
                symbol.symbol.toLowerCase().includes(searchLower) ||
                symbol.baseAsset.toLowerCase().includes(searchLower)
            );
        }
        
        // アルファベット順にソート
        filteredSymbols.sort((a: any, b: any) => a.symbol.localeCompare(b.symbol));
        
        return res.json({
            success: true,
            data: filteredSymbols.slice(0, 200) // 最大200件まで返す（検索があれば絞り込まれる）
        });
    } catch (error) {
        console.error('MEXC銘柄取得エラー:', error);
        return res.status(500).json({
            success: false,
            message: 'MEXC銘柄取得エラー'
        });
    }
});

// AI分析API
app.post('/api/analyze/force', authMiddleware, async (req, res) => {
    try {
        const { symbols } = req.body;
        const userId = (req as any).user?.userId || generateUserId((req as any).user?.email || '');
        
        const userAIService = await aiAnalysisManager.getUserInstance(userId);
        if (!userAIService) {
            return res.status(400).json({
                success: false,
                message: 'Claude APIキーが設定されていません'
            });
        }
        
        // 各銘柄の詳細分析結果を収集
        const detailedResults = [];
        
        for (const symbol of symbols) {
            // 複数時間足データを取得
            const multiTimeframeData = await mexcService.getMultiTimeframeData(symbol);
            const multiAnalysis = technicalAnalysisService.analyzeMultiTimeframe(multiTimeframeData);
            
            // 現在の価格情報を取得
            const priceData = await mexcService.getTickerPrice(symbol);
            if (!priceData) {
                console.error(`Price data not found for ${symbol}`);
                continue;
            }
            
            // AI分析を実行（通知なし）
            const originalEnabled = userAIService.getNotificationsEnabled();
            userAIService.setNotificationsEnabled(false);
            const aiResult = await userAIService.analyzePrice(symbol, priceData);
            userAIService.setNotificationsEnabled(originalEnabled);
            
            // 詳細な取引戦略を生成
            const tradingStrategy = generateTradingStrategy(symbol, priceData.price, multiAnalysis, aiResult);
            
            detailedResults.push({
                symbol: symbol,
                price: priceData.price,
                change24h: priceData.change24h,
                score: multiAnalysis.finalScore,
                recommendation: multiAnalysis.recommendation,
                reasoning: multiAnalysis.reasoning,
                keyFactors: multiAnalysis.keyFactors,
                tradingStrategy: tradingStrategy,
                aiAnalysis: aiResult.reasoning || '',
                technicalIndicators: {
                    rsi: multiAnalysis.analyses[0]?.indicators.rsi || 50,
                    macdSignal: multiAnalysis.analyses[0]?.indicators.macd.histogram > 0 ? 'bullish' : 'bearish',
                    bbPosition: ((priceData.price - multiAnalysis.analyses[0]?.indicators.bollingerBands.lower) / 
                                (multiAnalysis.analyses[0]?.indicators.bollingerBands.upper - multiAnalysis.analyses[0]?.indicators.bollingerBands.lower) * 100).toFixed(1)
                }
            });
        }
        
        return res.json({
            success: true,
            data: detailedResults,
            message: '手動分析完了'
        });
    } catch (error) {
        console.error('AI分析エラー:', error);
        return res.status(500).json({
            success: false,
            message: 'AI分析エラーが発生しました'
        });
    }
});

// 取引戦略を生成する関数
function generateTradingStrategy(symbol: string, currentPrice: number, multiAnalysis: any, aiResult: any): any {
    const score = multiAnalysis.finalScore;
    
    // 基本的な価格計算
    const stopLoss = currentPrice * 0.97; // 3%下
    const takeProfit1 = currentPrice * 1.03; // 3%上（第1目標）
    const takeProfit2 = currentPrice * 1.05; // 5%上（第2目標）
    const takeProfit3 = currentPrice * 1.10; // 10%上（第3目標）
    
    // ナンピン（ドルコスト平均法）の推奨価格
    const dcaLevels = [
        { price: currentPrice * 0.98, percentage: -2, amount: '初回購入額の30%' },
        { price: currentPrice * 0.95, percentage: -5, amount: '初回購入額の50%' },
        { price: currentPrice * 0.92, percentage: -8, amount: '初回購入額の70%' }
    ];
    
    let strategy = {
        entryPrice: currentPrice,
        stopLoss: stopLoss,
        takeProfitLevels: [
            { level: 1, price: takeProfit1, percentage: 3, action: 'ポジションの30%を利確' },
            { level: 2, price: takeProfit2, percentage: 5, action: 'ポジションの50%を利確' },
            { level: 3, price: takeProfit3, percentage: 10, action: '残りを全て利確' }
        ],
        dcaLevels: dcaLevels,
        riskManagement: '',
        timeframe: '',
        confidence: ''
    };
    
    // スコアに基づいた戦略調整
    if (score >= 85) {
        strategy.riskManagement = '高確度シグナル。初回エントリーは資金の3-5%程度を推奨。';
        strategy.timeframe = '短期（数時間〜1日）での反発を期待';
        strategy.confidence = '非常に高い';
    } else if (score >= 75) {
        strategy.riskManagement = '良好なシグナル。初回エントリーは資金の2-3%程度を推奨。';
        strategy.timeframe = '1-3日程度でのポジション解消を想定';
        strategy.confidence = '高い';
    } else if (score >= 60) {
        strategy.riskManagement = '中程度のシグナル。初回エントリーは資金の1-2%程度に抑制。';
        strategy.timeframe = '数日〜1週間程度の保有を検討';
        strategy.confidence = '中程度';
    } else {
        strategy.riskManagement = 'エントリーは推奨しません。さらなる下落を待つか、他の銘柄を検討してください。';
        strategy.timeframe = '様子見推奨';
        strategy.confidence = '低い';
    }
    
    return strategy;
}

// API接続テスト（実際のAPIキーは送信しない）
app.post('/api/mexc/test', authMiddleware, async (req, res) => {
    try {
        const userId = (req as any).user?.userId || generateUserId((req as any).user?.email || '');
        
        // データベースから暗号化されたAPIキーを取得
        const userCredentials = await UserCredentials.findOne({ userId });
        if (!userCredentials?.mexcApiKey || !userCredentials?.mexcApiSecret) {
            return res.status(400).json({
                success: false,
                message: 'MEXC APIキーが設定されていません'
            });
        }
        
        // 実際のテストは省略（APIキーの有効性確認のみ）
        const priceData = await mexcService.getTickerPrice('BTCUSDT');
        if (priceData) {
            return res.json({
                success: true,
                message: 'MEXC API接続に成功しました',
                availablePairs: '1500+'
            });
        }
        
        return res.status(400).json({
            success: false,
            message: '接続に失敗しました'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'テスト中にエラーが発生しました'
        });
    }
});

app.post('/api/claude/test', authMiddleware, async (req, res) => {
    try {
        const { apiKey } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({
                success: false,
                message: 'APIキーが必要です'
            });
        }
        
        const { Anthropic } = await import('@anthropic-ai/sdk');
        const testClient = new Anthropic({ apiKey });
        
        try {
            const response = await testClient.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: 10,
                messages: [{
                    role: 'user',
                    content: 'Hi'
                }]
            });
            
            return res.json({
                success: true,
                message: 'Claude API接続成功！'
            });
        } catch (claudeError: any) {
            if (claudeError.status === 401) {
                return res.status(400).json({
                    success: false,
                    message: 'APIキーが無効です'
                });
            }
            throw claudeError;
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'テスト中にエラーが発生しました'
        });
    }
});

// Telegramテスト送信エンドポイント
app.post('/api/telegram/test', authMiddleware, async (req, res) => {
    try {
        let { token, chatId } = req.body;
        const userId = (req as any).user?.userId || generateUserId((req as any).user?.email || '');
        
        // USE_SAVEDの場合、保存済みの値を使用
        if (token === 'USE_SAVED' || chatId === 'USE_SAVED') {
            const userCredentials = await UserCredentials.findOne({ userId });
            if (!userCredentials?.telegramBotToken || !userCredentials?.telegramChatId) {
                return res.status(400).json({
                    success: false,
                    message: 'Telegram設定が保存されていません'
                });
            }
            // 復号化
            token = decryptForUser(userCredentials.telegramBotToken, userId);
            chatId = decryptForUser(userCredentials.telegramChatId, userId);
        }
        
        if (!token || !chatId) {
            return res.status(400).json({
                success: false,
                message: 'トークンとチャットIDが必要です'
            });
        }
        
        // テストメッセージを送信
        const result = await telegramService.testConnectionWithCredentials(token, chatId);
        
        if (result) {
            return res.json({
                success: true,
                message: 'テストメッセージを送信しました'
            });
        } else {
            return res.status(400).json({
                success: false,
                message: '送信に失敗しました。トークンとチャットIDを確認してください'
            });
        }
    } catch (error) {
        console.error('Telegramテストエラー:', error);
        return res.status(500).json({
            success: false,
            message: 'テスト送信中にエラーが発生しました'
        });
    }
});

// Telegram保存通知エンドポイント
app.post('/api/telegram/notify-save', authMiddleware, async (req, res) => {
    try {
        const userId = (req as any).user?.userId || generateUserId((req as any).user?.email || '');
        const { message } = req.body;
        
        // ユーザーの認証情報を取得
        const userCredentials = await UserCredentials.findOne({ userId });
        if (!userCredentials?.telegramBotToken || !userCredentials?.telegramChatId) {
            return res.status(400).json({
                success: false,
                message: 'Telegram設定が見つかりません'
            });
        }
        
        // 復号化
        const token = decryptForUser(userCredentials.telegramBotToken, userId);
        const chatId = decryptForUser(userCredentials.telegramChatId, userId);
        
        // メッセージ送信
        const result = await telegramService.sendMessageWithCredentials(token, chatId, message || '✅ 設定が保存されました');
        
        if (result) {
            return res.json({
                success: true,
                message: '通知を送信しました'
            });
        } else {
            return res.status(400).json({
                success: false,
                message: '通知の送信に失敗しました'
            });
        }
    } catch (error) {
        console.error('Telegram通知エラー:', error);
        return res.status(500).json({
            success: false,
            message: '通知送信中にエラーが発生しました'
        });
    }
});

// HTMLページ配信
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/settings.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/settings.html'));
});

// /setへのリクエストをリダイレクト
app.get('/set', (req, res) => {
    res.redirect('/settings.html');
});

// サーバー起動
async function startServer() {
    try {
        await databaseService.initialize();
        console.log('✅ データベース接続完了');
        
        const telegramConnected = await telegramService.testConnection();
        if (telegramConnected) {
            console.log('✅ Telegram bot connected');
        }
        
        // 全ユーザーの自動分析を開始
        console.log('🚀 自動分析システムを起動中...');
        await startAllUsersAnalysis();
        
        console.log('✅ App initialized successfully');
    } catch (error) {
        console.error('❌ Server startup error:', error);
        process.exit(1);
    }
}

// 全ユーザーの自動分析を開始
async function startAllUsersAnalysis() {
    try {
        // 全ユーザーの設定を取得
        const allUserSettings = await UserSettings.find({});
        
        for (const userSetting of allUserSettings) {
            const userId = userSetting.userId;
            const settings = userSetting.settings as any;
            
            // 通知が有効で、銘柄が設定されているユーザーのみ
            if (settings?.notificationsEnabled && settings?.symbolsWithIntervals?.length > 0) {
                // ユーザーの認証情報を確認
                const userCredentials = await UserCredentials.findOne({ userId });
                
                if (userCredentials?.claudeApiKey) {
                    try {
                        // 復号化してAIサービスインスタンスを取得
                        const claudeApiKey = decryptForUser(userCredentials.claudeApiKey, userId);
                        const userAIService = await aiAnalysisManager.getUserInstance(userId);
                        
                        if (userAIService) {
                            // 設定を適用
                            userAIService.setScoreThreshold(settings.threshold || 75);
                            userAIService.setNotificationInterval(settings.notificationInterval || 60);
                            userAIService.setNotificationsEnabled(true);
                            
                            // 銘柄リストを作成
                            const symbols = settings.symbolsWithIntervals.map((item: any) => 
                                item.symbol.replace('/', '')
                            );
                            
                            // リアルタイム分析を開始（5秒間隔）
                            await userAIService.startRealtimeAnalysis(symbols, 5000);
                            
                            console.log(`✅ ユーザー ${userId} の自動分析を開始: ${symbols.join(', ')}`);
                        }
                    } catch (error) {
                        console.error(`❌ ユーザー ${userId} の自動分析開始エラー:`, error);
                    }
                }
                
                // スマートアラートの設定と開始
                if (settings?.alertConfig && userCredentials?.telegramBotToken) {
                    try {
                        const userSmartAlert = await smartAlertManager.getUserInstance(userId);
                        
                        if (userSmartAlert) {
                            // 詳細通知設定を適用
                            const alertSettings = {
                                enabled: settings.alertConfig.enabled || false,
                                symbols: settings.symbolsWithIntervals?.map((item: any) => 
                                    item.symbol.replace('/', '')
                                ) || [],
                                surgeThreshold: settings.alertConfig.surgeThreshold || 2.0,
                                dropThreshold: settings.alertConfig.dropThreshold || 2.0,
                                volumeMultiplier: settings.alertConfig.volumeMultiplier || 2.0,
                                volatilityThreshold: settings.alertConfig.volatilityThreshold || 5.0,
                                stagnationHours: settings.alertConfig.stagnationHours || 2,
                                whipsawCount: settings.alertConfig.whipsawCount || 2
                            };
                            
                            userSmartAlert.updateConfig(alertSettings);
                            
                            // 有効な通知があれば監視開始
                            const hasEnabledAlerts = 
                                settings.alertConfig.surgeAlert ||
                                settings.alertConfig.dropAlert ||
                                settings.alertConfig.volumeAlert ||
                                settings.alertConfig.volatilityAlert ||
                                settings.alertConfig.stagnationAlert ||
                                settings.alertConfig.whipsawAlert ||
                                settings.alertConfig.supportResistanceAlert ||
                                settings.alertConfig.consecutiveBarsAlert ||
                                settings.alertConfig.volumeDryUpAlert;
                            
                            if (hasEnabledAlerts && alertSettings.symbols.length > 0) {
                                await userSmartAlert.startMonitoring(alertSettings.symbols, 1); // 1分間隔
                                console.log(`✅ ユーザー ${userId} のスマートアラートを開始`);
                            }
                        }
                    } catch (error) {
                        console.error(`❌ ユーザー ${userId} のスマートアラート開始エラー:`, error);
                    }
                }
            }
        }
        
        console.log(`🎯 ${allUserSettings.length} ユーザーの設定を確認完了`);
    } catch (error) {
        console.error('❌ 自動分析の開始エラー:', error);
    }
}

process.on('SIGINT', async () => {
    console.log('\nShutting down server...');
    await databaseService.close();
    process.exit(0);
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`✅ AWAKEN2 Server is running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

startServer().catch(console.error);

module.exports = app;