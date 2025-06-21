import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface UserLayoutProps {
  children: React.ReactNode;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  useEffect(() => {
    // Matrix rain effect
    const createMatrixRain = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      canvas.className = 'matrix-rain';
      document.body.appendChild(canvas);

      const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン暗号解析投資仮想通貨買売分析';
      const fontSize = 14;
      const columns = canvas.width / fontSize;
      const drops: number[] = [];

      for (let i = 0; i < columns; i++) {
        drops[i] = 1;
      }

      const draw = () => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#00ff41';
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
          const text = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);

          if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
      };

      const interval = setInterval(draw, 35);
      
      return () => {
        clearInterval(interval);
        document.body.removeChild(canvas);
      };
    };

    const cleanup = createMatrixRain();
    
    const handleResize = () => {
      const canvas = document.querySelector('.matrix-rain') as HTMLCanvasElement;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cleanup?.();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="user-layout">
      {/* 認証後ヘッダー */}
      <header className="user-header" style={{
        background: 'rgba(0, 0, 0, 0.9)',
        borderBottom: '2px solid var(--matrix-green)',
        boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backdropFilter: 'blur(10px)'
      }}>
        <h1 className="logo" style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: '1.8rem',
          fontWeight: 900,
          color: 'var(--matrix-green)',
          textShadow: '0 0 10px var(--matrix-green)',
          animation: 'glow 2s ease-in-out infinite alternate',
          cursor: 'pointer'
        }} onClick={() => navigate('/')}>
          AWAKEN2
        </h1>

        <div className="header-info" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem'
        }}>
          {/* 現在スコア表示 */}
          <div className="current-score" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1.1rem',
            fontWeight: 500,
            color: 'var(--matrix-green)'
          }}>
            <span>最高スコア:</span>
            <span className="score-badge" style={{
              background: 'rgba(0, 255, 65, 0.2)',
              color: 'var(--matrix-green)',
              border: '1px solid var(--matrix-green)',
              padding: '0.3rem 0.8rem',
              borderRadius: '4px',
              fontWeight: 700,
              fontFamily: 'Orbitron, monospace',
              textShadow: '0 0 5px var(--matrix-green)'
            }}>
              {/* @MOCK_DATA: ハードコードされたサンプルデータ */}
              82
            </span>
          </div>

          {/* 通知状態アイコン */}
          <div className="notification-icon" style={{
            position: 'relative',
            cursor: 'pointer',
            color: 'var(--matrix-green)',
            fontSize: '1.5rem'
          }}>
            <span>🔔</span>
            <div className="notification-dot" style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              width: '8px',
              height: '8px',
              background: 'var(--danger-red)',
              borderRadius: '50%',
              animation: 'pulse 1s infinite'
            }}></div>
          </div>

          {/* ナビゲーションメニュー */}
          <nav className="nav-menu" style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center'
          }}>
            <button 
              className={`nav-item ${isActivePath('/') ? 'active' : ''}`}
              onClick={() => navigate('/')}
              style={{
                background: 'none',
                border: 'none',
                color: isActivePath('/') ? 'var(--matrix-green)' : 'rgba(0, 255, 65, 0.7)',
                textDecoration: 'none',
                fontWeight: 500,
                textTransform: 'uppercase',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                fontFamily: 'Roboto Mono, monospace',
                textShadow: isActivePath('/') ? '0 0 10px var(--matrix-green)' : 'none'
              }}
            >
              ダッシュボード
            </button>
            <button 
              className={`nav-item ${isActivePath('/settings') ? 'active' : ''}`}
              onClick={() => navigate('/settings')}
              style={{
                background: 'none',
                border: 'none',
                color: isActivePath('/settings') ? 'var(--matrix-green)' : 'rgba(0, 255, 65, 0.7)',
                textDecoration: 'none',
                fontWeight: 500,
                textTransform: 'uppercase',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                fontFamily: 'Roboto Mono, monospace',
                textShadow: isActivePath('/settings') ? '0 0 10px var(--matrix-green)' : 'none'
              }}
            >
              通知設定
            </button>
            <button 
              className={`nav-item ${isActivePath('/history') ? 'active' : ''}`}
              onClick={() => navigate('/history')}
              style={{
                background: 'none',
                border: 'none',
                color: isActivePath('/history') ? 'var(--matrix-green)' : 'rgba(0, 255, 65, 0.7)',
                textDecoration: 'none',
                fontWeight: 500,
                textTransform: 'uppercase',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                fontFamily: 'Roboto Mono, monospace',
                textShadow: isActivePath('/history') ? '0 0 10px var(--matrix-green)' : 'none'
              }}
            >
              履歴
            </button>
            
            {/* ログアウトボタン */}
            <button 
              className="logout-btn"
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 0, 64, 0.2)',
                color: 'var(--danger-red)',
                border: '1px solid var(--danger-red)',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500,
                fontFamily: 'Roboto Mono, monospace',
                textTransform: 'uppercase',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 64, 0.4)';
                e.currentTarget.style.boxShadow = '0 0 10px var(--danger-red)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 64, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              ログアウト
            </button>
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main style={{
        position: 'relative',
        zIndex: 10,
        minHeight: 'calc(100vh - 80px)'
      }}>
        {children}
      </main>
    </div>
  );
};

export default UserLayout;