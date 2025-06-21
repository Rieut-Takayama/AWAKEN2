# AWAKEN2 アクセス制御マトリックス

**バージョン**: 1.0.0  
**作成日**: 2025-06-20  
**ステータス**: 設計完了

## 1. 概要

このドキュメントでは、AWAKEN2のアクセス制御とユーザー権限に関するマトリックスを定義します。AWAKEN2は仮想通貨テクニカル分析通知ツールであり、シンプルなトライアルユーザーのみのアクセス制御を採用します。

## 2. ユーザーロール定義

| ロールID | ロール名 | 説明 |
|---------|---------|-----|
| TRIAL_USER | トライアルユーザー | トライアルキーで認証されたユーザー（全機能利用可能） |
| ANONYMOUS | 未認証ユーザー | 認証前のユーザー（ログインページのみアクセス可能） |

**設計方針**:
- **シンプルさを最優先**: 複雑な権限管理は避け、2つのロールのみで構成
- **全機能へのアクセス**: トライアルユーザーは全ての機能に制限なくアクセス可能
- **拡張性**: 将来的な有料プラン等の追加に対応可能な構造

## 3. リソースアクション定義

各リソースに対して、以下のアクションを定義します：

- **C**: Create (作成)
- **R**: Read (読取)
- **U**: Update (更新)
- **D**: Delete (削除)

## 4. アクセス制御マトリックス

### 4.1 基本アクセス権限

| リソース | アクション | TRIAL_USER | ANONYMOUS | 備考 |
|---------|-----------|------------|-----------|------|
| **認証** | | | | |
| ログインページ | R | ✓ | ✓ | 全ユーザーアクセス可能 |
| トライアルキー認証 | C | ✓ | ✓ | 認証処理 |
| トークン検証 | R | ✓ | ✗ | 認証状態確認 |
| ログアウト | C | ✓ | ✗ | ログアウト処理 |
| **ダッシュボード** | | | | |
| メインダッシュボード | R | ✓ | ✗ | リアルタイム分析データ表示 |
| リアルタイム分析データ | R | ✓ | ✗ | 価格・スコア情報 |
| 買い度指数表示 | R | ✓ | ✗ | スコア表示 |
| **監視リスト** | | | | |
| 監視銘柄一覧 | R | ✓ | ✗ | 登録銘柄の表示 |
| 監視銘柄追加 | C | ✓ | ✗ | 新規銘柄の追加 |
| 監視銘柄削除 | D | ✓ | ✗ | 既存銘柄の削除 |
| **設定・通知** | | | | |
| 通知設定ページ | R | ✓ | ✗ | 設定画面表示 |
| 通知閾値設定 | U | ✓ | ✗ | スコア閾値の変更 |
| テレグラム設定 | U | ✓ | ✗ | テレグラム通知設定 |
| MEXC API設定 | U | ✓ | ✗ | API キー設定 |
| 通知テスト送信 | C | ✓ | ✗ | テスト通知の送信 |
| **履歴** | | | | |
| 分析履歴ページ | R | ✓ | ✗ | 履歴画面表示 |
| 通知履歴表示 | R | ✓ | ✗ | 過去の通知記録 |
| 分析データ履歴 | R | ✓ | ✗ | 過去の分析結果 |
| **外部API** | | | | |
| MEXC API連携 | R | ✓ | ✗ | 価格データ取得 |
| テレグラム通知送信 | C | ✓ | ✗ | 通知の送信 |

**凡例**:
- ✓: 許可
- ✗: 禁止

### 4.2 エンドポイント別アクセス制御

#### 4.2.1 公開エンドポイント（認証不要）

| エンドポイント | 説明 | アクセス権限 |
|--------------|------|------------|
| `POST /api/auth/trial` | トライアルキー認証 | 全ユーザー |
| `GET /api/auth/verify` | トークン検証 | 全ユーザー |
| `POST /api/auth/logout` | ログアウト | 全ユーザー |
| `GET /api/system/health` | システムヘルスチェック | 全ユーザー |

#### 4.2.2 認証必須エンドポイント（TRIAL_USERのみ）

