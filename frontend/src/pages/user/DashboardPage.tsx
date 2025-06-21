import React, { useState, useEffect } from 'react';
import { analysisService } from '@/services';
import { RealtimeAnalysis } from '@/types';

const DashboardPage: React.FC = () => {
  const [currencies, setCurrencies] = useState<RealtimeAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [newSymbol, setNewSymbol] = useState('');
  const [error, setError] = useState('');

  // @MOCK_TO_API: analysisService.getRealtimeData()に置き換え
  const fetchRealtimeData = async () => {
    try {
      setLoading(true);
      const data = await analysisService.getRealtimeData();
      setCurrencies(data);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      console.error('リアルタイムデータ取得エラー:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 初期データ読み込み
  useEffect(() => {
    fetchRealtimeData();
  }, []);

  // 5秒ごとの自動更新
  useEffect(() => {
    const interval = setInterval(fetchRealtimeData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddCurrency = () => {
    const symbol = newSymbol.trim().toUpperCase();
    
    if (!symbol) {
      alert('通貨ペアを入力してください');
      return;
    }
    
    if (currencies.length >= 3) {
      alert(`監視可能な銘柄数の上限（3銘柄）に達しています。\n他の銘柄を削除してから追加してください。`);
      return;
    }
    
    if (currencies.some(currency => currency.symbol === symbol)) {
      alert('この通貨は既に監視中です');
      return;
    }
    
    // @MOCK_DATA: ハードコードされたサンプルデータ
    const newCurrency: RealtimeAnalysis = {
      symbol: symbol,
      name: symbol.replace('USDT', ''),
      price: Math.random() * 1000 + 1,
      score: Math.floor(Math.random() * 40) + 50,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      change: (Math.random() * 6 - 3).toFixed(1) + '%',
      lastUpdated: new Date()
    };
    
    setCurrencies(prev => [...prev, newCurrency]);
    setNewSymbol('');
  };

  const handleRemoveCurrency = (symbol: string) => {
    setCurrencies(prev => prev.filter(currency => currency.symbol !== symbol));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCurrency();
    }
  };

  // 高スコア通貨の存在確認
  const hasHighScore = currencies.some(currency => currency.score >= 75);
  
  // スコア順でソート
  const sortedCurrencies = [...currencies].sort((a, b) => b.score - a.score);

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
        リアルタイム分析ダッシュボード
      </h1>
      
      {/* 高スコアアラート */}
      {hasHighScore && (
        <div style={{
          background: 'rgba(255, 0, 64, 0.1)',
          border: '1px solid var(--danger-red)',
          borderRadius: '4px',
          padding: '1rem',
          marginBottom: '2rem',
          textAlign: 'center',
          color: 'var(--danger-red)',
          fontFamily: 'Roboto Mono, monospace',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          animation: 'blink 1.5s infinite'
        }}>
          <strong>⚠ 投資チャンス検出 ⚠</strong><br />買い度指数75点以上の通貨があります
        </div>
      )}

      {/* 通貨追加セクション */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid var(--matrix-green)',
        borderRadius: '4px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 0 20px rgba(0, 255, 65, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            className="input-matrix"
            placeholder="通貨ペアを入力 (例: BTCUSDT) ※最大3銘柄まで"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{ flex: 1, minWidth: '250px' }}
          />
          <button
            className="btn-matrix"
            onClick={handleAddCurrency}
            style={{ whiteSpace: 'nowrap' }}
          >
            監視追加 ({currencies.length}/3)
          </button>
        </div>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div style={{
          background: 'rgba(255, 0, 64, 0.1)',
          border: '1px solid var(--danger-red)',
          borderRadius: '4px',
          padding: '1rem',
          marginBottom: '2rem',
          color: 'var(--danger-red)',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* 通貨グリッド */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {sortedCurrencies.map(currency => {
          let cardStyle = {
            background: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid var(--matrix-green)',
            borderRadius: '4px',
            padding: '1.5rem',
            boxShadow: '0 0 20px rgba(0, 255, 65, 0.1)',
            transition: 'all 0.3s ease',
            position: 'relative' as const,
            overflow: 'hidden' as const
          };
          
          if (currency.score >= 75) {
            cardStyle.border = '1px solid var(--danger-red)';
            cardStyle.boxShadow = '0 0 30px rgba(255, 0, 64, 0.3)';
          } else if (currency.score >= 60) {
            cardStyle.border = '1px solid var(--warning-orange)';
            cardStyle.boxShadow = '0 0 20px rgba(255, 170, 0, 0.2)';
          }
          
          return (
            <div key={currency.symbol} style={cardStyle}>
              {/* 削除ボタン */}
              <button
                onClick={() => handleRemoveCurrency(currency.symbol)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(255, 0, 64, 0.2)',
                  border: '1px solid var(--danger-red)',
                  borderRadius: '2px',
                  width: '25px',
                  height: '25px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  color: 'var(--danger-red)',
                  fontSize: '12px'
                }}
              >
                ×
              </button>
              
              {/* 通貨情報 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: 'var(--matrix-green)',
                  textShadow: '0 0 5px var(--matrix-green)'
                }}>
                  {currency.name}
                </div>
                <div style={{
                  fontFamily: 'Roboto Mono, monospace',
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: 'var(--matrix-green)'
                }}>
                  ${currency.price.toLocaleString()}
                </div>
              </div>
              
              {/* スコア表示 */}
              <div style={{
                textAlign: 'center',
                margin: '1rem 0'
              }}>
                <div style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '3.5rem',
                  fontWeight: 900,
                  marginBottom: '0.5rem',
                  color: currency.score >= 75 ? 'var(--danger-red)' : currency.score >= 60 ? 'var(--warning-orange)' : 'var(--matrix-green)',
                  textShadow: `0 0 ${currency.score >= 75 ? '15px var(--danger-red)' : currency.score >= 60 ? '10px var(--warning-orange)' : '10px var(--matrix-green)'}`
                }}>
                  {currency.score}
                </div>
                <div style={{
                  fontFamily: 'Roboto Mono, monospace',
                  fontSize: '0.8rem',
                  opacity: 0.8,
                  color: 'var(--matrix-green)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  買い度指数
                </div>
              </div>
              
              {/* トレンド表示 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '1rem',
                fontFamily: 'Roboto Mono, monospace',
                fontWeight: 500,
                color: currency.trend === 'up' ? 'var(--matrix-green)' : 'var(--danger-red)'
              }}>
                <span>{currency.trend === 'up' ? '▲' : '▼'}</span>
                <span>{currency.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 最終更新時刻 */}
      <div style={{
        textAlign: 'center',
        color: 'rgba(0, 255, 65, 0.6)',
        fontFamily: 'Roboto Mono, monospace',
        fontSize: '0.8rem',
        marginTop: '2rem',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        最終更新: {lastUpdated.toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })}
        {loading && (
          <span style={{ marginLeft: '1rem' }}>
            <div className="loading-spinner" style={{
              display: 'inline-block',
              marginLeft: '10px'
            }}></div>
          </span>
        )}
      </div>
      
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
          リアルタイムデータはモックで生成されています<br />
          5秒ごとに自動更新 | 最大3銘柄まで監視可能
        </div>
      )}
    </div>
  );
};

export default DashboardPage;