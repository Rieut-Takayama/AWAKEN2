import winston from 'winston';
import { logConfig } from '@/config/env.config';
import path from 'path';
import fs from 'fs';

const logDirectory = path.dirname(logConfig.LOG_FILE);
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    const stackString = stack ? `\n${stack}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}${stackString}`;
  })
);

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss.SSS'
  }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta, null, 2)}` : '';
    const stackString = stack ? `\n${stack}` : '';
    return `[${timestamp}] ${level}: ${message}${metaString}${stackString}`;
  })
);

const transports: winston.transport[] = [
  new winston.transports.File({
    filename: logConfig.LOG_FILE,
    level: logConfig.LOG_LEVEL,
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true
  }),
  new winston.transports.File({
    filename: path.join(logDirectory, 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 5242880,
    maxFiles: 5,
    tailable: true
  })
];

if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: devFormat
    })
  );
}

export const logger = winston.createLogger({
  level: logConfig.LOG_LEVEL,
  format: logFormat,
  transports,
  exitOnError: false
});

export class OperationLogger {
  private operation: string;
  private startTime: number;
  private milestones: Record<string, number> = {};
  
  constructor(operation: string) {
    this.operation = operation;
    this.startTime = Date.now();
    logger.info(`[${this.operation}] ▶️ 開始`);
  }
  
  public milestone(name: string, details?: any): void {
    this.milestones[name] = Date.now();
    const elapsed = this.getElapsed();
    
    if (details) {
      logger.info(`[${this.operation}] 🏁 ${name} (${elapsed}):`, details);
    } else {
      logger.info(`[${this.operation}] 🏁 ${name} (${elapsed})`);
    }
  }
  
  public error(error: Error, context?: any): void {
    const elapsed = this.getElapsed();
    logger.error(`[${this.operation}] ❌ エラー発生 (${elapsed}):`, { error: error.message, stack: error.stack, context });
  }
  
  public complete(result?: any): void {
    const elapsed = this.getElapsed();
    
    if (result) {
      logger.info(`[${this.operation}] ✅ 完了 (${elapsed}):`, result);
    } else {
      logger.info(`[${this.operation}] ✅ 完了 (${elapsed})`);
    }
    
    this.logTimingBreakdown();
  }
  
  private getElapsed(): string {
    return `${(Date.now() - this.startTime)}ms`;
  }
  
  private logTimingBreakdown(): void {
    if (Object.keys(this.milestones).length === 0) return;
    
    logger.debug(`[${this.operation}] 📊 処理時間詳細:`);
    const entries = Object.entries(this.milestones).sort((a, b) => a[1] - b[1]);
    
    for (let i = 0; i < entries.length; i++) {
      const [name, timestamp] = entries[i];
      const prevTimestamp = i === 0 ? this.startTime : entries[i - 1][1];
      const duration = timestamp - prevTimestamp;
      
      logger.debug(`  ${name}: ${duration}ms`);
    }
    
    const totalTime = Date.now() - this.startTime;
    logger.debug(`  総実行時間: ${totalTime}ms`);
  }
}

export const createOperationLogger = (operation: string): OperationLogger => {
  return new OperationLogger(operation);
};