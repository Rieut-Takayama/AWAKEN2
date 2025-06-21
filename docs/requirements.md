# AWAKEN2 要件定義書

**バージョン**: 1.0.0  
**最終更新日**: 2025-06-20  
**ステータス**: ドラフト  

## 1. プロジェクト概要

### 1.1 目的と背景

AWAKEN2は、仮想通貨投資において「24時間チャートに張り付けない」「チャート分析スキル不足」「タイミング逃し」という課題を解決するテクニカル分析通知ツールです。MEXC APIを活用し、ボリンジャーバンド・MACD・RSIの3つのインジケーターをAI分析し、買い度指数75点以上で投資タイミングを通知することで、自動売買のリスクを避けながら確実な利益機会を提供します。

### 1.2 ターゲットユーザー

- **仮想通貨投資初心者〜上級者**: 投資経験レベルを問わず利用可能
- **短期投資志向者**: デイトレード〜スイングトレードを行う投資家
- **非技術者**: プログラミング知識不要で直感的に使える設計

### 1.3 核となる機能と価値

以下は、プロジェクトの本質的価値を提供するために「絶対に必要」な機能です。各機能は「この機能がないとプロジェクトの目的達成が不可能になる」という基準で厳選されています。

- **24時間自動監視機能**: MEXC APIによる連続的価格データ取得 - *この機能がないとタイミング逃しという根本課題が解決できない*
- **マルチタイムフレーム分析**: 5分〜1日足の総合テクニカル分析 - *この機能がないと分析精度が著しく低下する*
- **AI判断エンジン**: 3つのインジケーターの総合スコアリング - *この機能がないと客観的判断支援ができない*
- **買い度指数通知**: 75点以上での自動通知配信 - *この機能がないと投資タイミングを逃してしまう*

## 2. 画面一覧

このアプリケーションは以下の画面要素と実際のページで構成されます。各ページのモックアップは作成後に詳細化されます。

### 2.1 画面要素一覧

以下は機能的に必要な全ての画面要素です。これらは必ずしも独立したページとして実装されるわけではありません。

| 画面要素名 | 目的 | 実現する核心的価値 |
|----------|------|----------------|
| ログイン要素 | ユーザー認証 | セキュリティ確保・個人設定保持 |
| ダッシュボード要素 | 現在の分析状況表示 | リアルタイム状況把握 |
| 通知設定要素 | 通知条件カスタマイズ | 個人の投資スタイル適応 |
| 分析履歴要素 | 過去の通知・結果閲覧 | 投資判断の検証・学習 |
| 通貨選択要素 | 監視対象通貨の設定 | 投資対象の絞り込み |
| スコア表示要素 | リアルタイム買い度指数表示 | 現在の投資機会可視化 |

### 2.2 ページ構成計画

上記の画面要素を、ユーザー体験とナビゲーション効率を最適化するために以下のように統合・構成します。極限までシンプルな構成とし、非技術者でも直感的に使用できるように設計します。

#### 2.2.1 公開ページ

| ID | ページ名 | 主な目的 | 含まれる画面要素 | 優先度 | モックアップ | 実装状況 |
|----|---------|---------|----------------|-------|------------|---------|
| P-001 | ログインページ | ユーザー認証 | ログイン要素 | 高 | [login.html](/mockups/login.html) | 未着手 |

#### 2.2.2 ユーザーページ（要認証）

| ID | ページ名 | 主な目的 | 含まれる画面要素 | 優先度 | モックアップ | 実装状況 |
|----|---------|---------|----------------|-------|------------|---------|
| U-001 | メインダッシュボード | 総合分析状況表示 | ダッシュボード要素、スコア表示要素、通貨選択要素 | 高 | [dashboard.html](/mockups/dashboard.html) | 未着手 |
| U-002 | 通知設定ページ | 通知条件設定 | 通知設定要素 | 高 | [notification-settings.html](/mockups/notification-settings.html) | 未着手 |
| U-003 | 分析履歴ページ | 過去結果確認 | 分析履歴要素 | 中 | [history.html](/mockups/history.html) | 未着手 |

### 2.3 主要ルート定義

##### 公開ルート
| パス | ページID | 説明 |
|------|---------|------|
| `/login` | P-001 | ログイン |

##### ユーザールート（要認証）
| パス | ページID | 説明 |
|------|---------|------|
| `/` | U-001 | メインダッシュボード |
| `/settings` | U-002 | 通知設定 |
| `/history` | U-003 | 分析履歴 |

### 2.4 共通レイアウト構成

