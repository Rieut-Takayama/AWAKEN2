import { Request, Response, NextFunction } from 'express';
import { logger } from '@/common/utils/logger.util';
import { ApiResponse } from '@/types';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  errorCode?: string;
  details?: any;
}

export class APIError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;
  public errorCode: string;
  public details?: any;
  
  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR',
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = {
  badRequest: (message: string, details?: any) => 
    new APIError(message, 400, 'BAD_REQUEST', details),
  
  unauthorized: (message: string = '認証が必要です', details?: any) => 
    new APIError(message, 401, 'UNAUTHORIZED', details),
  
  forbidden: (message: string = 'アクセス権限がありません', details?: any) => 
    new APIError(message, 403, 'FORBIDDEN', details),
  
  notFound: (message: string = 'リソースが見つかりません', details?: any) => 
    new APIError(message, 404, 'NOT_FOUND', details),
  
  conflict: (message: string, details?: any) => 
    new APIError(message, 409, 'CONFLICT', details),
  
  validationError: (message: string, details?: any) => 
    new APIError(message, 422, 'VALIDATION_ERROR', details),
  
  rateLimit: (message: string = 'リクエスト制限に達しました', details?: any) => 
    new APIError(message, 429, 'RATE_LIMIT', details),
  
  internal: (message: string = 'サーバー内部エラー', details?: any) => 
    new APIError(message, 500, 'INTERNAL_ERROR', details),
  
  serviceUnavailable: (message: string = 'サービス利用不可', details?: any) => 
    new APIError(message, 503, 'SERVICE_UNAVAILABLE', details)
};

function isAppError(error: any): error is AppError {
  return error instanceof Error && 'statusCode' in error;
}

function getErrorResponse(error: AppError, isDevelopment: boolean): ApiResponse<null> {
  const response: ApiResponse<null> = {
    success: false,
    error: error.message,
    meta: {
      errorCode: error.errorCode || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    }
  };
  
  if (isDevelopment && error.details) {
    response.meta!.details = error.details;
  }
  
  if (isDevelopment && error.stack) {
    response.meta!.stack = error.stack;
  }
  
  return response;
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  let appError: AppError;
  
  if (isAppError(error)) {
    appError = error;
  } else {
    appError = {
      ...error,
      statusCode: 500,
      errorCode: 'INTERNAL_ERROR',
      isOperational: false
    };
  }
  
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method !== 'GET' ? req.body : undefined
  };
  
  const statusCode = appError.statusCode || 500;
  
  if (statusCode >= 500) {
    logger.error('[ERROR] サーバーエラー:', {
      error: appError.message,
      stack: appError.stack,
      statusCode: appError.statusCode,
      errorCode: appError.errorCode,
      request: requestInfo,
      details: appError.details
    });
  } else {
    logger.warn('[ERROR] クライアントエラー:', {
      error: appError.message,
      statusCode: appError.statusCode,
      errorCode: appError.errorCode,
      request: requestInfo
    });
  }
  
  const response = getErrorResponse(appError, isDevelopment);
  
  res.status(appError.statusCode || 500).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('[ERROR] Unhandled Promise Rejection:', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise
  });
  
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('[ERROR] Uncaught Exception:', {
    error: error.message,
    stack: error.stack
  });
  
  process.exit(1);
});