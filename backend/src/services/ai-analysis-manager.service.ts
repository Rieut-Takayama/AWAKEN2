import { AIAnalysisService } from './ai-analysis.service';
import { UserCredentials } from '../models';
import { decryptForUser } from '../utils/user-crypto';

// ユーザーごとのAIサービスインスタンスを管理
class AIAnalysisManagerService {
  private userInstances: Map<string, AIAnalysisService> = new Map();
  
  // ユーザー専用のAIサービスインスタンスを取得
  async getUserInstance(userId: string): Promise<AIAnalysisService | null> {
    // 既存のインスタンスがあれば返す
    if (this.userInstances.has(userId)) {
      return this.userInstances.get(userId)!;
    }
    
    // ユーザーの認証情報を取得
    const credentials = await UserCredentials.findOne({ userId });
    if (!credentials || !credentials.claudeApiKey) {
      console.log(`⚠️ ユーザー ${userId} のClaude APIキーが未設定だ！`);
      return null;
    }
    
    // ユーザー固有のキーでAPIキーを復号化
    const apiKey = decryptForUser(credentials.claudeApiKey, userId);
    
    // 新しいインスタンスを作成
    const instance = new AIAnalysisService();
    instance.setUserApiKey(apiKey);
    
    // キャッシュに保存
    this.userInstances.set(userId, instance);
    
    console.log(`✅ ユーザー ${userId} 専用のAIサービスインスタンスを作成したぜ！`);
    
    return instance;
  }
  
  // インスタンスをクリーンアップ
  removeUserInstance(userId: string): void {
    if (this.userInstances.has(userId)) {
      const instance = this.userInstances.get(userId)!;
      instance.stopRealtimeAnalysis();
      this.userInstances.delete(userId);
      console.log(`🧹 ユーザー ${userId} のAIサービスインスタンスをクリーンアップしたぜ！`);
    }
  }
  
  // 全インスタンスをクリーンアップ
  cleanup(): void {
    for (const [userId, instance] of this.userInstances) {
      instance.stopRealtimeAnalysis();
    }
    this.userInstances.clear();
    console.log('🧹 全ユーザーのAIサービスインスタンスをクリーンアップしたぜ！');
  }
}

export const aiAnalysisManager = new AIAnalysisManagerService();