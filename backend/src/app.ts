import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { corsMiddleware } from '@/common/middlewares/cors.middleware';
import { errorHandler } from '@/common/middlewares/error.middleware';
import { authRoutes } from '@/features/auth/auth.routes';
import { systemRoutes } from '@/features/system/system.routes';
import { settingsRoutes, telegramRouter } from '@/features/settings/settings.routes';
import { realtimeRoutes } from '@/features/realtime/realtime.routes';
import { database } from '@/config/database.config';
import { logger, createOperationLogger } from '@/common/utils/logger.util';
import { appConfig } from '@/config/env.config';
import { databaseService } from '@/services/database.service';
import { aiAnalysisService } from '@/services/ai-analysis.service';

class Application {
  public app: express.Application;
  private startupLogger = createOperationLogger('アプリケーション起動');
  
  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }
  
  private initializeMiddlewares(): void {
    this.startupLogger.milestone('ミドルウェア初期化開始');
    
    // セキュリティミドルウェア
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "https:"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false
    }));
    
    // CORSミドルウェア
    this.app.use(corsMiddleware);
    
    // ボディパーサー
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // ログミドルウェア
    if (appConfig.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => {
            logger.info(message.trim());
          }
        }
      }));
    }
    
    // リクエスト情報ログ
    this.app.use((req, res, next) => {
      logger.debug('[REQUEST]', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      next();
    });
    
    // 静的ファイル配信（フロントエンド）
    this.app.use(express.static(path.join(__dirname, '../public')));
    
    this.startupLogger.milestone('ミドルウェア初期化完了');
  }
  
  private initializeRoutes(): void {
    this.startupLogger.milestone('ルート設定開始');
    
    // ヘルスチェック（最も重要なルート）
    this.app.use('/api/system', systemRoutes);
    
    // 認証ルート
    this.app.use('/api/auth', authRoutes);
    
    // 設定ルート
    this.app.use('/api/settings', settingsRoutes);
    
    // Telegramルート
    this.app.use('/api/telegram', telegramRouter);
    
    // リアルタイムデータルート
    this.app.use('/api/realtime', realtimeRoutes);
    
    // ルートハンドラー
    this.app.get('/api', (req, res) => {
      res.json({
        message: 'AWAKEN2 Backend API',
        version: appConfig.APP_VERSION,
        environment: appConfig.NODE_ENV,
        timestamp: new Date().toISOString(),
        status: 'running'
      });
    });
    
    // 404ハンドラー
    this.app.all('*', (req, res) => {
      logger.warn('[404] ルートが見つかりません', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip
      });
      
      res.status(404).json({
        success: false,
        error: 'ルートが見つかりません',
        meta: {
          method: req.method,
          path: req.originalUrl,
          timestamp: new Date().toISOString()
        }
      });
    });
    
    this.startupLogger.milestone('ルート設定完了');
  }
  
  private initializeErrorHandling(): void {
    this.startupLogger.milestone('エラーハンドリング設定開始');
    
    // グローバルエラーハンドラー
    this.app.use(errorHandler);
    
    this.startupLogger.milestone('エラーハンドリング設定完了');
  }
  
  public async start(): Promise<void> {
    try {
      this.startupLogger.milestone('データベース接続開始');
      
      // データベース接続
      await database.connect();
      
      // サービス初期化
      await databaseService.initialize();
      
      this.startupLogger.milestone('データベース接続完了');
      
      // サーバー起動
      const server = this.app.listen(appConfig.PORT, () => {
        this.startupLogger.milestone('サーバー起動完了', {
          port: appConfig.PORT,
          environment: appConfig.NODE_ENV,
          processId: process.pid
        });
        
        logger.info(`
🚀 AWAKEN2 Backend Server Started Successfully!
📍 Environment: ${appConfig.NODE_ENV}
🌐 Port: ${appConfig.PORT}
📊 Process ID: ${process.pid}
🔗 Health Check: http://localhost:${appConfig.PORT}/api/system/health
📚 API Documentation: http://localhost:${appConfig.PORT}/
        `);
        
        this.startupLogger.complete({
          port: appConfig.PORT,
          environment: appConfig.NODE_ENV,
          version: appConfig.APP_VERSION
        });
      });
      
      // Graceful shutdown
      this.setupGracefulShutdown(server);
      
    } catch (error) {
      this.startupLogger.error(error as Error);
      logger.error('[STARTUP] アプリケーション起動失敗:', error);
      process.exit(1);
    }
  }
  
  private setupGracefulShutdown(server: any): void {
    const shutdown = async (signal: string) => {
      logger.info(`[SHUTDOWN] ${signal}受信 - Graceful shutdown開始`);
      
      server.close(async () => {
        logger.info('[SHUTDOWN] HTTPサーバー停止完了');
        
        try {
          await database.disconnect();
          logger.info('[SHUTDOWN] ✅ 正常終了完了');
          process.exit(0);
        } catch (error) {
          logger.error('[SHUTDOWN] ❌ 終了処理エラー:', error);
          process.exit(1);
        }
      });
      
      // タイムアウト後の強制終了
      setTimeout(() => {
        logger.error('[SHUTDOWN] ⚠️ Graceful shutdown timeout - 強制終了');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

// アプリケーション起動
if (require.main === module) {
  const app = new Application();
  app.start().catch(error => {
    logger.error('[STARTUP] 起動エラー:', error);
    process.exit(1);
  });
}

export default Application;