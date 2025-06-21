# AWAKEN2 認証システム設計書

**バージョン**: 1.0.0  
**作成日**: 2025-06-20  
**ステータス**: 設計完了

## 1. 概要

このドキュメントでは、AWAKEN2の認証システムの詳細設計を定義します。AWAKEN2は仮想通貨テクニカル分析通知ツールであり、シンプルなトライアルキーベースの認証システムを採用します。

## 2. 認証メカニズム

### 2.1 選定方式

**トライアルキー + JWT（JSON Web Token）ベースの認証**

- トライアルキー認証による初回アクセス許可
- JWTトークンによるセッション管理
- ステートレスな認証状態管理

### 2.2 選定理由

- **シンプルさ**: 複雑な登録・パスワード管理が不要
- **即座のアクセス**: ユーザーはキー入力のみで即座に利用開始可能
- **開発効率**: 最小限の認証機能で素早い実装が可能
- **スケーラビリティ**: JWTによるステートレス設計でサーバー負荷を軽減
- **フロントエンド親和性**: SPA（Single Page Application）との相性が良い

### 2.3 認証キー仕様

```typescript
// 有効なトライアルキー
const VALID_TRIAL_KEYS = ['TRIAL2025', 'AWAKEN2'];

// 認証後のユーザー情報
interface TrialUser {
  id: number;
  trial: boolean;
  token: string;
  expires: number; // Unix timestamp
}
```

## 3. 認証フロー

### 3.1 トライアルキー認証フロー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Frontend as フロントエンド
    participant Backend as バックエンド
    
    User->>Frontend: トライアルキー入力
    Frontend->>Backend: POST /api/auth/trial { passkey }
    Backend->>Backend: キーの妥当性チェック
    
    alt 有効なキー
        Backend->>Backend: JWTトークン生成
        Backend->>Frontend: { success: true, token, user }
        Frontend->>Frontend: トークンをLocalStorageに保存
        Frontend->>User: ダッシュボードへリダイレクト
    else 無効なキー  
        Backend->>Frontend: { success: false, error }
        Frontend->>User: エラーメッセージ表示
    end
```

### 3.2 自動ログイン（トークン検証）フロー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Frontend as フロントエンド
    participant Backend as バックエンド
    
    User->>Frontend: ページアクセス
    Frontend->>Frontend: LocalStorageからトークン取得
    
    alt トークンが存在
        Frontend->>Backend: GET /api/auth/verify (Authorization Header)
        Backend->>Backend: トークンの妥当性・有効期限チェック
        
        alt 有効なトークン
            Backend->>Frontend: { success: true, user }
            Frontend->>User: ダッシュボード表示
        else 無効なトークン
            Backend->>Frontend: { success: false }
            Frontend->>Frontend: トークン削除
            Frontend->>User: ログインページへリダイレクト
        end
    else トークンが存在しない
        Frontend->>User: ログインページ表示
    end
```

### 3.3 ログアウトフロー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Frontend as フロントエンド
    participant Backend as バックエンド
    
    User->>Frontend: ログアウトボタンクリック
    Frontend->>Backend: POST /api/auth/logout
    Backend->>Frontend: { success: true }
    Frontend->>Frontend: LocalStorageからトークン削除
    Frontend->>User: ログインページへリダイレクト
