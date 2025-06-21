import mongoose from 'mongoose';
import { databaseConfig, logConfig } from './env.config';
import { logger } from '@/common/utils/logger.util';

const connectionOptions: mongoose.ConnectOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
};

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connectionPromise: Promise<typeof mongoose> | null = null;
  
  private constructor() {}
  
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }
  
  public async connect(): Promise<typeof mongoose> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    
    this.connectionPromise = this.establishConnection();
    return this.connectionPromise;
  }
  
  private async establishConnection(): Promise<typeof mongoose> {
    const startTime = Date.now();
    logger.info(`[DB] データベース接続開始: ${databaseConfig.DB_NAME}`);
    
    try {
      mongoose.set('strictQuery', false);
      
      const connection = await mongoose.connect(databaseConfig.DATABASE_URL, connectionOptions);
      
      const connectionTime = Date.now() - startTime;
      logger.info(`[DB] ✅ データベース接続成功 (${connectionTime}ms)`);
      logger.info(`[DB] 接続先: ${connection.connection.host}:${connection.connection.port}`);
      logger.info(`[DB] データベース: ${connection.connection.name}`);
      
      this.setupEventHandlers(connection);
      
      return connection;
    } catch (error) {
      const connectionTime = Date.now() - startTime;
      logger.error(`[DB] ❌ データベース接続失敗 (${connectionTime}ms):`, error);
      this.connectionPromise = null;
      throw error;
    }
  }
  
  private setupEventHandlers(connection: typeof mongoose): void {
    connection.connection.on('connected', () => {
      logger.info('[DB] Mongoose接続確立');
    });
    
    connection.connection.on('error', (error) => {
      logger.error('[DB] Mongooseエラー:', error);
    });
    
    connection.connection.on('disconnected', () => {
      logger.warn('[DB] Mongoose接続切断');
    });
    
    connection.connection.on('reconnected', () => {
      logger.info('[DB] Mongoose再接続成功');
    });
    
    connection.connection.on('close', () => {
      logger.info('[DB] Mongoose接続クローズ');
    });
    
    process.on('SIGINT', async () => {
      await this.gracefulShutdown('SIGINT');
    });
    
    process.on('SIGTERM', async () => {
      await this.gracefulShutdown('SIGTERM');
    });
  }
  
  private async gracefulShutdown(signal: string): Promise<void> {
    logger.info(`[DB] ${signal}受信 - データベース接続の正常終了を開始`);
    
    try {
      await mongoose.connection.close();
      logger.info('[DB] ✅ データベース接続正常終了');
      process.exit(0);
    } catch (error) {
      logger.error('[DB] ❌ データベース接続終了エラー:', error);
      process.exit(1);
    }
  }
  
  public async disconnect(): Promise<void> {
    if (this.connectionPromise) {
      const connection = await this.connectionPromise;
      await connection.connection.close();
      this.connectionPromise = null;
      logger.info('[DB] データベース接続終了');
    }
  }
  
  public isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }
  
  public getConnectionState(): string {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    return states[mongoose.connection.readyState] || 'unknown';
  }
}

export const database = DatabaseConnection.getInstance();