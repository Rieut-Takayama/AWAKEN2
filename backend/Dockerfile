# Node.js 20のベースイメージを使用
FROM node:20-alpine

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# すべての依存関係をインストール（開発依存関係も含む）
RUN npm ci

# アプリケーションのソースコードをコピー
COPY . .

# フロントエンドファイルをコピー
COPY public ./public

# webpackでビルド（パスエイリアスを解決）
RUN npm run build

# ポート8080を使用
ENV PORT=8080
ENV NODE_ENV=production

# ポートを公開
EXPOSE 8080

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/api/system/health || exit 1

# アプリケーションを起動
CMD ["node", "dist/app.js"]