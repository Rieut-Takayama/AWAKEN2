// @MOCK_TO_API: 認証API統合完了 - 他のAPIは統合作業継続中

// 認証API: 実API使用
import { apiAuthService } from './api/auth.service';

// 未統合API: モック使用
import { mockAnalysisService } from './mock/analysis.service';
import { mockWatchlistService } from './mock/watchlist.service';
import { mockNotificationsService } from './mock/notifications.service';

// @MOCK_LOGIC: 未統合API用のモック切り替えロジック
const USE_MOCK = process.env.NODE_ENV === 'development' || !process.env.REACT_APP_API_URL;

// 認証API: 実API統合完了
export const authService = apiAuthService;

// 未統合API: モック継続使用
export const analysisService = USE_MOCK ? mockAnalysisService : mockAnalysisService; // TODO: apiAnalysisServiceに置き換え
export const watchlistService = USE_MOCK ? mockWatchlistService : mockWatchlistService; // TODO: apiWatchlistServiceに置き換え
export const notificationsService = USE_MOCK ? mockNotificationsService : mockNotificationsService; // TODO: apiNotificationsServiceに置き換え

// @MOCK_TO_API: API実装時にこの警告は削除
if (USE_MOCK) {
  console.warn('🔧 Application is running with MOCK services');
  console.warn('🔧 All data is simulated and will not persist');
}