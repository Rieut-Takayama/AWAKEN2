import request from 'supertest';
import Application from '../../../src/app';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { DbTestHelper } from '../../utils/db-test-helper';
import { API_PATHS } from '../../../src/types';

/**
 * システム機能統合テスト
 * ★9統合テスト成功請負人が実行するシステムヘルスチェック機能の完全テスト
 * 
 * テスト戦略:
 * - 実際のデータベース接続状態をテスト
 * - システムメトリクスの妥当性確認
 * - パフォーマンス閾値の確認
 */
describe('システム機能統合テスト', () => {
  let app: Application;
  let server: any;

  beforeAll(async () => {
    const tracker = new MilestoneTracker('システムテスト環境セットアップ');
    
    try {
      tracker.mark('アプリケーション初期化');
      app = new Application();
      server = app.app;
      
      tracker.mark('データベース接続確認');
      const isConnected = DbTestHelper.isConnected();
      expect(isConnected).toBe(true);
      
      tracker.markSuccess('環境セットアップ完了');
      tracker.summary();
    } catch (error) {
      tracker.markError('環境セットアップ失敗', error);
      tracker.summary();
      throw error;
    }
  }, 30000);

  describe('GET /api/system/health - ヘルスチェック', () => {
    it('システムが正常状態でヘルスチェック成功', async () => {
      const tracker = new MilestoneTracker('ヘルスチェック');
      
      try {
        tracker.mark('ヘルスチェックリクエスト送信');
        const response = await request(server)
          .get(API_PATHS.SYSTEM.HEALTH)
          .expect(200);
        
        tracker.mark('基本レスポンス検証');
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.status).toBe('healthy');
        
        tracker.mark('タイムスタンプ検証');
        const data = response.body.data;
        expect(data.timestamp).toBeDefined();
        const timestampDate = new Date(data.timestamp);
        const now = new Date();
        const timeDiff = Math.abs(now.getTime() - timestampDate.getTime());
        expect(timeDiff).toBeLessThan(5000); // 5秒以内
        
        tracker.mark('アプリケーション情報検証');
        expect(data.version).toBeDefined();
        expect(data.environment).toBeDefined();
        expect(data.uptime).toBeGreaterThan(0);
        
        tracker.mark('サービス状態検証');
        expect(data.services).toBeDefined();
        expect(data.services.database).toBeDefined();
        expect(data.services.database.status).toBe('connected');
        expect(data.services.database.connection_state).toBe('connected');
        
        tracker.mark('メモリ情報検証');
        expect(data.services.memory).toBeDefined();
        expect(data.services.memory.used).toBeDefined();
        expect(data.services.memory.total).toBeDefined();
        expect(data.services.memory.usage_percent).toBeGreaterThan(0);
        expect(data.services.memory.usage_percent).toBeLessThan(100);
        
        tracker.mark('プロセス情報検証');
        expect(data.services.process).toBeDefined();
        expect(data.services.process.pid).toBeGreaterThan(0);
        expect(data.services.process.node_version).toBeDefined();
        expect(data.services.process.platform).toBeDefined();
        expect(data.services.process.arch).toBeDefined();
        
        tracker.mark('レスポンス時間検証');
        expect(response.body.meta).toBeDefined();
        expect(response.body.meta.response_time_ms).toBeDefined();
        expect(response.body.meta.response_time_ms).toBeGreaterThan(0);
        expect(response.body.meta.response_time_ms).toBeLessThan(1000); // 1秒以内
        
        tracker.markSuccess('ヘルスチェック完全検証成功', {
          status: data.status,
          uptime: data.uptime,
          memoryUsage: data.services.memory.usage_percent,
          responseTime: response.body.meta.response_time_ms
        });
        
        tracker.summary();
        
        // パフォーマンス検証
        expect(tracker.checkThreshold('ヘルスチェック', 2)).toBe(true); // 2秒以内
      } catch (error) {
        tracker.markError('ヘルスチェック失敗', error);
        tracker.summary();
        throw error;
      }
    });

    it('ヘルスチェックレスポンス時間が適切', async () => {
      const tracker = new MilestoneTracker('ヘルスチェックパフォーマンス');
      
      try {
        const startTime = Date.now();
        
        tracker.mark('パフォーマンステスト開始');
        const response = await request(server)
          .get(API_PATHS.SYSTEM.HEALTH)
          .expect(200);
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        tracker.mark('レスポンス時間計測完了');
        expect(responseTime).toBeLessThan(500); // 500ms以内
        
        // レスポンス内の時間も確認
        expect(response.body.meta.response_time_ms).toBeLessThan(200); // 内部処理は200ms以内
        
        tracker.markSuccess('パフォーマンステスト成功', {
          totalResponseTime: responseTime,
          internalProcessingTime: response.body.meta.response_time_ms
        });
        
        tracker.summary();
      } catch (error) {
        tracker.markError('パフォーマンステスト失敗', error);
        tracker.summary();
        throw error;
      }
    });
  });

  describe('GET /api/system/status - 詳細ステータス', () => {
    it('詳細システムステータス取得成功', async () => {
      const tracker = new MilestoneTracker('詳細ステータス');
      
      try {
        tracker.mark('詳細ステータスリクエスト送信');
        const response = await request(server)
          .get(API_PATHS.SYSTEM.STATUS)
          .expect(200);
        
        tracker.mark('基本レスポンス検証');
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.status).toBe('healthy');
        
        const data = response.body.data;
        
        tracker.mark('詳細メトリクス検証');
        expect(data.detailed_metrics).toBeDefined();
        expect(data.detailed_metrics.response_time_ms).toBeGreaterThan(0);
        expect(data.detailed_metrics.cpu_usage).toBeDefined();
        expect(data.detailed_metrics.cpu_usage.user).toBeGreaterThanOrEqual(0);
        expect(data.detailed_metrics.cpu_usage.system).toBeGreaterThanOrEqual(0);
        expect(data.detailed_metrics.event_loop_delay).toBeGreaterThanOrEqual(0);
        
        tracker.mark('イベントループ遅延確認');
        // イベントループ遅延が正常範囲内であることを確認
        expect(data.detailed_metrics.event_loop_delay).toBeLessThan(100); // 100ms以内
        
        tracker.mark('全てのヘルスチェック項目確認');
        // 基本ヘルスチェック項目も含まれていることを確認
        expect(data.services.database.status).toBe('connected');
        expect(data.services.memory.usage_percent).toBeLessThan(90); // メモリ使用率90%未満
        
        tracker.markSuccess('詳細ステータス検証完了', {
          responseTime: data.detailed_metrics.response_time_ms,
          eventLoopDelay: data.detailed_metrics.event_loop_delay,
          memoryUsage: data.services.memory.usage_percent,
          cpuUser: data.detailed_metrics.cpu_usage.user,
          cpuSystem: data.detailed_metrics.cpu_usage.system
        });
        
        tracker.summary();
      } catch (error) {
        tracker.markError('詳細ステータス失敗', error);
        tracker.summary();
        throw error;
      }
    });
  });

  describe('システム統合テスト', () => {
    it('ヘルスチェック → 詳細ステータス の順次取得', async () => {
      const tracker = new MilestoneTracker('システム統合フロー');
      
      try {
        tracker.mark('Step1: ヘルスチェック');
        const healthResponse = await request(server)
          .get(API_PATHS.SYSTEM.HEALTH)
          .expect(200);
        
        expect(healthResponse.body.data.status).toBe('healthy');
        
        tracker.mark('Step2: 詳細ステータス');
        const statusResponse = await request(server)
          .get(API_PATHS.SYSTEM.STATUS)
          .expect(200);
        
        expect(statusResponse.body.data.status).toBe('healthy');
        
        tracker.mark('レスポンス一貫性確認');
        // 両方のレスポンスでステータスが一致することを確認
        expect(healthResponse.body.data.status).toBe(statusResponse.body.data.status);
        
        // データベース接続状態が一致することを確認
        expect(healthResponse.body.data.services.database.status)
          .toBe(statusResponse.body.data.services.database.status);
        
        tracker.markSuccess('システム統合フロー成功', {
          healthStatus: healthResponse.body.data.status,
          statusStatus: statusResponse.body.data.status,
          consistency: true
        });
        
        tracker.summary();
        
        // パフォーマンス検証
        expect(tracker.checkThreshold('システム統合フロー', 5)).toBe(true); // 5秒以内
      } catch (error) {
        tracker.markError('システム統合フロー失敗', error);
        tracker.summary();
        throw error;
      }
    });

    it('データベース統計情報の取得確認', async () => {
      const tracker = new MilestoneTracker('データベース統計確認');
      
      try {
        tracker.mark('データベース統計取得');
        const dbStats = await DbTestHelper.getDatabaseStats();
        
        tracker.mark('統計情報検証');
        expect(dbStats).toBeDefined();
        expect(dbStats.connection).toBeDefined();
        expect(dbStats.connection.state).toBe(1); // connected
        expect(dbStats.database).toBeDefined();
        expect(dbStats.models).toBeDefined();
        
        tracker.mark('インデックス確認');
        const indexes = await DbTestHelper.checkIndexes('User');
        expect(indexes).toBeDefined();
        expect(Array.isArray(indexes)).toBe(true);
        
        tracker.markSuccess('データベース統計確認完了', {
          connectionState: dbStats.connection.state,
          collections: dbStats.database.collections,
          userCount: dbStats.models.userCount,
          indexCount: indexes.length
        });
        
        tracker.summary();
      } catch (error) {
        tracker.markError('データベース統計確認失敗', error);
        tracker.summary();
        throw error;
      }
    });
  });

  describe('エラーハンドリングテスト', () => {
    it('存在しないエンドポイントで404', async () => {
      const tracker = new MilestoneTracker('404エラーテスト');
      
      try {
        tracker.mark('存在しないエンドポイントにリクエスト');
        const response = await request(server)
          .get('/api/nonexistent')
          .expect(404);
        
        tracker.mark('404レスポンス検証');
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('ルートが見つかりません');
        expect(response.body.meta).toBeDefined();
        expect(response.body.meta.method).toBe('GET');
        expect(response.body.meta.path).toBe('/api/nonexistent');
        
        tracker.markSuccess('404エラーハンドリング正常');
        tracker.summary();
      } catch (error) {
        tracker.markError('404テスト失敗', error);
        tracker.summary();
        throw error;
      }
    });
  });
});