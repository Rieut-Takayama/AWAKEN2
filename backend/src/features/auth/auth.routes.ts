import { Router } from 'express';
import { trialAuth, verifyToken, logout, getProfile } from './auth.controller';
import { requireAuth } from '@/common/middlewares/auth.middleware';
import { asyncHandler } from '@/common/middlewares/error.middleware';
import { API_PATHS } from '@/types';

const router = Router();

/**
 * @route POST /api/auth/trial
 * @desc トライアルキーによる認証
 * @access Public
 * @body { passkey: string }
 * @response { success: boolean, data: TrialAuthResponse, message: string }
 */
router.post(
  API_PATHS.AUTH.TRIAL_LOGIN.replace('/api/auth', ''),
  asyncHandler(trialAuth)
);

/**
 * @route GET /api/auth/verify
 * @desc JWTトークンの検証とユーザー情報取得
 * @access Private (要認証)
 * @headers Authorization: Bearer <token>
 * @response { success: boolean, data: { valid: boolean, user: User }, message: string }
 */
router.get(
  API_PATHS.AUTH.VERIFY.replace('/api/auth', ''),
  requireAuth,
  asyncHandler(verifyToken)
);

/**
 * @route POST /api/auth/logout
 * @desc ログアウト処理
 * @access Private (要認証)
 * @headers Authorization: Bearer <token>
 * @response { success: boolean, data: { success: boolean }, message: string }
 */
router.post(
  API_PATHS.AUTH.LOGOUT.replace('/api/auth', ''),
  requireAuth,
  asyncHandler(logout)
);

/**
 * @route GET /api/users/profile
 * @desc ユーザープロフィール取得
 * @access Private (要認証)
 * @headers Authorization: Bearer <token>
 * @response { success: boolean, data: User, message: string }
 */
router.get(
  API_PATHS.USERS.PROFILE.replace('/api/auth', '').replace('/api/users', ''),
  requireAuth,
  asyncHandler(getProfile)
);

export { router as authRoutes };