#!/bin/bash

# デプロイスクリプト
echo "🚀 バックエンドをCloud Runにデプロイしています..."

# backendディレクトリに移動
cd "$(dirname "$0")"

# デプロイ実行
gcloud run deploy awaken2-backend \
  --source . \
  --allow-unauthenticated \
  --region asia-northeast1 \
  --project awaken2-project

echo "✅ デプロイコマンドが実行されました"