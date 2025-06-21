/**
 * ===== 型定義同期ガイドライン =====
 * 型ファイルは下記2つの同期された型ファイルが存在します。  
 *  - **フロントエンド**: `frontend/src/types/index.ts`
 *　 - **バックエンド**: `backend/src/types/index.ts`
 * 【基本原則】この/types/index.tsを更新したら、もう一方の/types/index.tsも必ず同じ内容に更新する
 * 
 * 【変更の責任】
 * - 型定義を変更した開発者は、両方のファイルを即座に同期させる責任を持つ
 * - 1つのtypes/index.tsの更新は禁止。必ず1つを更新したらもう一つも更新その場で行う
 * 
 * 【絶対に守るべき原則】
 * 1. フロントエンドとバックエンドで異なる型を作らない
 * 2. 同じデータ構造に対して複数の型を作らない
 * 3. 新しいプロパティは必ずオプショナルとして追加
 * 4. APIパスは必ずこのファイルで一元管理する
 * 5. コード内でAPIパスをハードコードしない
 * 6. 2つの同期されたtypes/index.tsを単一の真実源とする
 * 7. パスパラメータを含むエンドポイントは関数として提供する
 */

// ===========================================
// 基本型定義
// ===========================================

export type ID = string;

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: Record<string, any>;
}

// ===========================================
// 認証・ユーザー関連型定義
// ===========================================

export interface TrialAuthRequest {
  passkey: string;
}

export interface TrialAuthResponse {
  success: boolean;
  token: string;
  expires: number;
  user: {
    trial: boolean;
    id: number;
  };
}

export interface User extends Timestamps {
  id: ID;
  email?: string;
  isTrialUser: boolean;
  trialExpires?: Date;
  settings: UserSettings;
}

export interface UserSettings {
  scoreThreshold: number; // 買い度指数閾値 (60-90)
  notificationInterval: number; // 通知間隔 (分)
  watchlistSymbols: string[]; // 監視銘柄リスト
  mexcApiKey?: string;
  mexcApiSecret?: string;
  telegramChatId?: string;
  telegramEnabled: boolean;
}

// ===========================================
// テクニカル分析・仮想通貨関連型定義
// ===========================================

export interface TechnicalIndicators {
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    position: number; // 価格のボリンジャーバンド内位置 (0-1)
  };
  macd: {
    macd: number;
    signal: number;
    histogram: number;
    trend: 'bullish' | 'bearish' | 'neutral';
  };
  rsi: {
    value: number;
    status: 'oversold' | 'overbought' | 'neutral';
  };
}

export interface CryptoCurrency {
  symbol: string; // BTCUSDT
  name: string; // ビットコイン
  baseAsset: string; // BTC
  quoteAsset: string; // USDT
}

export interface PriceData extends Timestamps {
  symbol: string;
  price: number;
  volume: number;
  change24h: number; // 24時間変動率
  changePercent: string; // 表示用変動率文字列 (例: "+2.4%")
}

export interface AnalysisData extends Timestamps {
  id: ID;
  symbol: string;
  price: number;
  timestamp: Date;
  indicators: TechnicalIndicators;
  score: number; // 買い度指数 (0-100)
  scoreBreakdown: {
    bollinger: number;
    macd: number;
    rsi: number;
  };
  trend: 'up' | 'down' | 'neutral';
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
}

export interface RealtimeAnalysis {
  symbol: string;
  name: string;
  price: number;
  score: number;
  trend: 'up' | 'down';
  change: string; // 表示用 (例: "+2.4%")
  lastUpdated: Date;
}

// ===========================================
// 監視リスト・通知関連型定義
// ===========================================

export interface WatchlistItem extends Timestamps {
  id: ID;
  userId: ID;
  symbol: string;
  isActive: boolean;
  addedAt: Date;
}

export interface NotificationHistory extends Timestamps {
  id: ID;
  userId: ID;
  symbol: string;
  score: number;
  price: number;
  timestamp: Date;
  notificationType: 'telegram' | 'browser' | 'email';
  sent: boolean;
  sentAt?: Date;
  outcome?: number; // 通知後の価格変動率 (後日計算)
}

export interface NotificationSettings {
  scoreThreshold: number;
  interval: number; // 分
  methods: ('telegram' | 'browser' | 'email')[];
  telegramChatId?: string;
  enabled: boolean;
}

// ===========================================
// API関連型定義
// ===========================================

export interface MEXCApiCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface MEXCConnectionStatus {
  connected: boolean;
  lastChecked: Date;
  error?: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId?: string;
  connected: boolean;
  lastTestAt?: Date;
}

// ===========================================
// リクエスト・レスポンス型定義
// ===========================================

export interface AddWatchlistRequest {
  symbol: string;
}

export interface RemoveWatchlistRequest {
  symbol: string;
}

export interface UpdateSettingsRequest {
  scoreThreshold?: number;
  notificationInterval?: number;
  watchlistSymbols?: string[];
  mexcApiKey?: string;
  mexcApiSecret?: string;
  telegramChatId?: string;
  telegramEnabled?: boolean;
}

