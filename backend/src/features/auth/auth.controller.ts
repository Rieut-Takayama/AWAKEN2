import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { validateTrialAuth } from './auth.validator';
import { createError, asyncHandler } from '@/common/middlewares/error.middleware';
import { AuthenticatedRequest } from '@/common/middlewares/auth.middleware';
import { logger, createOperationLogger } from '@/common/utils/logger.util';
import { ApiResponse, TrialAuthResponse, User } from '@/types';

export class AuthController {
  public static async trialAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    const opLogger = createOperationLogger('認証コントローラ:トライアル認証');
    
    try {
      opLogger.milestone('リクエストデータ検証開始', {
        hasBody: !!req.body,
        method: req.method,
        ip: req.ip
      });
      
      const { value: validatedData, error } = validateTrialAuth(req.body);
      
      if (error) {
        opLogger.milestone('バリデーションエラー検出', {
          errors: error.details.map(detail => detail.message)
        });
        throw createError.validationError('入力データが無効です', {
          validationErrors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }
      
      opLogger.milestone('バリデーション成功', { passkey: validatedData.passkey });
      
      const authResult = await authService.authenticateTrialUser(validatedData);
      
      opLogger.milestone('認証処理完了', {
        success: authResult.success,
        userId: authResult.user.id
      });
      
      const response: ApiResponse<TrialAuthResponse> = {
        success: true,
        data: authResult,
        message: 'トライアル認証が成功しました'
      };
      
      logger.info('[AUTH_CONTROLLER] ✅ トライアル認証成功', {
        userId: authResult.user.id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      opLogger.complete({ userId: authResult.user.id });
      
      res.status(200).json(response);
    } catch (error) {
      opLogger.error(error as Error, { body: req.body });
      next(error);
    }
  }
  
  public static async verifyToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const opLogger = createOperationLogger('認証コントローラ:トークン検証');
    
    try {
      opLogger.milestone('認証ユーザー確認', {
        hasUser: !!req.user,
        userId: req.user?.id
      });
      
      if (!req.user) {
        opLogger.milestone('認証情報なし');
        throw createError.unauthorized('認証が必要です');
      }
      
      const userProfile = await authService.getUserProfile(req.user.id.toString());
      
      opLogger.milestone('プロフィール取得完了', {
        userId: userProfile.id,
        isTrialUser: userProfile.isTrialUser
      });
      
      const response: ApiResponse<{ valid: boolean; user: User }> = {
        success: true,
        data: {
          valid: true,
          user: userProfile
        },
        message: 'トークンは有効です'
      };
      
      opLogger.complete({ valid: true, userId: userProfile.id });
      
      res.status(200).json(response);
    } catch (error) {
      opLogger.error(error as Error, { userId: req.user?.id });
      next(error);
    }
  }
  
  public static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const opLogger = createOperationLogger('認証コントローラ:ログアウト');
    
    try {
      opLogger.milestone('ログアウト開始', {
        hasUser: !!req.user,
        userId: req.user?.id
      });
      
      if (!req.user) {
        opLogger.milestone('認証情報なし');
        throw createError.unauthorized('認証が必要です');
      }
      
      const result = await authService.logout(req.user.id.toString());
      
      opLogger.milestone('ログアウト処理完了', result);
      
      const response: ApiResponse<{ success: boolean }> = {
        success: true,
        data: result,
        message: 'ログアウトしました'
      };
      
      logger.info('[AUTH_CONTROLLER] ✅ ログアウト完了', {
        userId: req.user.id,
        ip: req.ip
      });
      
      opLogger.complete({ userId: req.user.id });
      
      res.status(200).json(response);
    } catch (error) {
      opLogger.error(error as Error, { userId: req.user?.id });
      next(error);
    }
  }
  
  public static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const opLogger = createOperationLogger('認証コントローラ:プロフィール取得');
    
    try {
      opLogger.milestone('プロフィール取得開始', {
        hasUser: !!req.user,
        userId: req.user?.id
      });
      
      if (!req.user) {
        opLogger.milestone('認証情報なし');
        throw createError.unauthorized('認証が必要です');
      }
      
      const userProfile = await authService.getUserProfile(req.user.id.toString());
      
      opLogger.milestone('プロフィール取得完了', {
        userId: userProfile.id,
        hasSettings: !!userProfile.settings
      });
      
      const response: ApiResponse<User> = {
        success: true,
        data: userProfile,
        message: 'プロフィールを取得しました'
      };
      
      opLogger.complete({ userId: userProfile.id });
      
      res.status(200).json(response);
    } catch (error) {
      opLogger.error(error as Error, { userId: req.user?.id });
      next(error);
    }
  }
}

export const {
  trialAuth,
  verifyToken,
  logout,
  getProfile
} = AuthController;