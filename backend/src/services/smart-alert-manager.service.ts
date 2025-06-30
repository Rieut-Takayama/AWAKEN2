import { SmartAlertService } from './smart-alert.service';
import { UserSettings, UserCredentials } from '../models';
import { decryptForUser } from '../utils/user-crypto';
import { telegramService } from './telegram.service';

class SmartAlertManager {
    private userServices: Map<string, SmartAlertService> = new Map();

    // ユーザー専用のSmartAlertServiceインスタンスを取得または作成
    async getUserInstance(userId: string): Promise<SmartAlertService | null> {
        try {
            // 既存のインスタンスがあれば返す
            if (this.userServices.has(userId)) {
                return this.userServices.get(userId)!;
            }

            // ユーザーの認証情報を確認
            const userCredentials = await UserCredentials.findOne({ userId });
            if (!userCredentials?.telegramBotToken || !userCredentials?.telegramChatId) {
                console.log(`⚠️ ユーザー ${userId} のTelegram設定が見つかりません`);
                return null;
            }

            // 新しいインスタンスを作成
            const userService = new SmartAlertService();
            
            // Telegram認証情報を復号化して設定
            const token = decryptForUser(userCredentials.telegramBotToken, userId);
            const chatId = decryptForUser(userCredentials.telegramChatId, userId);
            
            // ユーザー専用のTelegram設定を適用
            userService.setTelegramConfig(token, chatId);
            
            this.userServices.set(userId, userService);
            console.log(`✅ ユーザー ${userId} のSmartAlertServiceを初期化`);
            
            return userService;
        } catch (error) {
            console.error(`❌ SmartAlertService初期化エラー (ユーザー: ${userId}):`, error);
            return null;
        }
    }

    // ユーザーのSmartAlertServiceを削除
    removeUserInstance(userId: string): void {
        const service = this.userServices.get(userId);
        if (service) {
            service.stopMonitoring();
            this.userServices.delete(userId);
            console.log(`🗑️ ユーザー ${userId} のSmartAlertServiceを削除`);
        }
    }

    // 全ユーザーのSmartAlertServiceを停止
    stopAll(): void {
        console.log('🛑 全ユーザーのSmartAlertServiceを停止中...');
        for (const [userId, service] of this.userServices) {
            service.stopMonitoring();
        }
        this.userServices.clear();
    }

    // アクティブなサービス数を取得
    getActiveCount(): number {
        return this.userServices.size;
    }
}

export const smartAlertManager = new SmartAlertManager();