#### レイアウトパターン
- **公開ページ用**: ミニマルヘッダーのみ
- **認証後ページ用**: シンプルヘッダー + ミニマルナビゲーション

#### ヘッダー要素

##### 公開ページヘッダー
- AWAKEN2ロゴ
- ログインリンク

##### 認証後ヘッダー
- AWAKEN2ロゴ
- 現在スコア表示
- 通知状態アイコン
- ログアウトボタン

#### ナビゲーションメニュー
- ダッシュボード
- 通知設定
- 履歴
- (最小限のメニュー構成)

## 3. ページ詳細

### 3.1 公開ページ

#### 3.1.1 ログインページ (P-001)

**ページ概要**: ユーザー認証によるシステムアクセス

**含まれる画面要素**:
- ログイン要素: メールアドレス・パスワード入力フォーム

**状態と動作**:
- 未ログイン状態: ログインフォーム表示
- 認証成功: ダッシュボードへリダイレクト
- 認証失敗: エラーメッセージ表示

**データとAPI**:
- ユーザーモデル: { email: string, password: string }
- `POST /api/auth/login` → ユーザー認証
  - リクエスト: { email, password }
  - 成功: { token, user }
  - エラー: 401 認証失敗

### 3.2 ユーザーページ

#### 3.2.1 メインダッシュボード (U-001)

**ページ概要**: リアルタイム分析状況とスコア表示のメイン画面

**含まれる画面要素**:
- ダッシュボード要素: 現在監視中通貨の一覧表示
- スコア表示要素: 各通貨の買い度指数リアルタイム表示
- 通貨選択要素: 監視対象通貨の追加・削除

**状態と動作**:
- リアルタイム更新: 5秒間隔での価格・スコア更新
- 高スコア通知: 75点以上でのアラート表示
- 通貨切り替え: ワンクリックでの監視通貨変更

**データとAPI**:
- 分析データモデル: { symbol: string, price: number, score: number, indicators: object }
- `GET /api/analysis/realtime` → リアルタイム分析データ取得
- `POST /api/watchlist/add` → 監視通貨追加
- `DELETE /api/watchlist/remove` → 監視通貨削除

#### 3.2.2 通知設定ページ (U-002)

**ページ概要**: 通知条件とアラート設定のカスタマイズ

**含まれる画面要素**:
- 通知設定要素: スコア閾値、通知方法、頻度設定

**状態と動作**:
- 閾値調整: 75点基準の微調整可能
- 通知方法選択: ブラウザ通知、メール通知
- 設定保存: リアルタイム反映

**データとAPI**:
- 設定モデル: { threshold: number, methods: array, frequency: string }
- `GET /api/settings/notification` → 現在設定取得
- `PUT /api/settings/notification` → 設定更新

#### 3.2.3 分析履歴ページ (U-003)

**ページ概要**: 過去の通知履歴と投資成果の確認

**含まれる画面要素**:
- 分析履歴要素: 通知履歴、推奨価格、実際の値動き

**状態と動作**:
- 履歴表示: 日付順での通知履歴表示
- 成果計算: 推奨タイミングでの仮想利益計算
- フィルタリング: 通貨別、期間別での絞り込み

**データとAPI**:
- 履歴モデル: { date: string, symbol: string, score: number, price: number, outcome: number }
- `GET /api/history/notifications` → 通知履歴取得

## 4. データモデル概要

### 4.1 主要エンティティ

| エンティティ | 主な属性 | 関連エンティティ | 備考 |
|------------|----------|----------------|------|
| User | id, email, password, settings | Watchlist, NotificationHistory | ユーザー管理 |
| Watchlist | userId, symbol, isActive | User, AnalysisData | 監視通貨管理 |
| AnalysisData | symbol, price, timestamp, bollinger, macd, rsi, score | Watchlist | リアルタイム分析データ |
| NotificationHistory | userId, symbol, score, price, timestamp, outcome | User | 通知履歴管理 |

## 5. 特記すべき非機能要件

以下は標準的な実装方針から特に注意すべき点です：

- **ゼロランニングコスト**: 無料枠内でのクラウドサービス利用
- **高速デプロイ**: CI/CD自動化による即座のデプロイメント
- **極限シンプルUI**: 操作ステップ数の最小化
- **低エラー率**: 徹底的なエラーハンドリングと冗長性確保
- **リアルタイム性**: 5秒以内での価格データ更新

## 6. ディレクトリ構造設計

### 6.1 機能中心ディレクトリ構造

非技術者にも理解しやすい、機能単位のディレクトリ構造を採用します。技術的な層（controllers, services）ではなく、ビジネス機能（auth, analysis, notifications）でディレクトリを分割し、各機能ディレクトリは自己完結的な構造を持ちます。

