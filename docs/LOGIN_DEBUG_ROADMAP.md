# ログイン問題デバッグロードマップ

## 問題の概要
- ユーザーがauth.htmlからログインできない
- メールアドレス: rieu.t.okayama@gmail.com
- パスキー: AWAKEN2（固定値）

## 依存関係マップ

### フロントエンド（auth.html）
1. `/backend/public/auth.html` - 静的ログイン画面
   - メールアドレス + パスキーでログイン
   - トライアルキーでログイン
   - APIエンドポイント: `/api/auth/trial`

### バックエンド
1. `/backend/src/features/auth/auth.routes.ts` - ルーティング定義
2. `/backend/src/features/auth/auth.controller.ts` - リクエスト処理
3. `/backend/src/features/auth/auth.service.ts` - 認証ロジック
4. `/backend/src/common/middlewares/auth.middleware.ts` - JWT処理

## 調査順序
1. ✅ 環境変数の確認（TRIAL_KEYS=TRIAL2025,AWAKEN2）
2. auth.service.tsの認証ロジック確認
3. エラーログの設置と実行
4. 問題ステップの特定

## 現在の状況
- auth.htmlはメールアドレス + パスキー形式でログインを試みている
- バックエンドの実装がトライアルキーのみの認証を想定している可能性

## 問題の詳細分析

### フロントエンド（auth.html）が送信するデータ
```json
{
  "email": "rieu.t.okayama@gmail.com",
  "passkey": "AWAKEN2"
}
```

### バックエンドが期待するデータ（auth.validator.ts）
```json
{
  "passkey": "AWAKEN2"  // メールアドレスは無視される
}
```

### 原因
1. `auth.validator.ts`の`stripUnknown: true`設定により、`email`フィールドが削除される
2. `auth.service.ts`はパスキーのみで認証を行い、メールアドレスを使用していない
3. フロントエンドとバックエンドの期待する認証フローが不一致

## 解決策
1. auth.htmlからメールアドレスフィールドを削除し、パスキーのみの認証にする
2. または、バックエンドを修正してメールアドレスも処理するようにする