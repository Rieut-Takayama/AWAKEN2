import jwt from 'jsonwebtoken';
import { jwtConfig } from '../../src/config/env.config';
import { TrialAuthResponse } from '../../src/types';
import { logger } from '../../src/common/utils/logger.util';

/**
 * 認証テストヘルパー
 * ★9統合テスト成功請負人が認証関連のテストを成功させるためのユーティリティ
 */
export class TestAuthHelper {
  
  /**
   * テスト用JWTトークン生成
   * 統合テストで認証が必要なエンドポイントをテストする際に使用
   */
  public static generateTestToken(payload: { id: number; trial: boolean } = { id: 123456, trial: true }): string {
    try {
      const token = jwt.sign(
        payload,
        jwtConfig.JWT_SECRET as string,
        {
          expiresIn: jwtConfig.JWT_EXPIRES_IN,
          issuer: 'AWAKEN2',
          audience: 'AWAKEN2-CLIENT'
        } as jwt.SignOptions
      );
      
      logger.debug('[TEST_AUTH] テストトークン生成完了:', {
        userId: payload.id,
        trial: payload.trial,
        tokenLength: token.length
      });
      
      return token;
    } catch (error) {
      logger.error('[TEST_AUTH] テストトークン生成エラー:', error);
      throw error;
    }
  }
  
  /**
   * 期限切れトークンの生成（エラーテスト用）
   */
  public static generateExpiredToken(payload: { id: number; trial: boolean } = { id: 123456, trial: true }): string {
    try {
      const token = jwt.sign(
        payload,
        jwtConfig.JWT_SECRET as string,
        {
          expiresIn: '-1h', // 1時間前に期限切れ
          issuer: 'AWAKEN2',
          audience: 'AWAKEN2-CLIENT'
        }
      );
      
      logger.debug('[TEST_AUTH] 期限切れテストトークン生成完了');
      
      return token;
    } catch (error) {
      logger.error('[TEST_AUTH] 期限切れトークン生成エラー:', error);
      throw error;
    }
  }
  
  /**
   * 無効なトークンの生成（エラーテスト用）
   */
  public static generateInvalidToken(): string {
    return 'invalid.jwt.token';
  }
  
  /**
   * 不正な署名のトークン生成（エラーテスト用）
   */
  public static generateWrongSignatureToken(payload: { id: number; trial: boolean } = { id: 123456, trial: true }): string {
    try {
      const token = jwt.sign(
        payload,
        'wrong-secret-key', // 間違った秘密鍵
        {
          expiresIn: jwtConfig.JWT_EXPIRES_IN,
          issuer: 'AWAKEN2',
          audience: 'AWAKEN2-CLIENT'
        } as jwt.SignOptions
      );
      
      logger.debug('[TEST_AUTH] 不正署名テストトークン生成完了');
      
      return token;
    } catch (error) {
      logger.error('[TEST_AUTH] 不正署名トークン生成エラー:', error);
      throw error;
    }
  }
  
  /**
   * Authorizationヘッダー形式の生成
   */
  public static createAuthHeader(token: string): string {
    return `Bearer ${token}`;
  }
  
  /**
   * トライアル認証レスポンスの検証
   */
  public static validateTrialAuthResponse(response: any): boolean {
    const requiredFields = ['success', 'token', 'expires', 'user'];
    const userRequiredFields = ['trial', 'id'];
    
    // 基本フィールドの確認
    for (const field of requiredFields) {
      if (!(field in response)) {
        logger.error(`[TEST_AUTH] レスポンス検証失敗 - 欠落フィールド: ${field}`);
        return false;
      }
    }
    
    // ユーザーフィールドの確認
    if (!response.user || typeof response.user !== 'object') {
      logger.error('[TEST_AUTH] レスポンス検証失敗 - userフィールドが無効');
      return false;
    }
    
    for (const field of userRequiredFields) {
      if (!(field in response.user)) {
        logger.error(`[TEST_AUTH] レスポンス検証失敗 - user.${field}が欠落`);
        return false;
      }
    }
    
    // 型の確認
    if (typeof response.success !== 'boolean') {
      logger.error('[TEST_AUTH] レスポンス検証失敗 - successが真偽値ではない');
      return false;
    }
    
    if (typeof response.token !== 'string' || response.token.length === 0) {
      logger.error('[TEST_AUTH] レスポンス検証失敗 - tokenが無効');
      return false;
    }
    
    if (typeof response.expires !== 'number' || response.expires <= Date.now()) {
      logger.error('[TEST_AUTH] レスポンス検証失敗 - expiresが無効');
      return false;
    }
    
    if (typeof response.user.trial !== 'boolean') {
      logger.error('[TEST_AUTH] レスポンス検証失敗 - user.trialが真偽値ではない');
      return false;
    }
    
    if (typeof response.user.id !== 'number') {
      logger.error('[TEST_AUTH] レスポンス検証失敗 - user.idが数値ではない');
      return false;
    }
    
    logger.debug('[TEST_AUTH] レスポンス検証成功');
    return true;
  }
  
  /**
   * JWTトークンのデコード（デバッグ用）
   */
  public static decodeToken(token: string): any {
    try {
      const decoded = jwt.decode(token);
      logger.debug('[TEST_AUTH] トークンデコード完了:', decoded);
      return decoded;
    } catch (error) {
      logger.error('[TEST_AUTH] トークンデコードエラー:', error);
      return null;
    }
  }
  
  /**
   * トークンの有効性確認
   */
  public static verifyToken(token: string): { valid: boolean; payload?: any; error?: string } {
    try {
      const payload = jwt.verify(token, jwtConfig.JWT_SECRET);
      logger.debug('[TEST_AUTH] トークン検証成功');
      return { valid: true, payload };
    } catch (error: any) {
      logger.debug('[TEST_AUTH] トークン検証失敗:', error.message);
      return { valid: false, error: error.message };
    }
  }
  
  /**
   * 認証テスト用のシナリオデータ生成
   */
  public static createTestScenarios() {
    return {
      validAuth: {
        passkey: 'TRIAL2025',
        expectedStatus: 200
      },
      validAuthAlt: {
        passkey: 'AWAKEN2',
        expectedStatus: 200
      },
      invalidPasskey: {
        passkey: 'INVALID_KEY',
        expectedStatus: 401
      },
      emptyPasskey: {
        passkey: '',
        expectedStatus: 422
      },
      missingPasskey: {
        expectedStatus: 422
      },
      longPasskey: {
        passkey: 'VERY_LONG_INVALID_PASSKEY_THAT_EXCEEDS_LIMIT',
        expectedStatus: 422
      }
    };
  }
  
  /**
   * ★9がデバッグする際の認証状態ダンプ
   */
  public static dumpAuthState(token?: string): any {
    const state = {
      timestamp: new Date().toISOString(),
      jwtConfig: {
        secretLength: jwtConfig.JWT_SECRET.length,
        expiresIn: jwtConfig.JWT_EXPIRES_IN
      },
      token: token ? {
        provided: true,
        length: token.length,
        format: token.includes('.') ? 'JWT形式' : '不正形式',
        decoded: this.decodeToken(token),
        verification: this.verifyToken(token)
      } : {
        provided: false
      }
    };
    
    logger.debug('[TEST_AUTH] 認証状態ダンプ:', state);
    return state;
  }
}