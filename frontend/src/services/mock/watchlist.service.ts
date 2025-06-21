// @MOCK_TO_API: API実装時にこのブロック全体をAPI呼び出しに置き換え
import { WatchlistItem, AddWatchlistRequest, RemoveWatchlistRequest, CryptoCurrency } from '@/types';
import { MOCK_WATCHLIST_ITEMS, MOCK_CRYPTOCURRENCIES } from './data/watchlist.mock';

let mockWatchlistState = [...MOCK_WATCHLIST_ITEMS];

export const mockWatchlistService = {
  // @MOCK_TO_API: watchlistService.getWatchlist()に置き換え
  getWatchlist: async (): Promise<WatchlistItem[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.warn('🔧 Using MOCK data for watchlist');
    
    return mockWatchlistState.filter(item => item.isActive);
  },

  // @MOCK_TO_API: watchlistService.addSymbol()に置き換え
  addSymbol: async (request: AddWatchlistRequest): Promise<WatchlistItem> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.warn(`🔧 Using MOCK data for adding symbol: ${request.symbol}`);
    
    // 既に存在するかチェック
    const existing = mockWatchlistState.find(item => 
      item.symbol === request.symbol && item.isActive
    );
    
    if (existing) {
      throw new Error('この銘柄は既に監視リストに追加されています');
    }
    
    // 監視リスト上限チェック
    const activeItems = mockWatchlistState.filter(item => item.isActive);
    if (activeItems.length >= 10) {
      throw new Error('監視リストの上限（10銘柄）に達しています');
    }
    
    const newItem: WatchlistItem = {
      id: `watchlist_${Date.now()}`,
      userId: '1',
      symbol: request.symbol,
      isActive: true,
      addedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockWatchlistState.push(newItem);
    return newItem;
  },

  // @MOCK_TO_API: watchlistService.removeSymbol()に置き換え
  removeSymbol: async (request: RemoveWatchlistRequest): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    console.warn(`🔧 Using MOCK data for removing symbol: ${request.symbol}`);
    
    mockWatchlistState = mockWatchlistState.map(item => 
      item.symbol === request.symbol 
        ? { ...item, isActive: false, updatedAt: new Date() }
        : item
    );
  },

  // @MOCK_TO_API: watchlistService.getAvailableSymbols()に置き換え
  getAvailableSymbols: async (): Promise<CryptoCurrency[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    console.warn('🔧 Using MOCK data for available symbols');
    
    return MOCK_CRYPTOCURRENCIES;
  }
};