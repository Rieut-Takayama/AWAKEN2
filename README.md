# AWAKEN2 - AI仮想通貨投資分析ツール

[![Deploy to Cloud Run](https://img.shields.io/badge/Deploy-Cloud%20Run-blue)](https://awaken2-backend-212213816719.asia-northeast1.run.app)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 📊 概要

AWAKEN2は、AIを活用して仮想通貨の買い時を自動分析し、Telegramで通知するWebアプリケーションです。RSI、MACD、ボリンジャーバンドなどのテクニカル指標を総合的に分析し、0〜100点の買い度指数として表示します。

### 🎯 主な機能

- **リアルタイム分析**: 24時間365日、選択した仮想通貨を自動監視
- **AI判定**: 複数のテクニカル指標を総合的に分析し、買い時を判定
- **Telegram通知**: 設定した閾値を超えると即座にスマートフォンに通知
- **個別設定**: 銘柄ごとに通知間隔を設定可能（5分〜240分）
- **詳細レポート**: 通知履歴から、その時点でのAI分析詳細を確認可能

## 🚀 デモ

- **本番環境**: https://awaken2-backend-212213816719.asia-northeast1.run.app
- **トライアルキー**: `TRIAL2025` または `AWAKEN2`

## 🛠️ 技術スタック

### バックエンド
- Node.js + TypeScript
- Express.js
- MongoDB (データベース)
- Redis (キャッシュ)
- Google Cloud Run (ホスティング)

### フロントエンド
- HTML5 + CSS3 + Vanilla JavaScript
- レスポンシブデザイン
- マトリックスアニメーション

### 外部API
- MEXC Exchange API (価格データ)
- Telegram Bot API (通知)
- Anthropic Claude API (AI分析)

## 📦 インストール

### 前提条件

- Node.js v20以上
- npm または yarn
- Google Cloud SDK
- MongoDB Atlas アカウント
- MEXC API キー
- Telegram Bot トークン

### セットアップ

1. リポジトリをクローン
```bash
git clone https://github.com/yourusername/awaken2.git
cd awaken2
```

2. 依存関係をインストール
```bash
cd backend
npm install
```

3. 環境変数を設定
```bash
cp .env.example .env
# .envファイルを編集して必要な値を設定
```

4. ローカルで起動
```bash
npm run dev
```

## 🚢 デプロイ

### Google Cloud Runへのデプロイ

1. Google Cloud CLIをセットアップ
```bash
gcloud auth login
gcloud config set project your-project-id
```

2. ビルドとデプロイ
```bash
npm run build
sh deploy.sh
```

3. 環境変数を設定
```bash
# set-env-vars.shを編集してから実行
sh set-env-vars.sh
```

## 📖 使い方

### 初期設定

1. **ログイン**: トライアルキーでログイン
2. **API設定**: MEXCのAPIキーを設定画面で入力
3. **Telegram設定**: 
   - BotFatherで新しいボットを作成
   - トークンとチャットIDを設定
4. **銘柄選択**: 監視したい仮想通貨を最大3つ選択

### 通知設定

- **買い度閾値**: 65点（アグレッシブ）〜85点（慎重派）
- **通知間隔**: 銘柄ごとに5分〜240分で設定可能

## 🔧 開発

### ディレクトリ構造

```
awaken2/
├── backend/
│   ├── src/
│   │   ├── app.ts              # メインアプリケーション
│   │   ├── features/           # 機能別モジュール
│   │   ├── services/           # ビジネスロジック
│   │   ├── common/             # 共通ユーティリティ
│   │   └── types/              # TypeScript型定義
│   ├── public/                 # フロントエンドファイル
│   └── Dockerfile             # コンテナ設定
└── docs/                      # ドキュメント
```

### 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# TypeScriptコンパイル
npm run build

# テスト実行
npm test

# リント
npm run lint
```

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更の場合は、まずissueを作成して変更内容を議論してください。

1. フォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 🙏 謝辞

- MEXC Exchange - 価格データAPI提供
- Telegram - 通知プラットフォーム
- Google Cloud - ホスティングサービス

## 📞 サポート

質問や問題がある場合は、[Issues](https://github.com/yourusername/awaken2/issues)でお知らせください。

---

Built with ❤️ by [Your Name]