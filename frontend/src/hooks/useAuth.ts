import { useState, useEffect } from 'react';
import { authService } from '@/services';

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  user: {
    trial: boolean;
    id: number;
  } | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    loading: true,
    user: null
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('trial_token');
      if (!token) {
        setAuthState({
          isAuthenticated: false,
          loading: false,
          user: null
        });
        return;
      }

      // 実APIでトークン検証
      const user = await authService.verify();
      setAuthState({
        isAuthenticated: true,
        loading: false,
        user: {
          trial: user.isTrialUser,
          id: parseInt(user.id)
        }
      });
    } catch (error) {
      console.error('認証状態確認エラー:', error);
      // 認証エラーの場合はログアウト状態に
      setAuthState({
        isAuthenticated: false,
        loading: false,
        user: null
      });
      // トークンが無効な場合はクリア
      localStorage.removeItem('trial_token');
      localStorage.removeItem('trial_expires');
    }
  };

  const login = async (passkey: string): Promise<boolean> => {
    try {
      // 実APIでトライアル認証
      const response = await authService.trialLogin({ passkey });
      
      if (response.success) {
        setAuthState({
          isAuthenticated: true,
          loading: false,
          user: {
            trial: response.user.trial,
            id: response.user.id
          }
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('ログインエラー:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // 実APIでログアウト処理
      await authService.logout();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      // エラーが発生してもローカル状態はリセット
      setAuthState({
        isAuthenticated: false,
        loading: false,
        user: null
      });
    }
  };

  return {
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    user: authState.user,
    login,
    logout,
    checkAuthStatus
  };
};