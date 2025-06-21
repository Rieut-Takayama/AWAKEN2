// @MOCK_TO_API: API実装時にこのブロック全体をAPI呼び出しに置き換え
import { RealtimeAnalysis, AnalysisData } from '@/types';
import { MOCK_REALTIME_ANALYSIS, MOCK_ANALYSIS_DATA } from './data/analysis.mock';

export const mockAnalysisService = {
  // @MOCK_TO_API: analysisService.getRealtimeData()に置き換え
  getRealtimeData: async (): Promise<RealtimeAnalysis[]> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.warn('🔧 Using MOCK data for realtime analysis');
    
    // リアルタイム感を演出するためにランダムな値でデータを更新
    return MOCK_REALTIME_ANALYSIS.map(item => ({
      ...item,
      price: item.price * (1 + (Math.random() * 0.1 - 0.05)), // ±5%の価格変動
      score: Math.max(0, Math.min(100, item.score + Math.floor(Math.random() * 10 - 5))), // ±5のスコア変動
      change: ((Math.random() * 6 - 3).toFixed(1)) + '%', // ±3%の変動
      trend: Math.random() > 0.5 ? 'up' : 'down',
      lastUpdated: new Date()
    }));
  },

  // @MOCK_TO_API: analysisService.getDetailedAnalysis()に置き換え
  getDetailedAnalysis: async (symbol: string): Promise<AnalysisData> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    console.warn(`🔧 Using MOCK data for detailed analysis: ${symbol}`);
    
    return {
      ...MOCK_ANALYSIS_DATA,
      symbol,
      id: `analysis_${symbol}_${Date.now()}`,
      timestamp: new Date(),
      updatedAt: new Date()
    };
  },

  // @MOCK_TO_API: analysisService.getCurrentScore()に置き換え
  getCurrentScore: async (): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.warn('🔧 Using MOCK data for current score');
    
    // 現在の最高スコアを返す
    const realtimeData = await mockAnalysisService.getRealtimeData();
    return Math.max(...realtimeData.map(item => item.score));
  }
};