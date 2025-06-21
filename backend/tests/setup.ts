import { database } from '../src/config/database.config';
import { logger } from '../src/common/utils/logger.util';

// テスト環境でのログレベル調整
if (process.env.NODE_ENV === 'test') {
  logger.level = 'error'; // テスト時は重要なエラーのみログ出力
}

// テスト全体の前処理
beforeAll(async () => {
  try {
    // データベース接続の確立
    await database.connect();
    logger.info('[TEST_SETUP] データベース接続完了');
  } catch (error) {
    logger.error('[TEST_SETUP] データベース接続失敗:', error);
    throw error;
  }
}, 30000); // 30秒のタイムアウト

// テスト全体の後処理
afterAll(async () => {
  try {
    // データベース接続の切断
    await database.disconnect();
    logger.info('[TEST_SETUP] データベース接続切断完了');
  } catch (error) {
    logger.error('[TEST_SETUP] データベース接続切断失敗:', error);
  }
}, 10000); // 10秒のタイムアウト

// 各テストファイルの前処理
beforeEach(() => {
  // テスト開始ログ
  logger.debug('[TEST] テスト開始');
});

// 各テストファイルの後処理
afterEach(() => {
  // テスト終了ログ
  logger.debug('[TEST] テスト終了');
});