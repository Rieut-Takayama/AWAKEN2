import dotenv from 'dotenv';

dotenv.config();

interface AppConfig {
  NODE_ENV: string;
  PORT: number;
  APP_NAME: string;
  APP_VERSION: string;
  TRIAL_KEYS: string[];
}

// Cloud Run用の最小限の設定
export const appConfig: AppConfig = {
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: parseInt(process.env.PORT || '8080', 10),
  APP_NAME: process.env.APP_NAME || 'AWAKEN2',
  APP_VERSION: process.env.APP_VERSION || '1.0.0',
  TRIAL_KEYS: ['TRIAL2025', 'AWAKEN2']
};

// その他の設定はデフォルト値を使用
export const databaseConfig = {
  DATABASE_URL: process.env.DATABASE_URL || '',
  DB_NAME: process.env.DB_NAME || 'awaken2_db'
};

export const jwtConfig = {
  JWT_SECRET: process.env.JWT_SECRET || 'temporary-secret-for-deployment',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h'
};

export const mexcConfig = {
  MEXC_API_KEY: process.env.MEXC_API_KEY || '',
  MEXC_API_SECRET: process.env.MEXC_API_SECRET || '',
  MEXC_BASE_URL: process.env.MEXC_BASE_URL || 'https://api.mexc.com'
};

export const telegramConfig = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || ''
};

export const redisConfig = {
  REDIS_URL: process.env.REDIS_URL || '',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10)
};

export const securityConfig = {
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10)
};

export const logConfig = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'logs/app.log'
};

export const analysisConfig = {
  UPDATE_INTERVAL: parseInt(process.env.UPDATE_INTERVAL || '5000', 10),
  SCORE_THRESHOLD_DEFAULT: parseInt(process.env.SCORE_THRESHOLD_DEFAULT || '75', 10),
  NOTIFICATION_INTERVAL_DEFAULT: parseInt(process.env.NOTIFICATION_INTERVAL_DEFAULT || '60', 10)
};

export const config = {
  app: appConfig,
  database: databaseConfig,
  jwt: jwtConfig,
  mexc: mexcConfig,
  telegram: telegramConfig,
  redis: redisConfig,
  security: securityConfig,
  log: logConfig,
  analysis: analysisConfig
};

export default config;