export interface SendTestNotificationRequest {
  chatId: string;
  method: 'telegram';
}

export interface HistoryQuery extends PaginationParams {
  symbol?: string;
  startDate?: string;
  endDate?: string;
  scoreMin?: number;
}

// ===========================================
// APIパス一元管理
// ===========================================

export const API_PATHS = {
  // 認証関連
  AUTH: {
    TRIAL_LOGIN: '/api/auth/trial',
    LOGOUT: '/api/auth/logout',
    VERIFY: '/api/auth/verify',
  },

  // ユーザー関連
  USERS: {
    PROFILE: '/api/users/profile',
    SETTINGS: '/api/users/settings',
  },

  // リアルタイム分析関連
  ANALYSIS: {
    REALTIME: '/api/analysis/realtime',
    HISTORY: '/api/analysis/history',
    DETAIL: (symbol: string) => `/api/analysis/${symbol}`,
    CURRENT_SCORE: '/api/analysis/current-score',
  },

  // 監視リスト関連
  WATCHLIST: {
    BASE: '/api/watchlist',
    ADD: '/api/watchlist/add',
    REMOVE: '/api/watchlist/remove',
    DETAIL: (symbol: string) => `/api/watchlist/${symbol}`,
  },

  // 通知関連
  NOTIFICATIONS: {
    SETTINGS: '/api/notifications/settings',
    HISTORY: '/api/notifications/history',
    TEST: '/api/notifications/test',
    TELEGRAM_TEST: '/api/notifications/telegram/test',
  },

  // MEXC API関連
  MEXC: {
    CONNECTION_STATUS: '/api/mexc/status',
    TEST_CONNECTION: '/api/mexc/test',
    SYMBOLS: '/api/mexc/symbols',
    PRICE: (symbol: string) => `/api/mexc/price/${symbol}`,
  },

  // 履歴関連
  HISTORY: {
    NOTIFICATIONS: '/api/history/notifications',
    ANALYSIS: '/api/history/analysis',
    PERFORMANCE: '/api/history/performance',
  },

  // システム関連
  SYSTEM: {
    HEALTH: '/api/system/health',
    STATUS: '/api/system/status',
  },
} as const;

// ===========================================
// バリデーション関連
// ===========================================

export const VALIDATION = {
  SCORE_THRESHOLD: {
    MIN: 60,
    MAX: 90,
    DEFAULT: 75,
    STEP: 5,
  },
  NOTIFICATION_INTERVAL: {
    MIN: 15,
    MAX: 240,
    DEFAULT: 60,
    STEP: 15,
  },
  WATCHLIST: {
    MAX_ITEMS_DASHBOARD: 3,
    MAX_ITEMS_SETTINGS: 10,
    MIN_SYMBOL_LENGTH: 6,
    MAX_SYMBOL_LENGTH: 12,
  },
  TELEGRAM: {
    CHAT_ID_PATTERN: /^-?\d+$/,
    MIN_CHAT_ID_LENGTH: 8,
  },
} as const;

// ===========================================
// 定数定義
// ===========================================

export const CONSTANTS = {
  TRIAL_KEYS: ['TRIAL2025', 'AWAKEN2'],
  UPDATE_INTERVAL: 5000, // 5秒
  HIGH_SCORE_THRESHOLD: 75,
  MEDIUM_SCORE_THRESHOLD: 60,
  NOTIFICATION_COLORS: {
    HIGH: '#ff0040',
    MEDIUM: '#ffaa00',
    LOW: '#00ff41',
  },
} as const;

// ===========================================
// 型ガード関数
// ===========================================

export function isValidSymbol(symbol: string): boolean {
  return typeof symbol === 'string' && 
         symbol.length >= VALIDATION.WATCHLIST.MIN_SYMBOL_LENGTH && 
         symbol.length <= VALIDATION.WATCHLIST.MAX_SYMBOL_LENGTH &&
         symbol.endsWith('USDT');
}

export function isValidScoreThreshold(threshold: number): boolean {
  return threshold >= VALIDATION.SCORE_THRESHOLD.MIN && 
         threshold <= VALIDATION.SCORE_THRESHOLD.MAX &&
         threshold % VALIDATION.SCORE_THRESHOLD.STEP === 0;
}

export function isValidTelegramChatId(chatId: string): boolean {
  return VALIDATION.TELEGRAM.CHAT_ID_PATTERN.test(chatId) && 
         chatId.length >= VALIDATION.TELEGRAM.MIN_CHAT_ID_LENGTH;
}

// ===========================================
// ヘルパー型
// ===========================================

export type TrendDirection = 'up' | 'down' | 'neutral';
export type ScoreLevel = 'high' | 'medium' | 'low';
export type NotificationMethod = 'telegram' | 'browser' | 'email';
export type AnalysisTimeframe = '5m' | '15m' | '1h' | '4h' | '1d';

// 型は既に上記で export interface/type として定義されているため、
// 重複エクスポートは不要