| エンドポイント | 説明 | アクセス権限 |
|--------------|------|------------|
| `GET /api/users/profile` | ユーザープロフィール | TRIAL_USER |
| `PUT /api/users/settings` | ユーザー設定更新 | TRIAL_USER |
| `GET /api/analysis/realtime` | リアルタイム分析データ | TRIAL_USER |
| `GET /api/analysis/history` | 分析履歴 | TRIAL_USER |
| `GET /api/analysis/:symbol` | 特定銘柄の詳細分析 | TRIAL_USER |
| `GET /api/watchlist` | 監視リスト取得 | TRIAL_USER |
| `POST /api/watchlist/add` | 監視銘柄追加 | TRIAL_USER |
| `DELETE /api/watchlist/remove` | 監視銘柄削除 | TRIAL_USER |
| `GET /api/notifications/settings` | 通知設定取得 | TRIAL_USER |
| `PUT /api/notifications/settings` | 通知設定更新 | TRIAL_USER |
| `GET /api/notifications/history` | 通知履歴取得 | TRIAL_USER |
| `POST /api/notifications/test` | テスト通知送信 | TRIAL_USER |
| `GET /api/mexc/status` | MEXC接続状態 | TRIAL_USER |
| `POST /api/mexc/test` | MEXC接続テスト | TRIAL_USER |
| `GET /api/mexc/symbols` | 利用可能銘柄リスト | TRIAL_USER |
| `GET /api/history/notifications` | 通知履歴 | TRIAL_USER |
| `GET /api/history/analysis` | 分析履歴 | TRIAL_USER |

## 5. 特殊条件・制約事項

### 5.1 データアクセス制約

**現在の設計では特殊な制約はありません**:

- すべてのTRIAL_USERは同等の権限を持ちます
- 個人データの分離は、ユーザーIDベースで自動的に行われます
- 他のユーザーのデータにアクセスすることはできません（システム設計による制約）

### 5.2 操作制限

**設定値に関する制限**:

- **スコア閾値**: 60-90の範囲内でのみ設定可能
- **通知間隔**: 15-240分の範囲内でのみ設定可能
- **監視銘柄数**: 
  - ダッシュボード表示: 最大3銘柄
  - 設定画面管理: 最大10銘柄

これらの制限は権限ではなく、システムの機能制限として実装されます。

## 6. 実装ガイドライン

### 6.1 バックエンド実装方式

#### 6.1.1 認証ミドルウェア

```typescript
// auth.middleware.ts
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: '認証が必要です' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = {
      id: decoded.id,
      trial: decoded.trial,
      role: 'TRIAL_USER'
    };
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: '無効なトークンです' 
    });
  }
}
```

#### 6.1.2 ルーティングでの使用例

```typescript
// 認証不要エンドポイント
router.post('/api/auth/trial', authController.trialLogin);
router.get('/api/auth/verify', authController.verify);
router.post('/api/auth/logout', authController.logout);

// 認証必須エンドポイント
router.get('/api/analysis/realtime', requireAuth, analysisController.getRealtime);
router.get('/api/watchlist', requireAuth, watchlistController.getWatchlist);
router.post('/api/watchlist/add', requireAuth, watchlistController.addSymbol);
router.put('/api/users/settings', requireAuth, userController.updateSettings);
```

#### 6.1.3 データアクセス制御

```typescript
// 例: 監視リスト取得時のユーザーIDフィルタリング
export async function getWatchlist(req: Request, res: Response) {
  try {
    const userId = req.user.id; // 認証ミドルウェアで設定
    
    const watchlist = await WatchlistModel.findAll({
      where: { userId }, // 自動的に自分のデータのみ取得
      include: ['symbol', 'isActive']
    });
    
    res.json({ success: true, data: watchlist });
  } catch (error) {
    res.status(500).json({ success: false, error: 'データ取得エラー' });
  }
}
```

### 6.2 フロントエンド権限制御

#### 6.2.1 認証ガードコンポーネント

```typescript
// components/auth/AuthGuard.tsx
interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);
  
  if (loading) {
    return <div>読み込み中...</div>;
  }
  
  if (!user) {
    return null; // リダイレクト中
  }
  
  return <>{children}</>;
}
```

#### 6.2.2 ルーティング設定

```typescript
// routes/index.tsx
function AppRoutes() {
  return (
    <Routes>
      {/* 公開ルート */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* 認証必須ルート（全てTRIAL_USERが利用可能） */}
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
      
      {/* 未定義ルートは404またはダッシュボードへ */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

#### 6.2.3 APIリクエスト時の認証

```typescript
// services/api/client.ts
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

// リクエストインターセプター: 全リクエストに認証トークンを追加
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// レスポンスインターセプター: 401エラー時の自動ログアウト
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## 7. エラーハンドリング

