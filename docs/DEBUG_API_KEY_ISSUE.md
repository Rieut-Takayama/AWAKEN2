# Claude APIキー上書き問題のデバッグドキュメント

## 問題の概要
- ユーザーがClaude APIキーを入力して保存
- ページ更新すると異なるランダムなキーで上書きされる（暗号化されたキー）
- ユーザーが入力したキーが保存されない
- 他のユーザーのAPIキーが表示される重大なセキュリティ問題

## 根本原因
1. **暗号化キーの共有問題**
   - 全ユーザーが同じ環境変数の暗号化キーを使用
   - 他のユーザーの暗号化されたAPIキーが混在して表示される

2. **バックエンドの設定取得エンドポイント**
   - `GET /api/settings`が暗号化されたAPIキーを返していた
   - フロントエンドがそれをそのまま表示していた

3. **フロントエンドの設定反映**
   - `applySettingsToForm`関数で暗号化されたキーを除外する処理が不足

## 実施した修正

### 1. ユーザー固有の暗号化システム（user-crypto.ts）
```typescript
// ユーザーIDを使って独自の暗号化キーを生成
export function generateUserKey(userId: string): Buffer {
    const baseKey = process.env.ENCRYPTION_KEY || 'default-awaken2-encryption-key-2024';
    const userSpecificKey = `${baseKey}-${userId}`;
    return crypto.createHash('sha256').update(userSpecificKey).digest();
}
```

### 2. バックエンド（app.simple.ts）
- GET /api/settings:
  - APIキーを空文字で返すように修正（セキュリティ対策）
  - 暗号化されたキーはフロントエンドに送信しない
- POST /api/settings:
  - ユーザー固有のキーで暗号化して保存
  - 他のユーザーのデータと混在しないように分離

### 3. フロントエンド（settings.html）
- `applySettingsToForm`関数:
  - 暗号化されたキー（:を含む）は除外
  - Claude APIキーは`sk-ant-`で始まる場合のみ設定
  - デバッグログを追加

### 4. データベースクリア
- 全ユーザーの暗号化されたデータを削除
- 新しい暗号化システムでクリーンスタート

## デバッグのためのログ設置
- 設定保存時: 受信した設定内容をログ出力（APIキーはマスク）
- 設定取得時: 返却する設定内容をログ出力
- フォーム反映時: 設定反映の確認ログ

## 確認事項
1. バックエンドサーバーが再起動されて新しいコードが反映されているか
2. ブラウザのコンソールでエラーが出ていないか
3. ネットワークタブで/api/settingsが空のAPIキーを返しているか確認
4. 暗号化された文字列（コロンを含む）が表示されていないか確認