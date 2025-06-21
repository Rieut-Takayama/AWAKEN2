# デプロイ準備完了

## 修正内容の確認

### ✅ APIパス修正済み
- **修正前**: `/api/auth/trial-login`
- **修正後**: `/api/auth/trial`
- **該当ファイル**: 
  - backend/src/app.simple.ts（26行目）
  - backend/public/index.html（158行目）

### ✅ ビルド完了
- webpackビルド成功
- dist/app.js 生成済み

## デプロイコマンド

```bash
# 1. Google Cloud認証（初回のみ）
gcloud auth login
gcloud config set project awaken2-project

# 2. バックエンドディレクトリに移動
cd /Users/rieut/Desktop/AWAKEN2/backend

# 3. デプロイ実行
gcloud run deploy awaken2-backend \
  --source . \
  --allow-unauthenticated \
  --region asia-northeast1 \
  --project awaken2-project
```

## デプロイ後の確認

1. **ログイン画面**: https://awaken2-backend-212213816719.asia-northeast1.run.app
2. **ヘルスチェック**: https://awaken2-backend-212213816719.asia-northeast1.run.app/api/system/health
3. **トライアルキー**: `TRIAL2025` または `AWAKEN2`

## 現在の状態

- ローカルサーバー: http://localhost:8080 で正常動作中
- APIパス: 型定義と一致
- フロントエンド: backend/public/index.html に配置済み