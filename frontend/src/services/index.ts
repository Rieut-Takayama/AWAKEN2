// 認証API: 実API使用
import { apiAuthService } from './api/auth.service';

// 認証API: 実API統合完了
export const authService = apiAuthService;

// 他のサービスは削除されたため、必要なメソッドを持つスタブ実装を提供
// TODO: 必要に応じて実際のAPIサービスまたはモックサービスを再実装

export const analysisService = {
  getRealtimeData: async () => {
    console.warn('analysisService.getRealtimeData is not implemented');
    return [];
  }
};

export const watchlistService = {
  // 必要に応じてメソッドを追加
};

export const notificationsService = {
  getSettings: async () => {
    console.warn('notificationsService.getSettings is not implemented');
    return {
      scoreThreshold: 75,
      interval: 60,
      methods: [],
      telegramChatId: '',
      enabled: false
    };
  },
  sendTestNotification: async (_request: any) => {
    console.warn('notificationsService.sendTestNotification is not implemented');
    return { success: false, message: 'Not implemented' };
  },
  updateSettings: async (_settings: any) => {
    console.warn('notificationsService.updateSettings is not implemented');
    return { success: false, message: 'Not implemented' };
  }
};