#### 6.1.1 バックエンド構造

```
backend/
├── src/
│   ├── common/                    # 全機能で共有する共通コード
│   │   ├── middlewares/           # 共通ミドルウェア
│   │   │   ├── auth.middleware.ts
│   │   │   ├── cors.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── utils/                 # ユーティリティ
│   │   │   ├── crypto.util.ts
│   │   │   ├── date.util.ts
│   │   │   └── validation.util.ts
│   │   └── validators/            # 共通バリデーター
│   │       ├── api.validator.ts
│   │       └── schema.validator.ts
│   │
│   ├── features/                  # 機能ごとにグループ化
│   │   ├── auth/                  # 認証機能
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.types.ts      # 機能固有の追加型
│   │   │
│   │   ├── analysis/              # 分析機能
│   │   │   ├── analysis.controller.ts
│   │   │   ├── analysis.service.ts
│   │   │   ├── analysis.routes.ts
│   │   │   ├── analysis.types.ts
│   │   │   └── indicators/        # テクニカル指標
│   │   │       ├── bollinger.ts
│   │   │       ├── macd.ts
│   │   │       └── rsi.ts
│   │   │
│   │   ├── watchlist/             # 監視リスト機能
│   │   │   ├── watchlist.controller.ts
│   │   │   ├── watchlist.service.ts
│   │   │   ├── watchlist.routes.ts
│   │   │   └── watchlist.types.ts
│   │   │
│   │   ├── notifications/         # 通知機能
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── notifications.routes.ts
│   │   │   ├── notifications.types.ts
│   │   │   └── providers/         # 通知プロバイダー
│   │   │       ├── telegram.provider.ts
│   │   │       └── browser.provider.ts
│   │   │
│   │   ├── mexc/                  # MEXC API連携機能
│   │   │   ├── mexc.controller.ts
│   │   │   ├── mexc.service.ts
│   │   │   ├── mexc.routes.ts
│   │   │   └── mexc.types.ts
│   │   │
│   │   └── history/               # 履歴機能
│   │       ├── history.controller.ts
│   │       ├── history.service.ts
│   │       ├── history.routes.ts
│   │       └── history.types.ts
│   │
│   ├── types/                     # フロントエンドと同期する型定義
│   │   └── index.ts               # バックエンド用型定義とAPIパス
│   │
│   ├── config/                    # アプリケーション設定
│   │   ├── database.config.ts
│   │   ├── app.config.ts
│   │   └── env.config.ts
│   │
│   ├── db/                        # データベース関連
│   │   ├── migrations/
│   │   ├── models/
│   │   └── connection.ts
│   │
│   └── app.ts                     # アプリケーションエントリーポイント
│
├── package.json
├── tsconfig.json
└── .env.example
```

#### 6.1.2 フロントエンド構造

モックデータで完全動作するUIを構築し、後からAPIエンドポイントに差し替える前提の構造：

