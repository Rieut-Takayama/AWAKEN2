import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '@/config/env.config';
import { createError } from './error.middleware';
import { logger } from '@/common/utils/logger.util';
import { TrialAuthResponse } from '@/types';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    trial: boolean;
    iat?: number;
    exp?: number;
  };
}

export interface JWTPayload {
  id: number;
  trial: boolean;
  iat?: number;
  exp?: number;
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.debug('[AUTH] 認証ヘッダーが見つかりません', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      throw createError.unauthorized('認証トークンが必要です');
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      logger.debug('[AUTH] 無効な認証ヘッダー形式', {
        authHeader: authHeader.substring(0, 20) + '...',
        path: req.path
      });
      throw createError.unauthorized('無効な認証ヘッダー形式です');
    }
    
    const token = authHeader.substring(7); // "Bearer " を除去
    
    if (!token) {
      logger.debug('[AUTH] 空のトークン', { path: req.path });
      throw createError.unauthorized('認証トークンが空です');
    }
    
    try {
      const payload = jwt.verify(token, jwtConfig.JWT_SECRET) as JWTPayload;
      
      if (!payload.id || typeof payload.trial !== 'boolean') {
        logger.warn('[AUTH] 無効なトークンペイロード', {
          payload: { id: payload.id, trial: payload.trial },
          path: req.path
        });
        throw createError.unauthorized('無効なトークンです');
      }
      
      req.user = payload;
      
      logger.debug('[AUTH] ✅ 認証成功', {
        userId: payload.id,
        trial: payload.trial,
        path: req.path,
        method: req.method,
        exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'unknown'
      });
      
      next();
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        logger.info('[AUTH] トークン期限切れ', {
          expiredAt: jwtError.expiredAt,
          path: req.path
        });
        throw createError.unauthorized('認証トークンの有効期限が切れています', {
          errorType: 'TOKEN_EXPIRED',
          expiredAt: jwtError.expiredAt
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        logger.warn('[AUTH] 無効なJWTトークン', {
          message: jwtError.message,
          path: req.path
        });
        throw createError.unauthorized('無効な認証トークンです', {
          errorType: 'INVALID_TOKEN'
        });
      }
      
      logger.error('[AUTH] JWT検証エラー', {
        error: jwtError.message,
        name: jwtError.name,
        path: req.path
      });
      throw createError.unauthorized('認証トークンの検証に失敗しました');
    }
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }
    
    try {
      const payload = jwt.verify(token, jwtConfig.JWT_SECRET) as JWTPayload;
      req.user = payload;
      
      logger.debug('[AUTH] オプション認証成功', {
        userId: payload.id,
        trial: payload.trial,
        path: req.path
      });
    } catch (jwtError) {
      logger.debug('[AUTH] オプション認証失敗（無視）', {
        error: jwtError,
        path: req.path
      });
    }
    
    next();
  } catch (error) {
    next();
  }
};

export const createJWT = (payload: { id: number; trial: boolean }): string => {
  return jwt.sign(payload, jwtConfig.JWT_SECRET as string, {
    expiresIn: jwtConfig.JWT_EXPIRES_IN,
    issuer: 'AWAKEN2',
    audience: 'AWAKEN2-CLIENT'
  } as jwt.SignOptions);
};

export const verifyJWT = (token: string): JWTPayload => {
  return jwt.verify(token, jwtConfig.JWT_SECRET) as JWTPayload;
};