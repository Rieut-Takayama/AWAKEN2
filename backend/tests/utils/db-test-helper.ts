import mongoose from 'mongoose';
import { UserModel } from '../../src/db/models/user.model';
import { logger } from '../../src/common/utils/logger.util';

/**
 * データベーステストヘルパー
 * ★9統合テスト成功請負人が統合テストを成功させるためのユーティリティ
 */
export class DbTestHelper {
  
  /**
   * テスト用ユニークデータ生成
   * 各テストケースが独立して実行できるようユニークなデータを生成
   */
  public static generateUniqueTestData() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const uniqueId = `${timestamp}-${random}`;
    
    return {
      uniqueId,
      email: `test-${uniqueId}@awaken2.test`,
      passkey: 'TRIAL2025', // 有効なトライアルキー
      timestamp
    };
  }
  
  /**
   * テストデータのクリーンアップ
   * テスト完了後にテストデータを安全に削除
   */
  public static async cleanupTestData(uniqueId?: string): Promise<void> {
    try {
      if (uniqueId) {
        // 特定のテストデータのみ削除
        await UserModel.deleteMany({
          $or: [
            { email: { $regex: uniqueId } },
            { 'settings.mexcApiKey': { $regex: uniqueId } }
          ]
        });
        logger.debug(`[DB_HELPER] 特定テストデータクリーンアップ完了: ${uniqueId}`);
      } else {
        // 全テストデータ削除
        await UserModel.deleteMany({
          email: { $regex: /test-.*@awaken2\.test$/ }
        });
        logger.debug('[DB_HELPER] 全テストデータクリーンアップ完了');
      }
    } catch (error) {
      logger.error('[DB_HELPER] クリーンアップエラー:', error);
    }
  }
  
  /**
   * データベース接続状態確認
   */
  public static isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }
  
  /**
   * コレクション存在確認
   */
  public static async collectionExists(collectionName: string): Promise<boolean> {
    try {
      if (!mongoose.connection.db) {
        logger.warn(`[DB_HELPER] データベース接続が確立されていません`);
        return false;
      }
      const collections = await mongoose.connection.db.listCollections().toArray();
      return collections.some(collection => collection.name === collectionName);
    } catch (error) {
      logger.error(`[DB_HELPER] コレクション確認エラー (${collectionName}):`, error);
      return false;
    }
  }
  
  /**
   * テスト用トランザクション開始
   * ★9が使用する分離されたテスト環境を提供
   */
  public static async startTestTransaction(): Promise<mongoose.ClientSession> {
    const session = await mongoose.startSession();
    session.startTransaction();
    logger.debug('[DB_HELPER] テストトランザクション開始');
    return session;
  }
  
  /**
   * テスト用トランザクション終了（ロールバック）
   */
  public static async rollbackTestTransaction(session: mongoose.ClientSession): Promise<void> {
    try {
      await session.abortTransaction();
      await session.endSession();
      logger.debug('[DB_HELPER] テストトランザクションロールバック完了');
    } catch (error) {
      logger.error('[DB_HELPER] トランザクションロールバックエラー:', error);
    }
  }
  
  /**
   * テストデータ作成ヘルパー
   */
  public static async createTestUser(testData: any = {}) {
    const uniqueData = this.generateUniqueTestData();
    
    const userData = {
      email: testData.email || uniqueData.email,
      isTrialUser: testData.isTrialUser !== undefined ? testData.isTrialUser : true,
      trialExpires: testData.trialExpires || new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)),
      settings: {
        scoreThreshold: testData.scoreThreshold || 75,
        notificationInterval: testData.notificationInterval || 60,
        watchlistSymbols: testData.watchlistSymbols || ['BTCUSDT', 'ETHUSDT'],
        telegramEnabled: testData.telegramEnabled || false,
        ...testData.settings
      }
    };
    
    const user = new UserModel(userData);
    const savedUser = await user.save();
    
    logger.debug('[DB_HELPER] テストユーザー作成完了:', {
      userId: savedUser._id.toString(),
      email: savedUser.email,
      isTrialUser: savedUser.isTrialUser
    });
    
    return savedUser;
  }
  
  /**
   * データベース統計情報取得（★9のデバッグ用）
   */
  public static async getDatabaseStats(): Promise<any> {
    try {
      if (!mongoose.connection.db) {
        return { error: 'データベース接続が確立されていません' };
      }
      const stats = await mongoose.connection.db.stats();
      const userCount = await UserModel.countDocuments();
      
      return {
        connection: {
          state: mongoose.connection.readyState,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name
        },
        database: {
          collections: stats.collections,
          dataSize: stats.dataSize,
          storageSize: stats.storageSize,
          indexSize: stats.indexSize
        },
        models: {
          userCount
        }
      };
    } catch (error) {
      logger.error('[DB_HELPER] 統計情報取得エラー:', error);
      return null;
    }
  }
  
  /**
   * インデックス確認（★9がパフォーマンス問題をデバッグする際に有用）
   */
  public static async checkIndexes(modelName: string = 'User'): Promise<any> {
    try {
      const model = mongoose.model(modelName);
      const indexes = await model.collection.getIndexes();
      
      logger.debug(`[DB_HELPER] ${modelName}モデルのインデックス:`, indexes);
      return indexes;
    } catch (error) {
      logger.error(`[DB_HELPER] インデックス確認エラー (${modelName}):`, error);
      return [];
    }
  }
}