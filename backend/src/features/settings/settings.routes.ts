import { Router } from 'express';
import { requireAuth } from '@/common/middlewares/auth.middleware';
import { aiAnalysisService } from '@/services/ai-analysis.service';
import { telegramService } from '@/services/telegram.service';

const router = Router();

// 設定取得
router.get('/', requireAuth, async (req, res) => {
    try {
        // モック設定を返す
        const settings = {
            threshold: 75,
            notificationInterval: 60,
            notificationsEnabled: true,
            symbols: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT']
        };
        
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
        const { threshold, notificationInterval, notificationsEnabled, symbols } = req.body;
        
        // AIサービスに設定を反映
        aiAnalysisService.setScoreThreshold(threshold);
        aiAnalysisService.setNotificationInterval(notificationInterval);
        aiAnalysisService.setNotificationsEnabled(notificationsEnabled);
        
        // TODO: 設定をデータベースに保存
        
        res.json({
            success: true,
            message: '設定を保存しました',
            data: {
                threshold,
                notificationInterval,
                notificationsEnabled,
                symbols
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
        const testMessage = `
🔔 AWAKEN2 接続テスト

✅ Telegram通知が正常に設定されました
📊 高スコアアラートが送信されます
⏰ テスト実行時刻: ${new Date().toLocaleString('ja-JP')}
`;
        
        await telegramService.sendMessage({
            chatId: process.env.TELEGRAM_CHAT_ID || '',
            text: testMessage,
            parseMode: 'HTML'
        });
        
        res.json({
            success: true,
            message: 'テストメッセージを送信しました'
        });
    } catch (error) {
        console.error('Telegramテストエラー:', error);
        res.status(500).json({
            success: false,
            error: 'Telegram接続に失敗しました'
        });
    }
});

export const settingsRoutes = router;
export { telegramRouter };