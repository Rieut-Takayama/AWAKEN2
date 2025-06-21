# GitHub セットアップガイド

## 🚀 GitHubリポジトリの作成と設定

### 1. GitHubでリポジトリを作成

1. [GitHub](https://github.com)にログイン
2. 右上の「+」→「New repository」をクリック
3. 以下の設定で作成：
   - Repository name: `awaken2`
   - Description: `AI仮想通貨投資分析ツール - リアルタイム分析とTelegram通知`
   - Public または Private を選択
   - **Initialize this repository with:** のチェックは全て外す

### 2. ローカルリポジトリをGitHubに接続

```bash
# リモートリポジトリを追加
git remote add origin https://github.com/YOUR_USERNAME/awaken2.git

# 最初のプッシュ
git push -u origin main
```

### 3. GitHub Secretsの設定

リポジトリの Settings → Secrets and variables → Actions で以下を設定：

#### 必須のSecrets

1. **GCP_SA_KEY**
   - Google Cloud サービスアカウントのJSONキー
   - 取得方法：
     ```bash
     # サービスアカウント作成
     gcloud iam service-accounts create github-actions \
       --display-name="GitHub Actions"
     
     # 権限付与
     gcloud projects add-iam-policy-binding awaken2-project \
       --member="serviceAccount:github-actions@awaken2-project.iam.gserviceaccount.com" \
       --role="roles/run.admin"
     
     # キー作成
     gcloud iam service-accounts keys create key.json \
       --iam-account=github-actions@awaken2-project.iam.gserviceaccount.com
     ```
   - `key.json`の内容をコピーしてSecretに設定

2. **TRIAL_KEYS**
   - 値: `TRIAL2025_AWAKEN2`

3. **JWT_SECRET**
   - 32文字以上のランダムな文字列
   - 生成例: `openssl rand -hex 64`

4. **DATABASE_URL**
   - MongoDB Atlasの接続文字列

5. **MEXC_API_KEY** と **MEXC_API_SECRET**
   - MEXCで取得したAPIキー

6. **TELEGRAM_BOT_TOKEN** と **TELEGRAM_CHAT_ID**
   - Telegramボットの認証情報

7. **ANTHROPIC_API_KEY**
   - Claude APIキー

8. **REDIS_URL**
   - Redisの接続文字列

### 4. ブランチ保護の設定

Settings → Branches で以下を設定：

1. **Add rule**をクリック
2. Branch name pattern: `main`
3. 以下にチェック：
   - Require a pull request before merging
   - Require status checks to pass before merging
   - Require branches to be up to date before merging

### 5. デプロイの自動化

mainブランチにプッシュすると自動的に：
1. テストが実行される
2. ビルドが実行される
3. Google Cloud Runにデプロイされる

### 6. 動作確認

```bash
# 小さな変更を加えてテスト
echo "# Test deployment" >> README.md
git add README.md
git commit -m "test: GitHub Actions deployment"
git push origin main
```

Actions タブでデプロイの進行状況を確認できます。

## 📝 開発フロー

### 機能開発

```bash
# 新機能のブランチを作成
git checkout -b feature/new-feature

# 開発・コミット
git add .
git commit -m "feat: 新機能の追加"

# プッシュ
git push origin feature/new-feature
```

### プルリクエスト

1. GitHubでPull Requestを作成
2. レビュー後、mainブランチにマージ
3. 自動的にデプロイが実行される

## 🔧 トラブルシューティング

### デプロイが失敗する場合

1. **Actions**タブでログを確認
2. **Secrets**が正しく設定されているか確認
3. **サービスアカウント**の権限を確認

### よくあるエラー

- `Permission denied`: サービスアカウントの権限不足
- `Invalid credentials`: Secretsの値が間違っている
- `Build failed`: コードのエラー（ローカルでビルドテスト）

## 🎉 完了！

これで安定したCI/CDパイプラインが構築されました。
mainブランチへのプッシュで自動的に本番環境にデプロイされます。