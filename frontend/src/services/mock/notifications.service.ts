// @MOCK_TO_API: API実装時にこのブロック全体をAPI呼び出しに置き換え
import { NotificationHistory, NotificationSettings, SendTestNotificationRequest } from '@/types';
import { MOCK_NOTIFICATION_HISTORY, MOCK_NOTIFICATION_SETTINGS } from './data/notifications.mock';

let mockNotificationSettings = { ...MOCK_NOTIFICATION_SETTINGS };

export const mockNotificationsService = {
  // @MOCK_TO_API: notificationsService.getSettings()に置き換え
  getSettings: async (): Promise<NotificationSettings> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    console.warn('🔧 Using MOCK data for notification settings');
    
    return mockNotificationSettings;
  },

  // @MOCK_TO_API: notificationsService.updateSettings()に置き換え
  updateSettings: async (settings: Partial<NotificationSettings>): Promise<NotificationSettings> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.warn('🔧 Using MOCK data for updating notification settings');
    
    mockNotificationSettings = {
      ...mockNotificationSettings,
      ...settings
    };
    
    return mockNotificationSettings;
  },

  // @MOCK_TO_API: notificationsService.getHistory()に置き換え
  getHistory: async (): Promise<NotificationHistory[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    console.warn('🔧 Using MOCK data for notification history');
    
    return MOCK_NOTIFICATION_HISTORY;
  },

  // @MOCK_TO_API: notificationsService.sendTestNotification()に置き換え
  sendTestNotification: async (_request: SendTestNotificationRequest): Promise<{ success: boolean; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.warn('🔧 Using MOCK data for test notification');
    
    // 80%の成功率でテスト通知をシミュレート
    const success = Math.random() > 0.2;
    
    if (success) {
      return {
        success: true,
        message: 'テスト通知が正常に送信されました'
      };
    } else {
      throw new Error('通知送信に失敗しました。設定を確認してください。');
    }
  }
};