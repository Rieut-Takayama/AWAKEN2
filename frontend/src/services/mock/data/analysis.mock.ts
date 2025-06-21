// @MOCK_DATA: ハードコードされたサンプルデータ
import { RealtimeAnalysis, AnalysisData, TechnicalIndicators } from '@/types';

export const MOCK_TECHNICAL_INDICATORS: TechnicalIndicators = {
  bollinger: {
    upper: 45000.50,
    middle: 43250.67,
    lower: 41500.84,
    position: 0.65
  },
  macd: {
    macd: 125.34,
    signal: 98.76,
    histogram: 26.58,
    trend: 'bullish'
  },
  rsi: {
    value: 68.5,
    status: 'neutral'
  }
};

export const MOCK_REALTIME_ANALYSIS: RealtimeAnalysis[] = [
  {
    symbol: 'BTCUSDT',
    name: 'ビットコイン',
    price: 43250.67,
    score: 82,
    trend: 'up',
    change: '+2.4%',
    lastUpdated: new Date()
  },
  {
    symbol: 'ETHUSDT',
    name: 'イーサリアム',
    price: 2567.89,
    score: 76,
    trend: 'up',
    change: '+1.8%',
    lastUpdated: new Date()
  },
  {
    symbol: 'ADAUSDT',
    name: 'カルダノ',
    price: 0.4523,
    score: 68,
    trend: 'down',
    change: '-0.5%',
    lastUpdated: new Date()
  }
];

export const MOCK_ANALYSIS_DATA: AnalysisData = {
  id: '1',
  symbol: 'BTCUSDT',
  price: 43250.67,
  timestamp: new Date(),
  indicators: MOCK_TECHNICAL_INDICATORS,
  score: 82,
  scoreBreakdown: {
    bollinger: 28,
    macd: 32,
    rsi: 22
  },
  trend: 'up',
  recommendation: 'strong_buy',
  createdAt: new Date(),
  updatedAt: new Date()
};