// @MOCK_DATA: ハードコードされたサンプルデータ
import { WatchlistItem, CryptoCurrency } from '@/types';

export const MOCK_WATCHLIST_ITEMS: WatchlistItem[] = [
  {
    id: '1',
    userId: '1',
    symbol: 'BTCUSDT',
    isActive: true,
    addedAt: new Date('2025-01-01'),
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date()
  },
  {
    id: '2',
    userId: '1',
    symbol: 'ETHUSDT',
    isActive: true,
    addedAt: new Date('2025-01-01'),
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date()
  },
  {
    id: '3',
    userId: '1',
    symbol: 'ADAUSDT',
    isActive: true,
    addedAt: new Date('2025-01-01'),
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date()
  }
];

export const MOCK_CRYPTOCURRENCIES: CryptoCurrency[] = [
  {
    symbol: 'BTCUSDT',
    name: 'ビットコイン',
    baseAsset: 'BTC',
    quoteAsset: 'USDT'
  },
  {
    symbol: 'ETHUSDT',
    name: 'イーサリアム',
    baseAsset: 'ETH',
    quoteAsset: 'USDT'
  },
  {
    symbol: 'ADAUSDT',
    name: 'カルダノ',
    baseAsset: 'ADA',
    quoteAsset: 'USDT'
  },
  {
    symbol: 'BNBUSDT',
    name: 'バイナンスコイン',
    baseAsset: 'BNB',
    quoteAsset: 'USDT'
  },
  {
    symbol: 'SOLUSDT',
    name: 'ソラナ',
    baseAsset: 'SOL',
    quoteAsset: 'USDT'
  },
  {
    symbol: 'DOTUSDT',
    name: 'ポルカドット',
    baseAsset: 'DOT',
    quoteAsset: 'USDT'
  }
];