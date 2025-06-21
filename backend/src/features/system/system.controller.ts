import { Request, Response, NextFunction } from 'express';
import { database } from '@/config/database.config';
import { asyncHandler } from '@/common/middlewares/error.middleware';
import { logger, createOperationLogger } from '@/common/utils/logger.util';
import { ApiResponse } from '@/types';
import { appConfig } from '@/config/env.config';

interface HealthCheckData {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'error';
      connection_state: string;
    };
    memory: {
      used: string;
      free: string;
      total: string;
      usage_percent: number;
    };
    process: {
      pid: number;
      node_version: string;
      platform: string;
      arch: string;
    };
  };
}

interface SystemStatusData extends HealthCheckData {
  detailed_metrics: {
    response_time_ms: number;
    cpu_usage: NodeJS.CpuUsage;
    event_loop_delay: number;
  };
}

export class SystemController {
  public static async healthCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    const opLogger = createOperationLogger('システム:ヘルスチェック');
    const startTime = Date.now();
    
    try {
      opLogger.milestone('ヘルスチェック開始');
      
      // データベース状態確認
      const dbStatus = database.isConnected() ? 'connected' : 'disconnected';
      const dbConnectionState = database.getConnectionState();
      
      opLogger.milestone('データベース状態確認完了', {
        status: dbStatus,
        state: dbConnectionState
      });
      
      // メモリ使用量確認
      const memoryUsage = process.memoryUsage();
      const memoryData = {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        free: `${Math.round((memoryUsage.heapTotal - memoryUsage.heapUsed) / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        usage_percent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      };
      
      opLogger.milestone('メモリ使用量確認完了', memoryData);
      
      // プロセス情報確認
      const processData = {
        pid: process.pid,
        node_version: process.version,
        platform: process.platform,
        arch: process.arch
      };
      
      opLogger.milestone('プロセス情報確認完了', processData);
      
      // 全体ステータス判定
      const overallStatus = dbStatus === 'connected' ? 'healthy' : 'unhealthy';
      
      const healthData: HealthCheckData = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        version: appConfig.APP_VERSION,
        environment: appConfig.NODE_ENV,
        services: {
          database: {
            status: dbStatus,
            connection_state: dbConnectionState
          },
          memory: memoryData,
          process: processData
        }
      };
      
      const responseTime = Date.now() - startTime;
      
      const response: ApiResponse<HealthCheckData> = {
        success: overallStatus === 'healthy',
        data: healthData,
        message: overallStatus === 'healthy' ? 'システムは正常に動作しています' : 'システムに問題があります',
        meta: {
          response_time_ms: responseTime
        }
      };
      
      const statusCode = overallStatus === 'healthy' ? 200 : 503;
      
      logger.info('[SYSTEM] ヘルスチェック完了', {
        status: overallStatus,
        responseTime,
        dbStatus,
        memoryUsage: memoryData.usage_percent
      });
      
      opLogger.complete({
        status: overallStatus,
        responseTime,
        services: Object.keys(healthData.services).length
      });
      
      res.status(statusCode).json(response);
    } catch (error) {
      opLogger.error(error as Error);
      
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: 'ヘルスチェック実行中にエラーが発生しました',
        meta: {
          response_time_ms: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      };
      
      res.status(503).json(errorResponse);
    }
  }
  
  public static async systemStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    const opLogger = createOperationLogger('システム:詳細ステータス');
    const startTime = Date.now();
    
    try {
      opLogger.milestone('詳細ステータス確認開始');
      
      // 基本ヘルスチェックデータ取得
      const dbStatus = database.isConnected() ? 'connected' : 'disconnected';
      const dbConnectionState = database.getConnectionState();
      
      const memoryUsage = process.memoryUsage();
      const memoryData = {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        free: `${Math.round((memoryUsage.heapTotal - memoryUsage.heapUsed) / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        usage_percent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      };
      
      const processData = {
        pid: process.pid,
        node_version: process.version,
        platform: process.platform,
        arch: process.arch
      };
      
      opLogger.milestone('基本データ取得完了');
      
      // 詳細メトリクス取得
      const cpuUsage = process.cpuUsage();
      const responseTime = Date.now() - startTime;
      
      // イベントループ遅延の簡易測定
      const eventLoopStart = Date.now();
      await new Promise(resolve => setImmediate(resolve));
      const eventLoopDelay = Date.now() - eventLoopStart;
      
      opLogger.milestone('詳細メトリクス取得完了', {
        responseTime,
        eventLoopDelay,
        cpuUser: cpuUsage.user,
        cpuSystem: cpuUsage.system
      });
      
      const overallStatus = dbStatus === 'connected' ? 'healthy' : 'unhealthy';
      
      const statusData: SystemStatusData = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        version: appConfig.APP_VERSION,
        environment: appConfig.NODE_ENV,
        services: {
          database: {
            status: dbStatus,
            connection_state: dbConnectionState
          },
          memory: memoryData,
          process: processData
        },
        detailed_metrics: {
          response_time_ms: responseTime,
          cpu_usage: cpuUsage,
          event_loop_delay: eventLoopDelay
        }
      };
      
      const response: ApiResponse<SystemStatusData> = {
        success: overallStatus === 'healthy',
        data: statusData,
        message: overallStatus === 'healthy' ? 'システム詳細ステータス取得完了' : 'システムに問題があります（詳細）'
      };
      
      const statusCode = overallStatus === 'healthy' ? 200 : 503;
      
      logger.info('[SYSTEM] 詳細ステータス確認完了', {
        status: overallStatus,
        responseTime,
        eventLoopDelay,
        memoryUsage: memoryData.usage_percent
      });
      
      opLogger.complete({
        status: overallStatus,
        responseTime,
        eventLoopDelay
      });
      
      res.status(statusCode).json(response);
    } catch (error) {
      opLogger.error(error as Error);
      next(error);
    }
  }
}

export const {
  healthCheck,
  systemStatus
} = SystemController;