```
frontend/
├── src/
│   ├── types/                     # バックエンドと同期する型定義
│   │   └── index.ts               # APIパスと型定義（単一の真実源）
│   │
│   ├── layouts/                   # 共通レイアウト（要件定義書2.4に対応）
│   │   ├── PublicLayout.tsx       # 公開ページ用（ヘッダーのみ）
│   │   └── UserLayout.tsx         # ユーザー用（ヘッダー＋ナビゲーション）
│   │
│   ├── pages/                     # ページコンポーネント（要件定義書2.2に対応）
│   │   ├── public/                # 公開ページ
│   │   │   └── LoginPage.tsx      # P-001: ログインページ
│   │   └── user/                  # ユーザーページ（要認証）
│   │       ├── DashboardPage.tsx  # U-001: メインダッシュボード
│   │       ├── SettingsPage.tsx   # U-002: 通知設定
│   │       └── HistoryPage.tsx    # U-003: 分析履歴
│   │
│   ├── components/                # 再利用可能なコンポーネント
│   │   ├── common/                # 汎用UI部品
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Spinner.tsx
│   │   └── features/              # 機能別コンポーネント
│   │       ├── auth/              # 認証関連
│   │       │   ├── LoginForm.tsx
│   │       │   └── AuthGuard.tsx
│   │       ├── analysis/          # 分析関連
│   │       │   ├── ScoreDisplay.tsx
│   │       │   ├── CurrencyCard.tsx
│   │       │   ├── RealtimeData.tsx
│   │       │   └── TrendIndicator.tsx
│   │       ├── watchlist/         # 監視リスト関連
│   │       │   ├── WatchlistManager.tsx
│   │       │   └── CurrencySelector.tsx
│   │       ├── notifications/     # 通知関連
│   │       │   ├── NotificationSettings.tsx
│   │       │   ├── TelegramSetup.tsx
│   │       │   └── ThresholdSlider.tsx
│   │       └── history/           # 履歴関連
│   │           ├── HistoryTable.tsx
│   │           └── PerformanceChart.tsx
│   │
│   ├── services/                  # API接続層（差し替えの中心）
│   │   ├── api/                   # 実API接続実装
│   │   │   ├── client.ts          # APIクライアント基盤
│   │   │   ├── auth.api.ts
│   │   │   ├── analysis.api.ts
│   │   │   ├── watchlist.api.ts
│   │   │   ├── notifications.api.ts
│   │   │   └── history.api.ts
│   │   ├── mock/                  # モックデータ・ロジック
│   │   │   ├── data.ts            # モックデータ定義
│   │   │   ├── auth.mock.ts
│   │   │   ├── analysis.mock.ts
│   │   │   ├── watchlist.mock.ts
│   │   │   ├── notifications.mock.ts
│   │   │   └── history.mock.ts
│   │   └── index.ts               # 統合層（自動フォールバック）
│   │
│   ├── hooks/                     # カスタムフック
│   │   ├── useApi.ts              # API呼び出し汎用フック
│   │   ├── useAuth.ts             # 認証状態管理
│   │   ├── useRealtime.ts         # リアルタイムデータ管理
│   │   ├── useNotifications.ts    # 通知管理
│   │   └── useLocalStorage.ts     # ローカルストレージ管理
│   │
│   ├── contexts/                  # グローバル状態管理
│   │   ├── AuthContext.tsx        # 認証コンテキスト
│   │   ├── SettingsContext.tsx    # 設定コンテキスト
│   │   └── NotificationContext.tsx # 通知コンテキスト
│   │
│   ├── routes/                    # ルーティング設定（要件定義書2.3に対応）
│   │   ├── index.tsx              # メインルーター
│   │   └── ProtectedRoute.tsx     # 認証ガード
│   │
│   ├── styles/                    # スタイル管理
│   │   ├── globals.css            # グローバルスタイル
│   │   ├── matrix.theme.css       # マトリックステーマ
│   │   └── components/            # コンポーネント別スタイル
│   │
│   └── utils/                     # ユーティリティ
│       ├── formatters.ts          # データフォーマッター
│       ├── validators.ts          # バリデーション
│       ├── constants.ts           # 定数定義
│       └── mockIndicator.ts       # モック使用状態の表示制御
│
├── public/
│   ├── index.html
│   └── favicon.ico
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 6.2 重要な設計ポイント

#### 6.2.1 機能中心の分割理念
- **非技術者でも理解しやすい**: auth（認証）、analysis（分析）、notifications（通知）など、ビジネス機能で分割
- **自己完結性**: 各機能ディレクトリは独立して動作し、他機能への依存を最小限に抑制
- **保守性の向上**: 機能追加・変更時の影響範囲を限定

#### 6.2.2 モック→実API移行戦略
- **services/index.ts**: モック/実APIの切り替えロジックを一元管理
- **段階的移行**: 機能単位で順次実APIに移行可能
- **フォールバック機能**: API障害時の自動モック切り替え
- **開発効率**: バックエンド完成前でもフロントエンド開発を並行進行

#### 6.2.3 型定義同期システム
- **単一真実源**: 2つの同期されたtypes/index.tsファイル
- **自動検知**: 型不整合の早期発見
- **開発効率**: バックエンド・フロントエンド間の型安全性確保

#### 6.2.4 スケーラビリティ考慮
- **機能追加容易性**: 新機能は新ディレクトリとして追加
- **チーム開発対応**: 機能単位での分担開発が可能
- **テスト容易性**: 機能単位でのテスト実行

## 7. 開発計画とマイルストーン

| フェーズ | 内容 | 期間 | ステータス |
|---------|------|------|----------|
| フェーズ1 | MEXC API連携・基本分析エンジン | 1週間 | 未着手 |
| フェーズ2 | UI実装・認証システム | 1週間 | 未着手 |
| フェーズ3 | 通知システム・履歴機能 | 1週間 | 未着手 |
| フェーズ4 | テスト・デプロイ最適化 | 1週間 | 未着手 |

## 8. 添付資料

- MEXC API仕様書: [公式ドキュメント参照]
- テクニカル指標計算式: [実装時に詳細化]