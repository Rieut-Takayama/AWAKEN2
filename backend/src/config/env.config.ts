import dotenv from 'dotenv';

dotenv.config();

interface AppConfig {
  NODE_ENV: string;
  PORT: number;
  APP_NAME: string;
  APP_VERSION: string;
  TRIAL_KEYS: string[];
}

interface DatabaseConfig {
  DATABASE_URL: string;
  DB_NAME: string;
}

interface JWTConfig {
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
}

interface MEXCConfig {
  MEXC_API_KEY: string;
  MEXC_API_SECRET: string;
  MEXC_BASE_URL: string;
}

interface TelegramConfig {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

interface RedisConfig {
  REDIS_URL: string;
  REDIS_PORT: number;
}

interface SecurityConfig {
  CORS_ORIGIN: string;
  BCRYPT_SALT_ROUNDS: number;
}

interface LogConfig {
  LOG_LEVEL: string;
  LOG_FILE: string;
}

interface AnalysisConfig {
  UPDATE_INTERVAL: number;
  SCORE_THRESHOLD_DEFAULT: number;
  NOTIFICATION_INTERVAL_DEFAULT: number;
}

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'MEXC_API_KEY',
  'MEXC_API_SECRET',
  'TELEGRAM_BOT_TOKEN',
  'REDIS_URL',
  'ANTHROPIC_API_KEY'
];

function validateEnvironment(): void {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

validateEnvironment();

export const appConfig: AppConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '8080', 10),
  APP_NAME: process.env.APP_NAME || 'AWAKEN2',
  APP_VERSION: process.env.APP_VERSION || '1.0.0',
  TRIAL_KEYS: process.env.TRIAL_KEYS?.split('_') || ['TRIAL2025', 'AWAKEN2']
};

export const databaseConfig: DatabaseConfig = {
  DATABASE_URL: process.env.DATABASE_URL!,
  DB_NAME: process.env.DB_NAME || 'awaken2_db'
};

export const jwtConfig: JWTConfig = {
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h'
};

export const mexcConfig: MEXCConfig = {
  MEXC_API_KEY: process.env.MEXC_API_KEY!,
  MEXC_API_SECRET: process.env.MEXC_API_SECRET!,
  MEXC_BASE_URL: process.env.MEXC_BASE_URL || 'https://api.mexc.com'
};

export const telegramConfig: TelegramConfig = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN!,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || ''
};

export const redisConfig: RedisConfig = {
  REDIS_URL: process.env.REDIS_URL!,
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10)
};

export const securityConfig: SecurityConfig = {
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10)
};

export const logConfig: LogConfig = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'logs/app.log'
};

export const analysisConfig: AnalysisConfig = {
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