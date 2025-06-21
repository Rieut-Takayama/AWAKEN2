import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [passkey, setPasskey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passkeyError, setPasskeyError] = useState('');

  const validatePasskey = (): boolean => {
    const trimmedKey = passkey.trim();
    
    if (!trimmedKey || trimmedKey.length < 6) {
      setPasskeyError('有効なキーを入力してください');
      return false;
    } else {
      setPasskeyError('');
      return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasskey()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // @MOCK_TO_API: authService.trialLogin()に置き換え
      const success = await login(passkey.trim());
      
      if (success) {
        // ダッシュボードへリダイレクト
        navigate('/');
      } else {
        throw new Error('無効なキーです');
      }
    } catch (err) {
      console.error('ログインエラー:', err);
      setError('アクセス拒否 - 無効なキー');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  // デモ用のトライアルキー自動入力（開発用）
  const handleDemoKey = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      setPasskey('TRIAL2025');
    }
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleDemoKey as any);
    return () => {
      document.removeEventListener('keydown', handleDemoKey as any);
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div className="login-container" style={{
        background: 'var(--bg-transparent)',
        border: '1px solid var(--matrix-green)',
        borderRadius: '4px',
        padding: '3rem',
        boxShadow: '0 0 30px rgba(0, 255, 65, 0.3)',
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        zIndex: 10,
        backdropFilter: 'blur(10px)'
      }}>
        <div className="logo" style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: '2.5rem',
            fontWeight: 900,
            color: 'var(--matrix-green)',
            textShadow: '0 0 20px var(--matrix-green)',
            animation: 'glow 2s ease-in-out infinite alternate',
            margin: 0,
            letterSpacing: '3px'
          }}>
            AWAKEN2
          </h1>
          <p style={{
            color: 'rgba(0, 255, 65, 0.7)',
            fontSize: '0.9rem',
            margin: '0.5rem 0 0 0',
            fontFamily: 'Roboto Mono, monospace',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            無料トライアル版
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="input-field" style={{
            marginBottom: '1.5rem',
            position: 'relative'
          }}>
            <label htmlFor="passkey" style={{
              color: 'rgba(0, 255, 65, 0.7)',
              fontSize: '0.9rem',
              fontFamily: 'Roboto Mono, monospace',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '0.5rem',
              display: 'block'
            }}>
              トライアルキー
            </label>
            <input
              id="passkey"
              type="text"
              className="input-matrix"
              required
              autoComplete="off"
              placeholder="トライアルキーを入力"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              onBlur={validatePasskey}
              onKeyPress={handleKeyPress}
              autoFocus
            />
            {passkeyError && (
              <div style={{
                color: 'var(--danger-red)',
                fontSize: '0.8rem',
                marginTop: '0.5rem',
                fontFamily: 'Roboto Mono, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {passkeyError}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            className="btn-matrix"
            disabled={loading}
            style={{
              width: '100%',
              fontSize: '1rem',
              letterSpacing: '1px',
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '認証中...' : 'システムアクセス'}
          </button>
          
          {loading && (
            <div style={{
              textAlign: 'center',
              marginTop: '1rem',
              color: 'var(--matrix-green)',
              fontFamily: 'Roboto Mono, monospace',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              <div className="loading-spinner" style={{
                display: 'inline-block',
                marginRight: '1rem'
              }}></div>
              {'>>> 認証中...'}
            </div>
          )}
          
          {error && (
            <div style={{
              color: 'var(--danger-red)',
              fontSize: '0.8rem',
              textAlign: 'center',
              marginTop: '16px',
              fontFamily: 'Roboto Mono, monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {error}
            </div>
          )}
        </form>
        
        {/* @MOCK_UI: モック使用時のみ表示するUI要素 */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(255, 170, 0, 0.1)',
            border: '1px solid var(--warning-orange)',
            borderRadius: '4px',
            fontSize: '0.8rem',
            color: 'var(--warning-orange)',
            textAlign: 'center'
          }}>
            <strong>開発モード</strong><br />
            トライアルキー: TRIAL2025, AWAKEN2<br />
            Ctrl+D でデモキー自動入力
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;