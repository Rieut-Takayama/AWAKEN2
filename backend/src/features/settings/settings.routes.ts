import { Router } from 'express';
import { requireAuth } from '@/common/middlewares/auth.middleware';
import { aiAnalysisService } from '@/services/ai-analysis.service';
import { telegramService } from '@/services/telegram.service';
import { memoryStorage } from '@/services/memory-storage.service';

const router = Router();

// 設定取得
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = (req as any).user?.userId || 'default-user';
        console.log('設定取得 - userId:', userId);
        
        // メモリから設定を取得
        const savedSettings = await memoryStorage.getUserSettings(userId);
        
        // デフォルト設定
        const defaultSettings = {
            threshold: 75,
            notificationInterval: 60,
            notificationsEnabled: true,
            symbols: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'],
            symbolsWithIntervals: [],
            quietHoursStart: null,
            quietHoursEnd: null,
            telegram: {
                token: '',
                chatId: ''
            },
            mexc: {
                apiKey: '',
                apiSecret: ''
            },
            claude: {
                apiKey: ''
            }
        };
        
        // 保存済み設定があればマージ
        const settings = savedSettings?.settings 
            ? { ...defaultSettings, ...savedSettings.settings }
            : defaultSettings;
        
        // 認証情報をマスク（セキュリティのため）
        if (settings.telegram) {
            settings.telegram = {
                token: settings.telegram.token ? 'configured' : '',
                chatId: settings.telegram.chatId ? 'configured' : ''
            };
        }
        if (settings.mexc) {
            settings.mexc = {
                apiKey: settings.mexc.apiKey ? 'configured' : '',
                apiSecret: settings.mexc.apiSecret ? 'configured' : ''
            };
        }
        if (settings.claude) {
            settings.claude = {
                apiKey: settings.claude.apiKey ? 'configured' : ''
            };
        }
        
        console.log('返却する設定:', {
            ...settings,
            claude: { apiKey: settings.claude?.apiKey ? 'sk-ant-...(masked)' : '' }
        });
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('設定取得エラー:', error);
        res.status(500).json({
            success: false,
            error: '設定の取得に失敗しました'
        });
    }
});

// 設定保存
router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = (req as any).user?.userId || 'default-user';
        console.log('設定保存 - userId:', userId);
        console.log('受信した設定:', {
            ...req.body,
            claude: req.body.claude ? { apiKey: 'sk-ant-...(masked)' } : undefined
        });
        
        const { 
            threshold, 
            notificationInterval, 
            notificationsEnabled, 
            symbols,
            symbolsWithIntervals,
            quietHoursStart,
            quietHoursEnd,
            telegram,
            mexc,
            claude
        } = req.body;
        
        // AIサービスに設定を反映
        if (threshold !== undefined) {
            aiAnalysisService.setScoreThreshold(threshold);
        }
        if (notificationInterval !== undefined) {
            aiAnalysisService.setNotificationInterval(notificationInterval);
        }
        if (notificationsEnabled !== undefined) {
            aiAnalysisService.setNotificationsEnabled(notificationsEnabled);
        }
        
        // Claude APIキーを設定
        if (claude?.apiKey) {
            console.log('Claude APIキーを設定中...');
            aiAnalysisService.setUserApiKey(claude.apiKey);
        }
        
        // 設定オブジェクトを作成
        const settingsToSave = {
            threshold,
            notificationInterval,
            notificationsEnabled,
            symbols: symbols || [],
            symbolsWithIntervals: symbolsWithIntervals || [],
            quietHoursStart,
            quietHoursEnd,
            telegram: telegram || { token: '', chatId: '' },
            mexc: mexc || { apiKey: '', apiSecret: '' },
            claude: claude || { apiKey: '' }
        };
        
        // メモリに保存
        await memoryStorage.saveUserSettings(userId, settingsToSave);
        console.log('設定をメモリに保存しました');
        
        res.json({
            success: true,
            message: '設定を保存しました',
            data: {
                ...settingsToSave,
                claude: { apiKey: settingsToSave.claude?.apiKey ? 'sk-ant-...(masked)' : '' }
            }
        });
    } catch (error) {
        console.error('設定保存エラー:', error);
        res.status(500).json({
            success: false,
            error: '設定の保存に失敗しました'
        });
    }
});

// Telegram接続テスト用のルート
const telegramRouter = Router();
telegramRouter.post('/test', requireAuth, async (req, res) => {
    try {
        console.log('=== Telegram Test Endpoint Called ===');
        console.log('Request body:', req.body);
        console.log('TELEGRAM_CHAT_ID from env:', process.env.TELEGRAM_CHAT_ID);
        
        const testMessage = `
🔔 AWAKEN2 接続テスト

✅ Telegram通知が正常に設定されました
📊 高スコアアラートが送信されます
⏰ テスト実行時刻: ${new Date().toLocaleString('ja-JP')}
`;
        
        const result = await telegramService.sendMessage({
            chatId: process.env.TELEGRAM_CHAT_ID || '',
            text: testMessage,
            parseMode: 'HTML'
        });
        
        console.log('Test message send result:', result);
        
        if (!result) {
            throw new Error('メッセージ送信に失敗しました');
        }
        
        res.json({
            success: true,
            message: 'テストメッセージを送信しました'
        });
    } catch (error: any) {
        console.error('=== Telegram Test Error ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        
        res.status(500).json({
            success: false,
            error: 'Telegram接続に失敗しました',
            details: error.message
        });
    }
});

export const settingsRoutes = router;
export { telegramRouter };