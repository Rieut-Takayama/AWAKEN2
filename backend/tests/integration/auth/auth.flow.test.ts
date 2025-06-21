import request from 'supertest';
import Application from '../../../src/app';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { DbTestHelper } from '../../utils/db-test-helper';
import { TestAuthHelper } from '../../utils/test-auth-helper';
import { API_PATHS } from '../../../src/types';

/**
 * 認証機能統合テスト
 * ★9統合テスト成功請負人が実行する認証フローの完全テスト
 * 
 * テスト戦略:
 * - 実際のデータベースを使用（モック禁止）
 * - 各テストケースは独立（ユニークデータ使用）
 * - 完全な認証フローをテスト
 * - エラーケースも包括的にテスト
 */
describe('認証機能統合テスト', () => {
  let app: Application;
  let server: any;

  beforeAll(async () => {
    const tracker = new MilestoneTracker('認証テスト環境セットアップ');
    
    try {
      tracker.mark('アプリケーション初期化開始');
      app = new Application();
      server = app.app;
      
      tracker.mark('データベース接続確認');
      const isConnected = DbTestHelper.isConnected();
      expect(isConnected).toBe(true);
      
      tracker.mark('テストデータクリーンアップ');
      await DbTestHelper.cleanupTestData();
      
      tracker.markSuccess('環境セットアップ完了');
      tracker.summary();
    } catch (error) {
      tracker.markError('環境セットアップ失敗', error);
      tracker.summary();
      throw error;
    }
  }, 30000);

  afterAll(async () => {
    const tracker = new MilestoneTracker('認証テスト環境クリーンアップ');
    
    try {
      tracker.mark('テストデータクリーンアップ開始');
      await DbTestHelper.cleanupTestData();
      
      tracker.markSuccess('クリーンアップ完了');
      tracker.summary();
    } catch (error) {
      tracker.markError('クリーンアップ失敗', error);
      tracker.summary();
    }
  });

  describe('POST /api/auth/trial - トライアル認証', () => {
    it('有効なパスキー(TRIAL2025)で認証成功', async () => {
      const tracker = new MilestoneTracker('トライアル認証 - TRIAL2025');
      
      try {
        tracker.mark('テストデータ準備');
        const testData = DbTestHelper.generateUniqueTestData();
        
        tracker.mark('API リクエスト送信');
        const response = await request(server)
          .post(API_PATHS.AUTH.TRIAL_LOGIN)
          .send({ passkey: 'TRIAL2025' })
          .expect(200);
        
        tracker.mark('レスポンス受信完了');
        
        // レスポンス構造の検証
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.message).toContain('認証が成功');
        
        tracker.mark('レスポンス基本構造検証完了');
        
        // 認証レスポンスの詳細検証
        const authData = response.body.data;
        const isValid = TestAuthHelper.validateTrialAuthResponse(authData);
        expect(isValid).toBe(true);
        
        tracker.mark('認証データ検証完了');
        
        // JWTトークンの検証
        const tokenVerification = TestAuthHelper.verifyToken(authData.token);
        expect(tokenVerification.valid).toBe(true);
        expect(tokenVerification.payload).toBeDefined();
        expect(tokenVerification.payload.trial).toBe(true);
        
        tracker.mark('JWTトークン検証完了');
        
        // 有効期限の確認
        expect(authData.expires).toBeGreaterThan(Date.now());
        const expiresIn24Hours = Date.now() + (24 * 60 * 60 * 1000);
        expect(authData.expires).toBeLessThanOrEqual(expiresIn24Hours + 60000); // 1分の余裕
        
        tracker.markSuccess('全検証完了', {
          userId: authData.user.id,
          tokenLength: authData.token.length,
          expiresIn: Math.round((authData.expires - Date.now()) / 1000 / 60 / 60) + '時間'
        });
        
        tracker.summary();
      } catch (error) {
        tracker.markError('テスト失敗', error);
        tracker.summary();
        throw error;
      }
    });

    it('有効なパスキー(AWAKEN2)で認証成功', async () => {
      const tracker = new MilestoneTracker('トライアル認証 - AWAKEN2');
      
      try {
        tracker.mark('API リクエスト送信');
        const response = await request(server)
          .post(API_PATHS.AUTH.TRIAL_LOGIN)
          .send({ passkey: 'AWAKEN2' })
          .expect(200);
        
        tracker.mark('レスポンス検証');
        expect(response.body.success).toBe(true);
        expect(response.body.data.user.trial).toBe(true);
        
        // トークンの有効性確認
        const tokenVerification = TestAuthHelper.verifyToken(response.body.data.token);
        expect(tokenVerification.valid).toBe(true);
        
        tracker.markSuccess('AWAKEN2認証成功');
        tracker.summary();
      } catch (error) {
        tracker.markError('AWAKEN2認証失敗', error);
        tracker.summary();
        throw error;
      }
    });

    it('無効なパスキーで認証失敗', async () => {
      const tracker = new MilestoneTracker('無効パスキー認証テスト');
      
      try {
        tracker.mark('無効パスキーでリクエスト送信');
        const response = await request(server)
          .post(API_PATHS.AUTH.TRIAL_LOGIN)
          .send({ passkey: 'INVALID_KEY' })
          .expect(401);
        
        tracker.mark('エラーレスポンス検証');
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        expect(response.body.error).toContain('無効なパスキー');
        
        tracker.markSuccess('無効パスキー拒否成功');
        tracker.summary();
      } catch (error) {
        tracker.markError('無効パスキーテスト失敗', error);
        tracker.summary();
        throw error;
      }
    });

    it('パスキー欠落で認証失敗', async () => {
      const tracker = new MilestoneTracker('パスキー欠落テスト');
      
      try {
        tracker.mark('空のリクエスト送信');
        const response = await request(server)
          .post(API_PATHS.AUTH.TRIAL_LOGIN)
          .send({})
          .expect(422);
        
        tracker.mark('バリデーションエラー検証');
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        
        tracker.markSuccess('パスキー欠落拒否成功');
        tracker.summary();
      } catch (error) {
        tracker.markError('パスキー欠落テスト失敗', error);
        tracker.summary();
        throw error;
      }
    });
  });

  describe('GET /api/auth/verify - トークン検証', () => {
    let validToken: string;

    beforeEach(async () => {
      const tracker = new MilestoneTracker('トークン検証テスト準備');
      
      try {
        tracker.mark('有効トークン取得');
        const authResponse = await request(server)
          .post(API_PATHS.AUTH.TRIAL_LOGIN)
          .send({ passkey: 'TRIAL2025' });
        
        validToken = authResponse.body.data.token;
        expect(validToken).toBeDefined();
        
        tracker.markSuccess('準備完了', { tokenLength: validToken.length });
        tracker.summary();
      } catch (error) {
        tracker.markError('準備失敗', error);
        tracker.summary();
        throw error;
      }
    });

    it('有効なトークンで検証成功', async () => {
      const tracker = new MilestoneTracker('有効トークン検証');
      
      try {
        tracker.mark('認証ヘッダー準備');
        const authHeader = TestAuthHelper.createAuthHeader(validToken);
        
        tracker.mark('検証リクエスト送信');
        const response = await request(server)
          .get(API_PATHS.AUTH.VERIFY)
          .set('Authorization', authHeader)
          .expect(200);
        
        tracker.mark('レスポンス検証');
        expect(response.body.success).toBe(true);
        expect(response.body.data.valid).toBe(true);
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.isTrialUser).toBe(true);
        
        tracker.markSuccess('有効トークン検証成功');
        tracker.summary();
      } catch (error) {
        tracker.markError('有効トークン検証失敗', error);
        tracker.summary();
        throw error;
      }
    });

    it('無効なトークンで検証失敗', async () => {
      const tracker = new MilestoneTracker('無効トークン検証');
      
      try {
        tracker.mark('無効トークン準備');
        const invalidToken = TestAuthHelper.generateInvalidToken();
        const authHeader = TestAuthHelper.createAuthHeader(invalidToken);
        
        tracker.mark('検証リクエスト送信');
        const response = await request(server)
          .get(API_PATHS.AUTH.VERIFY)
          .set('Authorization', authHeader)
          .expect(401);
        
        tracker.mark('エラーレスポンス検証');
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        
        tracker.markSuccess('無効トークン拒否成功');
        tracker.summary();
      } catch (error) {
        tracker.markError('無効トークン検証失敗', error);
        tracker.summary();
        throw error;
      }
    });

    it('期限切れトークンで検証失敗', async () => {
      const tracker = new MilestoneTracker('期限切れトークン検証');
      
      try {
        tracker.mark('期限切れトークン生成');
        const expiredToken = TestAuthHelper.generateExpiredToken();
        const authHeader = TestAuthHelper.createAuthHeader(expiredToken);
        
        tracker.mark('検証リクエスト送信');
        const response = await request(server)
          .get(API_PATHS.AUTH.VERIFY)
          .set('Authorization', authHeader)
          .expect(401);
        
        tracker.mark('期限切れエラー検証');
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('有効期限');
        
        tracker.markSuccess('期限切れトークン拒否成功');
        tracker.summary();
      } catch (error) {
        tracker.markError('期限切れトークン検証失敗', error);
        tracker.summary();
        throw error;
      }
    });

    it('認証ヘッダー欠落で検証失敗', async () => {
      const tracker = new MilestoneTracker('認証ヘッダー欠落テスト');
      
      try {
        tracker.mark('認証なしリクエスト送信');
        const response = await request(server)
          .get(API_PATHS.AUTH.VERIFY)
          .expect(401);
        
        tracker.mark('認証エラー検証');
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('認証トークンが必要');
        
        tracker.markSuccess('認証ヘッダー欠落拒否成功');
        tracker.summary();
      } catch (error) {
        tracker.markError('認証ヘッダー欠落テスト失敗', error);
        tracker.summary();
        throw error;
      }
    });
  });

  describe('POST /api/auth/logout - ログアウト', () => {
    let validToken: string;

    beforeEach(async () => {
      const authResponse = await request(server)
        .post(API_PATHS.AUTH.TRIAL_LOGIN)
        .send({ passkey: 'TRIAL2025' });
      
      validToken = authResponse.body.data.token;
    });

    it('有効なトークンでログアウト成功', async () => {
      const tracker = new MilestoneTracker('ログアウト');
      
      try {
        tracker.mark('ログアウトリクエスト送信');
        const response = await request(server)
          .post(API_PATHS.AUTH.LOGOUT)
          .set('Authorization', TestAuthHelper.createAuthHeader(validToken))
          .expect(200);
        
        tracker.mark('レスポンス検証');
        expect(response.body.success).toBe(true);
        expect(response.body.data.success).toBe(true);
        expect(response.body.message).toContain('ログアウト');
        
        tracker.markSuccess('ログアウト成功');
        tracker.summary();
      } catch (error) {
        tracker.markError('ログアウト失敗', error);
        tracker.summary();
        throw error;
      }
    });
  });

  describe('認証フロー統合テスト', () => {
    it('完全な認証フロー: 認証 → 検証 → ログアウト', async () => {
      const tracker = new MilestoneTracker('完全認証フロー');
      
      try {
        tracker.mark('Step1: トライアル認証');
        const authResponse = await request(server)
          .post(API_PATHS.AUTH.TRIAL_LOGIN)
          .send({ passkey: 'TRIAL2025' })
          .expect(200);
        
        const token = authResponse.body.data.token;
        expect(token).toBeDefined();
        
        tracker.mark('Step2: トークン検証');
        const verifyResponse = await request(server)
          .get(API_PATHS.AUTH.VERIFY)
          .set('Authorization', TestAuthHelper.createAuthHeader(token))
          .expect(200);
        
        expect(verifyResponse.body.data.valid).toBe(true);
        
        tracker.mark('Step3: ログアウト');
        const logoutResponse = await request(server)
          .post(API_PATHS.AUTH.LOGOUT)
          .set('Authorization', TestAuthHelper.createAuthHeader(token))
          .expect(200);
        
        expect(logoutResponse.body.success).toBe(true);
        
        tracker.markSuccess('完全フロー成功', {
          steps: 3,
          userId: authResponse.body.data.user.id
        });
        
        tracker.summary();
        
        // パフォーマンス検証
        expect(tracker.checkThreshold('完全フロー', 10)).toBe(true); // 10秒以内
      } catch (error) {
        tracker.markError('完全フロー失敗', error);
        tracker.summary();
        throw error;
      }
    });
  });
});