```

## 4. セキュリティ対策

### 4.1 トークン管理

- **アクセストークン有効期限**: 24時間
- **トークン保存**: LocalStorageでの保存（シンプルさを優先）
- **トークン更新**: 手動再ログインによる更新

### 4.2 最小限のセキュリティ対策

- **HTTPS通信**: 本番環境でのHTTPS必須
- **CORS設定**: 適切なオリジン制限
- **入力サニタイゼーション**: XSS対策の基本的な入力検証

### 4.3 セキュリティ要件の意図的簡略化

以下のセキュリティ機能は、シンプルさを優先して実装しません：

- パスワードハッシュ化（パスワード認証なし）
- リフレッシュトークン（24時間有効期限で十分）
- レート制限（トライアルキー方式のため不要）
- ブルートフォース対策（固定キーのため不要）
- 多要素認証
- セッション管理の複雑化

## 5. コード構造とアーキテクチャガイドライン

### 5.1 バックエンド認証関連コード構成

```
backend/src/features/auth/
├── auth.controller.ts      # リクエスト処理とレスポンス整形
├── auth.service.ts         # 認証ロジックの中核
├── auth.routes.ts          # エンドポイント定義
├── auth.middleware.ts      # 認証状態検証
└── auth.types.ts          # 認証固有の型定義
```

**各ファイルの責務：**

- **auth.controller.ts**: HTTP リクエスト/レスポンスの処理
- **auth.service.ts**: トライアルキー検証、JWT生成・検証
- **auth.routes.ts**: `/api/auth/*` エンドポイントの定義
- **auth.middleware.ts**: 認証必須エンドポイントでのトークン検証
- **auth.types.ts**: 認証関連の追加型定義

### 5.2 フロントエンド認証管理

```
frontend/src/features/auth/
├── components/
│   ├── LoginForm.tsx       # トライアルキー入力フォーム
│   └── AuthGuard.tsx       # 認証状態チェックコンポーネント
├── hooks/
│   └── useAuth.ts          # 認証状態管理フック
├── services/
│   └── auth.service.ts     # 認証API呼び出し
└── types/
    └── auth.types.ts       # 認証関連型定義
```

**各モジュールの責務：**

- **LoginForm.tsx**: トライアルキー入力UI
- **AuthGuard.tsx**: 未認証時のリダイレクト処理
- **useAuth.ts**: 認証状態のグローバル管理
- **auth.service.ts**: 認証関連API呼び出しの抽象化

### 5.3 実装ガイドライン

#### 5.3.1 バックエンドミドルウェア実装

```typescript
// auth.middleware.ts の実装例
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: '認証が必要です' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: '無効なトークンです' 
    });
  }
}
```

#### 5.3.2 フロントエンド認証フック実装

```typescript
// useAuth.ts の実装例
export function useAuth() {
  const [user, setUser] = useState<TrialUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const login = async (passkey: string) => {
    const response = await authService.trialLogin(passkey);
    if (response.success) {
      localStorage.setItem('token', response.token);
      setUser(response.user);
      return true;
    }
    return false;
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  
  return { user, login, logout, loading };
}
```

#### 5.3.3 ルーティング設定

```typescript
// routes/index.tsx の実装例
function AppRoutes() {
  return (
    <Routes>
      {/* 公開ルート */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* 認証必須ルート */}
      <Route path="/" element={
        <AuthGuard>
          <DashboardPage />
        </AuthGuard>
      } />
      <Route path="/settings" element={
        <AuthGuard>
          <SettingsPage />
        </AuthGuard>
      } />
      <Route path="/history" element={
        <AuthGuard>
          <HistoryPage />
        </AuthGuard>
      } />
    </Routes>
  );
}
```

## 6. API仕様

### 6.1 認証エンドポイント

#### POST /api/auth/trial
**目的**: トライアルキーによる認証

**リクエスト**:
```json
{
  "passkey": "TRIAL2025"
}
```

**成功レスポンス** (200):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires": 1735689600,
  "user": {
    "trial": true,
    "id": 1
  }
}
```

**エラーレスポンス** (401):
```json
{
  "success": false,
  "error": "無効なトライアルキーです"
}
```

#### GET /api/auth/verify
**目的**: トークンの有効性確認

**ヘッダー**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**成功レスポンス** (200):
```json
{
  "success": true,
  "user": {
    "trial": true,
    "id": 1
  }
}
```

**エラーレスポンス** (401):
```json
{
  "success": false,
  "error": "無効なトークンです"
}
```

#### POST /api/auth/logout
**目的**: ログアウト処理

**成功レスポンス** (200):
```json
{
  "success": true,
  "message": "ログアウトしました"
}
```

### 6.2 認証エラーレスポンスの標準形式

全ての認証エラーは以下の形式で統一します：

- **401 Unauthorized**: `{ "success": false, "error": "認証が必要です" }`
- **403 Forbidden**: `{ "success": false, "error": "アクセス権限がありません" }`

## 7. 実装フェーズへの引き継ぎポイント

### 7.1 認証が必要なエンドポイント

**全ての `/api/` エンドポイントは認証が必要**（以下を除く）:

- `/api/auth/trial` - トライアルキー認証
- `/api/auth/verify` - トークン検証
- `/api/auth/logout` - ログアウト
- `/api/system/health` - システムヘルスチェック

### 7.2 認証不要エンドポイント

上記の認証関連エンドポイントとシステム関連エンドポイントのみ

### 7.3 フロントエンド実装時の注意事項

1. **LocalStorage使用**: トークンはLocalStorageで管理
2. **自動リダイレクト**: 未認証時は自動的にログインページへ
3. **トークン期限切れ**: API呼び出しで401エラー時は自動ログアウト
4. **シンプルなUI**: トライアルキー入力フォームは最小限の構成

### 7.4 バックエンド実装時の注意事項

1. **ミドルウェア適用**: 認証必須エンドポイントには `requireAuth` ミドルウェアを適用
2. **環境変数**: `JWT_SECRET` の設定が必要
3. **エラー処理**: 統一されたエラーレスポンス形式を維持
4. **CORS設定**: フロントエンドからのリクエストを許可

## 8. テスト戦略

### 8.1 単体テスト

- トライアルキー検証機能
- JWT生成・検証機能
- 認証ミドルウェア機能

### 8.2 統合テスト

- 認証フロー全体のテスト
- 認証エラー時の動作確認
- フロントエンド・バックエンド間の認証連携

### 8.3 E2Eテスト

- ログイン → ダッシュボード → ログアウトの一連の流れ
- 無効なキーでの認証失敗パターン
- トークン期限切れ時の自動ログアウト

## 9. 今後の拡張性

現在はシンプルな認証システムですが、将来的な拡張の可能性：

- **有料プラン**: ユーザーロールの追加
- **OAuth連携**: Google・GitHub等の外部認証
- **アカウント管理**: メール認証・パスワード管理
- **セッション管理**: より高度なセキュリティ機能

ただし、現バージョンではこれらの機能は実装せず、必要に応じて段階的に追加することを想定しています。