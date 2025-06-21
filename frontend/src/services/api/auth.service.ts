import { TrialAuthRequest, TrialAuthResponse, User, API_PATHS } from '@/types';

// APIクライアント設定
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

// APIリクエストヘルパー
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const token = localStorage.getItem('trial_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(response.status, data.message || 'API request failed', data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    console.error('API Request failed:', error);
    throw new ApiError(0, 'ネットワークエラーが発生しました');
  }
}

export const apiAuthService = {
  // トライアルキー認証
  trialLogin: async (request: TrialAuthRequest): Promise<TrialAuthResponse> => {
    try {
      const response = await apiRequest<TrialAuthResponse>(API_PATHS.AUTH.TRIAL_LOGIN, {
        method: 'POST',
        body: JSON.stringify(request),
      });

      // 認証成功時にトークンを保存
      if (response.success && response.token) {
        localStorage.setItem('trial_token', response.token);
        localStorage.setItem('trial_expires', response.expires.toString());
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          throw new Error('無効なトライアルキーです');
        }
        if (error.status === 400) {
          throw new Error('リクエストに不備があります');
        }
      }
      throw new Error('認証処理でエラーが発生しました');
    }
  },

  // JWT トークン検証
  verify: async (): Promise<User> => {
    try {
      const token = localStorage.getItem('trial_token');
      if (!token) {
        throw new Error('認証が必要です');
      }

      return await apiRequest<User>(API_PATHS.AUTH.VERIFY, {
        method: 'GET',
      });
    } catch (error) {
      // 認証エラーの場合はローカルストレージをクリア
      if (error instanceof ApiError && error.status === 401) {
        localStorage.removeItem('trial_token');
        localStorage.removeItem('trial_expires');
        throw new Error('認証の有効期限が切れました');
      }
      throw new Error('認証確認でエラーが発生しました');
    }
  },

  // ログアウト
  logout: async (): Promise<void> => {
    try {
      const token = localStorage.getItem('trial_token');
      if (token) {
        // バックエンドにログアウト通知
        await apiRequest<void>(API_PATHS.AUTH.LOGOUT, {
          method: 'POST',
        });
      }
    } catch (error) {
      console.warn('ログアウト処理でエラーが発生しましたが、ローカル認証情報はクリアします', error);
    } finally {
      // エラーが発生してもローカル認証情報はクリア
      localStorage.removeItem('trial_token');
      localStorage.removeItem('trial_expires');
    }
  }
};