import React from 'react';

const HistoryPage: React.FC = () => {
  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      position: 'relative',
      zIndex: 10
    }}>
      <h1 style={{
        textAlign: 'center',
        color: 'var(--matrix-green)',
        fontFamily: 'Orbitron, monospace',
        fontSize: '2.5rem',
        fontWeight: 700,
        marginBottom: '3rem',
        textShadow: '0 0 20px var(--matrix-green)',
        textTransform: 'uppercase',
        letterSpacing: '3px'
      }}>
        U-003 分析履歴ページ
      </h1>
      
      <div className="card-matrix">
        <p style={{ textAlign: 'center', opacity: 0.8 }}>
          実装予定：分析履歴表示
        </p>
      </div>
    </div>
  );
};

export default HistoryPage;