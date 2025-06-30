# API設定エンドポイント404エラー解決レポート

## エラー概要
- **発生日時**: 2025-06-30
- **エラー内容**: POST https://awaken2-212213816719.asia-northeast1.run.app/api/settings/mexc 404 (Not Found)
- **発生箇所**: settings.html:1264

## 問題の原因
バックエンドには `/api/settings` エンドポイントのみが存在し、個別の設定用エンドポイント（`/api/settings/mexc`、`/api/settings/telegram`など）は実装されていなかった。

## 修正内容

### 1. settings.html の修正
以下の関数を修正し、すべて `/api/settings` エンドポイントを使用するように変更：

#### saveMEXCSettings()
```javascript
// 修正前: fetch('/api/settings/mexc', ...)
// 修正後: 
const currentSettings = await fetch('/api/settings').then(r => r.json());
await fetch('/api/settings', {
    method: 'POST',
    body: JSON.stringify({
        ...currentSettings,
        mexc: { apiKey, secretKey }
    })
});
```

#### saveThresholdSettings()
```javascript
// 修正前: fetch('/api/settings/threshold', ...)
// 修正後: 現在の設定を取得してから通知設定のみ更新
```

#### saveSymbolSettings()
```javascript
// 修正前: fetch('/api/settings/symbols', ...)
// 修正後: 現在の設定を取得してから銘柄設定のみ更新
```

#### saveTelegramSettings()
```javascript
// 修正前: fetch('/api/settings/telegram', ...)
// 修正後: 現在の設定を取得してからTelegram設定のみ更新
```

### 2. デバッグログの追加
各保存関数にエラーハンドリングとログ出力を追加し、問題の特定を容易にした。

## 関連ファイル
- **フロントエンド**: `/backend/public/settings.html`
- **バックエンド**: `/backend/src/features/settings/settings.routes.ts`
- **型定義**: `/backend/src/types/index.ts`、`/frontend/src/types/index.ts`

## 今後の推奨事項
1. **API仕様の統一**: フロントエンドとバックエンドでAPIパスの定義を共有し、不整合を防ぐ
2. **型定義の活用**: TypeScriptの型定義を使用してAPIエンドポイントを管理
3. **統合テスト**: 設定保存機能の統合テストを追加して、同様の問題を事前に検出

## 対応結果
- ✅ 404エラーの解消
- ✅ 設定保存機能の正常動作
- ✅ データ整合性の保持（他の設定値が失われない）