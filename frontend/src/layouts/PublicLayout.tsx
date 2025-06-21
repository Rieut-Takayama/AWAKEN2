import React, { useEffect } from 'react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
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

      const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
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

  return (
    <div className="public-layout">
      {/* ミニマルヘッダー */}
      <header className="public-header" style={{
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
          animation: 'glow 2s ease-in-out infinite alternate'
        }}>
          AWAKEN2
        </h1>
        <nav>
          {/* 必要に応じて追加のナビゲーション */}
        </nav>
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

export default PublicLayout;