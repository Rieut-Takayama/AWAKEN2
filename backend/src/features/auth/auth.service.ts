import { TrialAuthRequest, TrialAuthResponse, User } from '@/types';
import { authRepository } from './auth.repository';
import { createJWT, verifyJWT, JWTPayload } from '@/common/middlewares/auth.middleware';
import { createError } from '@/common/middlewares/error.middleware';
import { logger, createOperationLogger } from '@/common/utils/logger.util';
import { appConfig } from '@/config/env.config';

export class AuthService {
  private static instance: AuthService;
  
  private constructor() {}
  
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }
  
  public async authenticateTrialUser(request: TrialAuthRequest): Promise<TrialAuthResponse> {
    const opLogger = createOperationLogger('認証サービス:トライアルユーザー認証');
    
    try {
      opLogger.milestone('パスキー検証開始', { passkey: request.passkey });
      
      if (!appConfig.TRIAL_KEYS.includes(request.passkey)) {
        opLogger.milestone('無効なパスキー検出');
        throw createError.unauthorized('無効なパスキーです', { passkey: request.passkey });
      }
      
      opLogger.milestone('パスキー認証成功');
      
      const user = await authRepository.createTrialUser();
      
      opLogger.milestone('トライアルユーザー作成完了', {
        userId: user.id,
        isTrialUser: user.isTrialUser
      });
      
      const jwtPayload = {
        id: parseInt(user.id, 16) % 2147483647, // MongoDB ObjectIdを数値に変換
        trial: user.isTrialUser
      };
      
      opLogger.milestone('JWTペイロード生成', jwtPayload);
      
      const token = createJWT(jwtPayload);
      
      opLogger.milestone('JWT生成完了');
      
      const expirationTime = Date.now() + (24 * 60 * 60 * 1000); // 24時間後
      
      const response: TrialAuthResponse = {
        success: true,
        token,
        expires: expirationTime,
        user: {
          trial: true,
          id: jwtPayload.id
        }
      };
      
      opLogger.complete({
        userId: user.id,
        tokenGenerated: true,
        expires: new Date(expirationTime).toISOString()
      });
      
      return response;
    } catch (error: any) {
      opLogger.error(error, { request });
      
      if (error.statusCode) {
        throw error;
      }
      
      throw createError.internal('認証処理中にエラーが発生しました', { originalError: error.message });
    }
  }
  
  public async verifyToken(token: string): Promise<{ valid: boolean; user?: User; payload?: JWTPayload }> {
    const opLogger = createOperationLogger('認証サービス:トークン検証');
    
    try {
      opLogger.milestone('JWT検証開始');
      
      const payload = verifyJWT(token);
      
      opLogger.milestone('JWT検証成功', {
        userId: payload.id,
        trial: payload.trial,
        exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'unknown'
      });
      
      const userIdString = payload.id.toString();
      const user = await authRepository.findById(userIdString);
      
      if (!user) {
        opLogger.milestone('ユーザー未発見');
        return { valid: false };
      }
      
      opLogger.milestone('ユーザー検証完了', {
        userId: user.id,
        isTrialUser: user.isTrialUser
      });
      
      if (user.isTrialUser) {
        const isExpired = await authRepository.isTrialExpired(user.id);
        
        if (isExpired) {
          opLogger.milestone('トライアル期限切れ検出');
          throw createError.unauthorized('トライアル期間が終了しています', {
            userId: user.id,
            expiredAt: user.trialExpires
          });
        }
        
        opLogger.milestone('トライアル期限確認完了');
      }
      
      opLogger.complete({
        valid: true,
        userId: user.id,
        trial: user.isTrialUser
      });
      
      return { valid: true, user, payload };
    } catch (error: any) {
      opLogger.error(error, { hasToken: !!token });
      
      if (error.name === 'TokenExpiredError') {
        return { 
          valid: false,
          payload: { 
            ...error,
            errorType: 'TOKEN_EXPIRED'
          } as any
        };
      }
      
      if (error.name === 'JsonWebTokenError') {
        return { 
          valid: false,
          payload: { 
            ...error,
            errorType: 'INVALID_TOKEN'
          } as any
        };
      }
      
      if (error.statusCode) {
        throw error;
      }
      
      return { valid: false };
    }
  }
  
  public async logout(userId: string): Promise<{ success: boolean }> {
    const opLogger = createOperationLogger('認証サービス:ログアウト');
    
    try {
      opLogger.milestone('ログアウト処理開始', { userId });
      
      const user = await authRepository.findById(userId);
      
      if (!user) {
        opLogger.milestone('ユーザー未発見');
        throw createError.notFound('ユーザーが見つかりません', { userId });
      }
      
      opLogger.milestone('ユーザー確認完了');
      
      logger.info('[AUTH_SERVICE] ✅ ログアウト処理完了', {
        userId,
        timestamp: new Date().toISOString()
      });
      
      opLogger.complete({ success: true });
      
      return { success: true };
    } catch (error: any) {
      opLogger.error(error, { userId });
      
      if (error.statusCode) {
        throw error;
      }
      
      throw createError.internal('ログアウト処理中にエラーが発生しました', { userId, originalError: error.message });
    }
  }
  
  public async getUserProfile(userId: string): Promise<User> {
    const opLogger = createOperationLogger('認証サービス:プロフィール取得');
    
    try {
      opLogger.milestone('プロフィール取得開始', { userId });
      
      const user = await authRepository.findById(userId);
      
      if (!user) {
        opLogger.milestone('ユーザー未発見');
        throw createError.notFound('ユーザーが見つかりません', { userId });
      }
      
      opLogger.milestone('プロフィール取得完了', {
        userId: user.id,
        isTrialUser: user.isTrialUser,
        hasSettings: !!user.settings
      });
      
      opLogger.complete({ userId: user.id });
      
      return user;
    } catch (error: any) {
      opLogger.error(error, { userId });
      
      if (error.statusCode) {
        throw error;
      }
      
      throw createError.internal('プロフィール取得中にエラーが発生しました', { userId, originalError: error.message });
    }
  }
}

export const authService = AuthService.getInstance();