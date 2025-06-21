# AWAKEN2 デプロイ問題の解決方法

## 問題の診断結果

### 現在の状況
- **バックエンド**: ✅ Cloud Runで正常稼働中
  - URL: https://awaken2-backend-212213816719.asia-northeast1.run.app
- **フロントエンド**: ❌ 未デプロイ（これが原因）

### 根本原因
フロントエンドが一度もデプロイされていないため、アプリケーションにアクセスできません。

## 解決方法

### Cloud Runでフロントエンドもホスト（推奨）

フロントエンドとバックエンドを1つのCloud Runサービスでホストします。

#### 手順

1. **Google Cloud CLIをインストール**（まだの場合）
```bash
# macOSの場合
brew install google-cloud-sdk

# または公式インストーラーから
# https://cloud.google.com/sdk/docs/install
```

2. **認証とプロジェクト設定**
```bash
gcloud auth login
gcloud config set project awaken2-project
```

3. **フロントエンドファイルはすでにバックエンドに配置済み**
   - `/backend/public/index.html` にログイン画面が配置されています
   - APIエンドポイントも修正済み（`/api/auth/trial`）

4. **バックエンドを再デプロイ**
```bash
cd /Users/rieut/Desktop/AWAKEN2/backend
gcloud run deploy awaken2-backend \
  --source . \
  --allow-unauthenticated \
  --region asia-northeast1 \
  --project awaken2-project
```

## デプロイ後の確認

1. **デプロイされたURL**
   - https://awaken2-backend-212213816719.asia-northeast1.run.app

2. **動作確認**
   - ログイン画面が表示されることを確認
   - トライアルキー: `TRIAL2025` または `AWAKEN2`

3. **APIの確認**
   - ヘルスチェック: https://awaken2-backend-212213816719.asia-northeast1.run.app/api/system/health

## トラブルシューティング

- **gcloudコマンドが見つからない**: Google Cloud SDKをインストールしてください
- **認証エラー**: `gcloud auth login` を実行してください
- **プロジェクトエラー**: `gcloud config set project awaken2-project` を実行してください

## 環境変数の設定

Cloud Runコンソールで以下の環境変数が設定されていることを確認してください：
- TRIAL_KEYS
- DATABASE_URL
- JWT_SECRET
- その他の必要な環境変数