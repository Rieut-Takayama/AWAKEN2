# 設定保存エラー調査ドキュメント

## 問題の概要
- 設定画面で「すべての設定を保存」ボタンを押すと「保存に失敗しました」エラーが発生
- ログアウト後、設定が完全に保存されていない

## 調査結果

### 1. 処理フロー
1. **フロントエンド** (`backend/public/settings.html`)
   - `saveAllSettings()` 関数が全設定を収集
   - `/api/settings` にPOSTリクエストを送信
   - 認証トークンをヘッダーに含む

2. **バックエンド** (`backend/src/app.simple.ts`)
   - `POST /api/settings` エンドポイントで受信
   - `authMiddleware` で認証を確認
   - MongoDB または memoryStorage に保存

### 2. 発見した問題

#### 問題1: 暗号化処理の実装
- **ステータス**: 修正済み✅
- **詳細**: `/api/settings` エンドポイントで認証情報を保存する際、暗号化処理が実装されていなかった
- **修正内容**: `encrypt()` 関数を使用して各APIキーとトークンを暗号化するよう修正

#### 問題2: エラーログの不足
- **ステータス**: 修正済み✅
- **詳細**: エラー発生時の詳細ログが不足していた
- **修正内容**: 詳細なデバッグログを追加

### 3. 追加したログポイント

1. **リクエスト受信時**
   ```javascript
   console.log('🔍 [DEBUG] /api/settings - 受信したリクエスト:', {
       headers: req.headers,
       body: req.body,
       user: (req as any).user
   });
   ```

2. **暗号化処理時**
   ```javascript
   console.log('🔐 Telegram token暗号化完了');
   console.log('🔐 MEXC apiKey暗号化完了');
   // など
   ```

3. **エラー発生時**
   ```javascript
   console.error('❌ [DEBUG] 設定保存エラー詳細:', {
       error,
       stack: error instanceof Error ? error.stack : undefined,
       message: error instanceof Error ? error.message : '不明なエラー'
   });
   ```

### 4. 確認が必要な環境変数
- `JWT_SECRET`: 設定済み✅
- `ENCRYPTION_KEY`: 未設定（デフォルト値使用）⚠️

### 5. 次のステップ
1. サーバーログを確認して、どのステップでエラーが発生しているかを特定
2. 必要に応じて `ENCRYPTION_KEY` 環境変数を設定
3. MongoDB接続状態を確認