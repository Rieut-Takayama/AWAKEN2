import { Router } from 'express';
import { healthCheck, systemStatus } from './system.controller';
import { asyncHandler } from '@/common/middlewares/error.middleware';
import { API_PATHS } from '@/types';

const router = Router();

/**
 * @route GET /api/system/health
 * @desc システムヘルスチェック（基本的な生存確認）
 * @access Public
 * @response { success: boolean, data: HealthCheckData, message: string }
 */
router.get(
  API_PATHS.SYSTEM.HEALTH.replace('/api/system', ''),
  asyncHandler(healthCheck)
);

/**
 * @route GET /api/system/status
 * @desc システム詳細ステータス（詳細なメトリクス含む）
 * @access Public
 * @response { success: boolean, data: SystemStatusData, message: string }
 */
router.get(
  API_PATHS.SYSTEM.STATUS.replace('/api/system', ''),
  asyncHandler(systemStatus)
);

export { router as systemRoutes };