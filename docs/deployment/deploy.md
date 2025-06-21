# AWAKEN2 デプロイ情報

## 概要
このドキュメントは、AWAKEN2プロジェクトのデプロイ設定と手順を記録したものです。

**作成日時**: 2025年6月20日
**デプロイ実施者**: rieu.t.akayama@gmail.com

## デプロイ環境

### フロントエンド
- **サービス**: Google Cloud Storage（静的ウェブサイトホスティング）
- **バケット名**: awaken2-frontend
- **URL**: https://storage.googleapis.com/awaken2-frontend/index.html
- **リージョン**: asia-northeast1

### バックエンド
- **サービス**: Google Cloud Run
- **サービス名**: awaken2-backend
- **URL**: https://awaken2-backend-212213816719.asia-northeast1.run.app
- **リージョン**: asia-northeast1
- **メモリ**: 1Gi
- **タイムアウト**: 300秒

### データベース
- **MongoDB Atlas**: 既存のクラウドデータベースを使用
- **Redis Cloud**: キャッシュサーバーとして使用

## 環境変数設定

### バックエンド環境変数（Cloud Run）
```yaml
NODE_ENV: production
APP_NAME: AWAKEN2
APP_VERSION: "1.0.0"
TRIAL_KEYS: "TRIAL2025,AWAKEN2"
JWT_SECRET: "23c2e2370092dcd132c518487a99e7b4c1e3dca6a273c2510ea548bd166a9a67b260de7190a066635eae5cb26441eadbb52f83c47d717a9a7ad554208ec02f15"
JWT_EXPIRES_IN: "24h"
DATABASE_URL: "your-mongodb-connection-string"
DB_NAME: "awaken2_db"
MEXC_API_KEY: "your-mexc-api-key"
MEXC_API_SECRET: "your-mexc-api-secret"
MEXC_BASE_URL: "https://api.mexc.com"
TELEGRAM_BOT_TOKEN: "your-telegram-bot-token"
TELEGRAM_CHAT_ID: "your-telegram-chat-id"
ANTHROPIC_API_KEY: "your-anthropic-api-key"
REDIS_URL: "your-redis-connection-string"
REDIS_PORT: "6379"
CORS_ORIGIN: "https://awaken2-frontend.web.app"
BCRYPT_SALT_ROUNDS: "12"
UPDATE_INTERVAL: "5000"
SCORE_THRESHOLD_DEFAULT: "75"
NOTIFICATION_INTERVAL_DEFAULT: "60"
```

### フロントエンド環境変数（.env.production）
```
NODE_ENV=production
PORT=5173

# App設定
VITE_APP_NAME=AWAKEN2
VITE_APP_VERSION=1.0.0

# API設定
VITE_API_BASE_URL=https://awaken2-backend-212213816719.asia-northeast1.run.app
VITE_BACKEND_PORT=443

# その他の設定は.env.productionファイルを参照
```

## デプロイコマンド

### バックエンドのデプロイ
```bash
cd backend
gcloud run deploy awaken2-backend --source . --allow-unauthenticated --region asia-northeast1
```

### 環境変数の更新
```bash
gcloud run services update awaken2-backend --region asia-northeast1 --env-vars-file env-vars.yaml
```

### フロントエンドのビルドとデプロイ
```bash
cd frontend
npm run build
gcloud storage cp -r dist/* gs://awaken2-frontend/
```

## 重要な注意事項

### バックエンドの現状
- 現在は最小限のコード（app.cloud.js）で動作中
- 完全な機能を有効にするには、TypeScriptのパスエイリアス問題を解決する必要がある
- 環境変数は正しく設定されているが、アプリケーションコードの更新が必要

### セキュリティ
- このドキュメントには実際のAPIキーとシークレットが含まれている
- 絶対に公開リポジトリにコミットしないこと
- deployment/フォルダは.gitignoreに追加済み

### 今後の作業
1. バックエンドの完全な機能実装
2. CI/CDパイプラインの構築（GitHub Actions）
3. カスタムドメインの設定
4. HTTPS証明書の設定（Cloud Load Balancer経由）
5. モニタリングとアラートの設定

## トラブルシューティング

### ポート8080エラー
Cloud Runはデフォルトでポート8080を期待します。アプリケーションは必ずPORT環境変数を読み取って起動する必要があります。

### CORS エラー
バックエンドのCORS_ORIGIN環境変数が正しいフロントエンドURLを指していることを確認してください。

### 環境変数の読み込みエラー
環境変数名にPORTを含めないでください（Cloud Runの予約語）。

## 連絡先
問題が発生した場合は、以下に連絡してください：
- プロジェクトオーナー: rieu.t.akayama@gmail.com
- Google Cloud プロジェクトID: awaken2-project (212213816719)