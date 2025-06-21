# AWAKEN2 デプロイ問題の解決方法

## 問題の診断結果

### 現在の状況
- **バックエンド**: ✅ Cloud Runで正常稼働中
  - URL: https://awaken2-backend-212213816719.asia-northeast1.run.app
- **フロントエンド**: ❌ 未デプロイ（これが原因）

### 根本原因
フロントエンドが一度もデプロイされていないため、アプリケーションにアクセスできない。

## 解決手順（推奨方法）

Cloud Runでフロントエンドとバックエンドを一緒にホストする：

```bash
# 1. フロントエンドをビルド
cd frontend
npm run build

# 2. ビルド成果物をバックエンドのpublicディレクトリにコピー
cd ..
cp -r frontend/dist/* backend/public/

# 3. バックエンドを再デプロイ
cd backend
./deploy.sh
```

## 実行コマンド（コピペ用）

```bash
# 一括実行版
cd /Users/rieut/Desktop/AWAKEN2 && \
cd frontend && npm run build && \
cd .. && cp -r frontend/dist/* backend/public/ && \
cd backend && ./deploy.sh
```

## デプロイ後の確認

1. デプロイ完了後、以下のURLにアクセス：
   ```
   https://awaken2-backend-212213816719.asia-northeast1.run.app
   ```

2. 正常にフロントエンドが表示されることを確認

## その他の情報

### 環境変数（本番環境で設定済み）
- MongoDB接続
- MEXC API
- Telegram Bot
- Redis
- その他認証情報

### 現在のCORS設定
- 現在: `https://storage.googleapis.com`のみ許可
- Cloud Runでホストすることで同一オリジンになるため問題解決

### ポート設定
- 本番環境: 8080（Cloud Run要件）
- 開発環境: 3000（バックエンド）、5173（フロントエンド）