### 7.1 認証エラーレスポンス標準形式

| HTTPステータス | レスポンス形式 | 用途 |
|--------------|--------------|------|
| 401 Unauthorized | `{ "success": false, "error": "認証が必要です" }` | 未認証アクセス |
| 401 Unauthorized | `{ "success": false, "error": "無効なトークンです" }` | 無効なJWTトークン |
| 401 Unauthorized | `{ "success": false, "error": "無効なトライアルキーです" }` | 無効なトライアルキー |
| 403 Forbidden | `{ "success": false, "error": "アクセス権限がありません" }` | 現在は使用されない |

### 7.2 クライアントサイドエラーハンドリング

```typescript
// hooks/useApi.ts
export function useApi() {
  const { logout } = useAuth();
  
  const handleApiError = useCallback((error: any) => {
    if (error.response?.status === 401) {
      logout(); // 自動ログアウト
      return;
    }
    
    // その他のエラー処理
    console.error('API Error:', error);
  }, [logout]);
  
  return { handleApiError };
}
```

## 8. テスト戦略

### 8.1 アクセス制御テスト

#### 8.1.1 認証テスト

- [ ] 有効なトライアルキーでの認証成功
- [ ] 無効なトライアルキーでの認証失敗
- [ ] 有効なJWTトークンでのアクセス許可
- [ ] 無効なJWTトークンでのアクセス拒否
- [ ] トークンなしでの認証必須エンドポイントアクセス拒否

#### 8.1.2 エンドポイント保護テスト

- [ ] 公開エンドポイントへの未認証アクセス成功
- [ ] 認証必須エンドポイントへの未認証アクセス拒否
- [ ] 認証済みユーザーの全エンドポイントアクセス成功

#### 8.1.3 データ分離テスト

- [ ] ユーザーAのデータにユーザーBがアクセスできない
- [ ] 自分のデータのみ取得・更新可能

### 8.2 フロントエンドアクセス制御テスト

- [ ] 未認証時のログインページ表示
- [ ] 認証済み時のダッシュボード表示
- [ ] 認証期限切れ時の自動ログアウト
- [ ] 手動ログアウト機能

## 9. 今後の拡張性

### 9.1 ロール拡張の可能性

現在のシンプルな設計から、将来的に以下のような拡張が考えられます：

```typescript
// 将来的なロール拡張例
export enum UserRole {
  TRIAL_USER = 'trial_user',      // 現在のトライアルユーザー
  PREMIUM_USER = 'premium_user',  // 有料プランユーザー
  ADMIN = 'admin',               // 管理者
}

// 将来的な権限マトリックス例
const ROLE_PERMISSIONS = {
  [UserRole.TRIAL_USER]: {
    watchlist_limit: 3,
    history_days: 7,
    notifications_per_day: 10,
  },
  [UserRole.PREMIUM_USER]: {
    watchlist_limit: 20,
    history_days: 365,
    notifications_per_day: 100,
    advanced_indicators: true,
  },
  [UserRole.ADMIN]: {
    watchlist_limit: Infinity,
    history_days: Infinity,
    notifications_per_day: Infinity,
    user_management: true,
    system_monitoring: true,
  },
};
```

### 9.2 機能別アクセス制御

将来的に、より詳細な機能別アクセス制御が必要になった場合の設計例：

```typescript
// 将来的な機能別権限管理例
export interface FeaturePermissions {
  realtime_analysis: boolean;
  historical_data: boolean;
  telegram_notifications: boolean;
  advanced_indicators: boolean;
  api_integration: boolean;
  bulk_operations: boolean;
  data_export: boolean;
}
```

ただし、**現バージョンではこれらの拡張機能は実装せず**、シンプルなTRIAL_USERのみのアクセス制御を維持します。

## 10. まとめ

AWAKEN2のアクセス制御マトリックスは、以下の原則に基づいて設計されています：

1. **シンプルさを最優先**: 2つのロール（TRIAL_USER、ANONYMOUS）のみ
2. **全機能へのアクセス**: トライアルユーザーは制限なく全機能を利用可能
3. **セキュリティの基本**: 認証・未認証の明確な分離
4. **データ分離**: ユーザーIDベースの自動的なデータ分離
5. **拡張性**: 将来的な機能追加・権限管理の拡張に対応可能

この設計により、開発効率を維持しながら、必要最小限のセキュリティを確保し、将来の拡張にも対応できるアクセス制御システムを実現します。