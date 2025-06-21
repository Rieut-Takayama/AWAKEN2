import React, { useState, useEffect } from 'react';
import { notificationsService } from '@/services';
import { NotificationSettings, VALIDATION } from '@/types';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    scoreThreshold: 75,
    interval: 60,
    methods: ['telegram', 'browser'],
    telegramChatId: undefined,
    enabled: true
  });
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [chatIdValidation, setChatIdValidation] = useState('');
  const [testResult, setTestResult] = useState('');
  // const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['BTCUSDT', 'ETHUSDT']);
  // const [customSymbol, setCustomSymbol] = useState('');
  
  // @MOCK_TO_API: notificationsService.getSettings()に置き換え
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await notificationsService.getSettings();
        setSettings(data);
        if (data.telegramChatId) {
          setTelegramChatId(data.telegramChatId);
        }
      } catch (error) {
        console.error('設定読み込みエラー:', error);
      }
    };
    loadSettings();
  }, []);

  const validateChatId = (chatId: string): boolean => {
    const pattern = /^-?\d+$/;
    return pattern.test(chatId) && chatId.length >= 8;
  };

  const handleChatIdChange = (value: string) => {
    setTelegramChatId(value);
    
    if (value === '') {
      setChatIdValidation('');
      return;
    }
    
    if (validateChatId(value.trim())) {
      setChatIdValidation('✅ 有効なチャットID形式です');
    } else {
      setChatIdValidation('❌ 無効なチャットID形式です（例: 123456789）');
    }
  };

  const handleTestNotification = async () => {
    const chatId = telegramChatId.trim();
    
    if (!validateChatId(chatId)) {
      setTestResult('❌ 有効なチャットIDを入力してください');
      return;
    }
    
    setTestResult('📡 送信中...');
    
    try {
      // @MOCK_TO_API: notificationsService.sendTestNotification()に置き換え
      await notificationsService.sendTestNotification({
        chatId,
        method: 'telegram'
      });
      
      setTestResult('🎉 テスト通知が正常に送信されました！テレグラムをご確認ください。');
    } catch (error) {
      setTestResult('⚠️ 通知送信に失敗しました。チャットIDを確認するか、ボットをブロックしていないかご確認ください。');
    }
  };

  // シンプル化のためにコメントアウト
  // const handleSymbolToggle = (symbol: string) => { ... };
  // const handleAddCustomSymbol = () => { ... };
  // const handleRemoveSymbol = (symbol: string) => { ... };

  const handleSave = async () => {
    setLoading(true);
    setSaveMessage('');
    
    try {
      // @MOCK_TO_API: notificationsService.updateSettings()に置き換え
      await notificationsService.updateSettings({
        ...settings,
        telegramChatId: telegramChatId.trim() || undefined
      });
      
      setSaveMessage('設定が正常に保存されました');
      
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    } catch (error) {
      console.error('設定保存エラー:', error);
      setSaveMessage('設定の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // コピー成功表示は簡略化
    });
  };

  // const predefinedSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 'DOTUSDT'];

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
        通知設定
      </h1>
      
      {/* 買い度スコア闾値設定 */}
      <div className="card-matrix">
        <h2 style={{
          color: 'var(--matrix-green)',
          fontFamily: 'Orbitron, monospace',
          fontSize: '1.3rem',
          fontWeight: 700,
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          textShadow: '0 0 10px var(--matrix-green)'
        }}>
          {'> 買い度スコア閾値'}
        </h2>
        
        <div style={{
          background: 'rgba(0, 255, 65, 0.05)',
          border: '1px solid var(--matrix-green)',
          borderRadius: '4px',
          padding: '2rem',
          textAlign: 'center',
          marginBottom: '1rem'
        }}>
          <div style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: '4rem',
            fontWeight: 900,
            color: 'var(--matrix-green)',
            textShadow: '0 0 20px var(--matrix-green)',
            marginBottom: '0.5rem'
          }}>
            {settings.scoreThreshold}
          </div>
          <div style={{
            color: 'rgba(0, 255, 65, 0.8)',
            fontSize: '1.1rem',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            点以上で通知
          </div>
          
          <div style={{ margin: '2rem 0' }}>
            <input
              type="range"
              min={VALIDATION.SCORE_THRESHOLD.MIN}
              max={VALIDATION.SCORE_THRESHOLD.MAX}
              value={settings.scoreThreshold}
              step={VALIDATION.SCORE_THRESHOLD.STEP}
              onChange={(e) => setSettings(prev => ({ ...prev, scoreThreshold: parseInt(e.target.value) }))}
              style={{
                width: '100%',
                height: '4px',
                background: 'rgba(0, 255, 65, 0.3)',
                borderRadius: '2px',
                outline: 'none',
                WebkitAppearance: 'none',
                cursor: 'pointer'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '0.5rem',
              fontSize: '0.9rem',
              color: 'rgba(0, 255, 65, 0.7)'
            }}>
              <span>{VALIDATION.SCORE_THRESHOLD.MIN}</span>
              <span>{VALIDATION.SCORE_THRESHOLD.DEFAULT}</span>
              <span>{VALIDATION.SCORE_THRESHOLD.MAX}</span>
            </div>
          </div>
        </div>
        
        <div style={{
          background: 'rgba(255, 170, 0, 0.1)',
          border: '1px solid var(--warning-orange)',
          borderRadius: '4px',
          padding: '1rem',
          marginTop: '1rem'
        }}>
          <div style={{
            color: 'var(--warning-orange)',
            fontWeight: 500,
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            fontSize: '0.9rem',
            letterSpacing: '1px'
          }}>
            推奨設定
          </div>
          <div style={{
            color: 'rgba(255, 170, 0, 0.8)',
            fontSize: '0.9rem',
            lineHeight: 1.4
          }}>
            初心者: 75点 | 経験者: 80点以上 | 過去30日間 75点設定で 78%的中率
          </div>
        </div>
      </div>

      {/* 通知間隔設定 */}
      <div className="card-matrix">
        <h2 style={{
          color: 'var(--matrix-green)',
          fontFamily: 'Orbitron, monospace',
          fontSize: '1.3rem',
          fontWeight: 700,
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          textShadow: '0 0 10px var(--matrix-green)'
        }}>
          {'> 通知間隔設定'}
        </h2>
        
        <div style={{
          background: 'rgba(0, 255, 65, 0.05)',
          border: '1px solid var(--matrix-green)',
          borderRadius: '4px',
          padding: '2rem',
          textAlign: 'center',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <span style={{
              fontFamily: 'Orbitron, monospace',
              fontSize: '4rem',
              fontWeight: 900,
              color: 'var(--matrix-green)',
              textShadow: '0 0 20px var(--matrix-green)'
            }}>
              {settings.interval}
            </span>
            <span style={{
              fontSize: '1.5rem',
              color: 'var(--matrix-green)',
              fontWeight: 500,
              textTransform: 'uppercase'
            }}>
              分
            </span>
          </div>
          <div style={{
            color: 'rgba(0, 255, 65, 0.8)',
            fontSize: '1.1rem',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            同じ銘柄の次回通知まで
          </div>
          
          <div style={{ margin: '2rem 0' }}>
            <input
              type="range"
              min={VALIDATION.NOTIFICATION_INTERVAL.MIN}
              max={VALIDATION.NOTIFICATION_INTERVAL.MAX}
              value={settings.interval}
              step={VALIDATION.NOTIFICATION_INTERVAL.STEP}
              onChange={(e) => setSettings(prev => ({ ...prev, interval: parseInt(e.target.value) }))}
              style={{
                width: '100%',
                height: '4px',
                background: 'rgba(0, 255, 65, 0.3)',
                borderRadius: '2px',
                outline: 'none',
                WebkitAppearance: 'none',
                cursor: 'pointer'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '0.5rem',
              fontSize: '0.9rem',
              color: 'rgba(0, 255, 65, 0.7)'
            }}>
              <span>{VALIDATION.NOTIFICATION_INTERVAL.MIN}分</span>
              <span>{VALIDATION.NOTIFICATION_INTERVAL.DEFAULT}分</span>
              <span>{VALIDATION.NOTIFICATION_INTERVAL.MAX}分</span>
            </div>
          </div>
        </div>
        
        <div style={{
          background: 'rgba(255, 170, 0, 0.1)',
          border: '1px solid var(--warning-orange)',
          borderRadius: '4px',
          padding: '1rem',
          marginTop: '1rem'
        }}>
          <div style={{
            color: 'var(--warning-orange)',
            fontWeight: 500,
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            fontSize: '0.9rem',
            letterSpacing: '1px'
          }}>
            推奨設定
          </div>
          <div style={{
            color: 'rgba(255, 170, 0, 0.8)',
            fontSize: '0.9rem',
            lineHeight: 1.4
          }}>
            短期取引: 30分 | スイング取引: 60分以上 | 重複通知防止で冷静な判断をサポート
          </div>
        </div>
      </div>

      {/* テレグラム通知設定 */}
      <div className="card-matrix">
        <h2 style={{
          color: 'var(--matrix-green)',
          fontFamily: 'Orbitron, monospace',
          fontSize: '1.3rem',
          fontWeight: 700,
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          textShadow: '0 0 10px var(--matrix-green)'
        }}>
          {'> テレグラム通知設定'}
        </h2>
        
        {/* ステータス表示 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1.5rem',
          background: 'rgba(0, 255, 65, 0.05)',
          border: '1px solid rgba(0, 255, 65, 0.3)',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <div style={{ fontSize: '2rem', color: 'var(--matrix-green)' }}>⚡</div>
          <div style={{ flex: 1 }}>
            <div style={{
              color: 'var(--matrix-green)',
              fontWeight: 500,
              fontSize: '1.1rem',
              marginBottom: '0.25rem'
            }}>
              テレグラム通知
            </div>
            <div style={{
              color: 'rgba(0, 255, 65, 0.7)',
              fontSize: '0.9rem'
            }}>
              {telegramChatId && validateChatId(telegramChatId) ? `設定完了 - チャットID: ${telegramChatId}` : '未設定 - 設定を開始してください'}
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: telegramChatId && validateChatId(telegramChatId) ? 'var(--matrix-green)' : 'var(--danger-red)',
              animation: 'pulse 2s infinite'
            }}></span>
            <span style={{
              color: 'rgba(0, 255, 65, 0.7)',
              fontSize: '0.9rem',
              textTransform: 'uppercase'
            }}>
              {telegramChatId && validateChatId(telegramChatId) ? '接続済み' : '未接続'}
            </span>
          </div>
        </div>
        
        {/* 設定手順 */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            color: 'var(--matrix-green)',
            fontSize: '1.2rem',
            fontWeight: 500,
            marginBottom: '1.5rem',
            textAlign: 'center',
            textShadow: '0 0 10px var(--matrix-green)'
          }}>
            📱 テレグラム通知の設定手順
          </div>
          
          {/* ステップ 1 */}
          <div style={{
            background: 'rgba(0, 255, 65, 0.05)',
            border: '1px solid rgba(0, 255, 65, 0.3)',
            borderRadius: '8px',
            marginBottom: '1rem',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderBottom: '1px solid rgba(0, 255, 65, 0.3)'
            }}>
              <div style={{
                background: 'var(--matrix-green)',
                color: '#000',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.1rem'
              }}>
                1
              </div>
              <div style={{
                color: 'var(--matrix-green)',
                fontWeight: 500,
                fontSize: '1.1rem'
              }}>
                AWAKEN2ボットを開始
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{
                color: 'rgba(0, 255, 65, 0.8)',
                marginBottom: '1rem',
                lineHeight: 1.5
              }}>
                下のボタンをクリックしてテレグラムでAWAKEN2ボットを開きます
              </p>
              <button
                onClick={() => window.open('https://t.me/AWAKEN2_bot', '_blank')}
                style={{
                  background: 'rgba(0, 136, 204, 0.2)',
                  color: '#0088cc',
                  border: '1px solid #0088cc',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'Roboto Mono, monospace',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  transition: 'all 0.3s ease'
                }}
              >
                📱 @AWAKEN2_bot を開く
              </button>
              <div style={{
                color: 'rgba(0, 255, 65, 0.6)',
                fontSize: '0.8rem',
                marginTop: '0.5rem',
                fontStyle: 'italic'
              }}>
                ※ テレグラムアプリがインストールされている必要があります
              </div>
            </div>
          </div>
          
          {/* ステップ 2 */}
          <div style={{
            background: 'rgba(0, 255, 65, 0.05)',
            border: '1px solid rgba(0, 255, 65, 0.3)',
            borderRadius: '8px',
            marginBottom: '1rem',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderBottom: '1px solid rgba(0, 255, 65, 0.3)'
            }}>
              <div style={{
                background: 'var(--matrix-green)',
                color: '#000',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.1rem'
              }}>
                2
              </div>
              <div style={{
                color: 'var(--matrix-green)',
                fontWeight: 500,
                fontSize: '1.1rem'
              }}>
                /start コマンドを送信
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{
                color: 'rgba(0, 255, 65, 0.8)',
                marginBottom: '1rem',
                lineHeight: 1.5
              }}>
                ボットのチャットで以下のコマンドを送信してください
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid var(--matrix-green)',
                borderRadius: '4px',
                padding: '0.75rem',
                margin: '1rem 0'
              }}>
                <code style={{
                  color: 'var(--matrix-green)',
                  fontFamily: 'Roboto Mono, monospace',
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  flex: 1
                }}>
                  /start
                </code>
                <button
                  onClick={() => copyToClipboard('/start')}
                  style={{
                    background: 'rgba(0, 255, 65, 0.1)',
                    color: 'var(--matrix-green)',
                    border: '1px solid var(--matrix-green)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  📋 コピー
                </button>
              </div>
              <div style={{
                color: 'rgba(0, 255, 65, 0.6)',
                fontSize: '0.8rem',
                fontStyle: 'italic'
              }}>
                ボットから「チャットID: 123456789」のような返信が来ます
              </div>
            </div>
          </div>
          
          {/* ステップ 3 */}
          <div style={{
            background: 'rgba(0, 255, 65, 0.05)',
            border: '1px solid rgba(0, 255, 65, 0.3)',
            borderRadius: '8px',
            marginBottom: '1rem',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderBottom: '1px solid rgba(0, 255, 65, 0.3)'
            }}>
              <div style={{
                background: 'var(--matrix-green)',
                color: '#000',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.1rem'
              }}>
                3
              </div>
              <div style={{
                color: 'var(--matrix-green)',
                fontWeight: 500,
                fontSize: '1.1rem'
              }}>
                チャットIDを入力
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{
                color: 'rgba(0, 255, 65, 0.8)',
                marginBottom: '1rem',
                lineHeight: 1.5
              }}>
                ボットから送信されたチャットIDを下の欄に入力してください
              </p>
              <div style={{ margin: '1rem 0' }}>
                <input
                  type="text"
                  placeholder="例: 123456789"
                  value={telegramChatId}
                  onChange={(e) => handleChatIdChange(e.target.value)}
                  className="input-matrix"
                  style={{
                    borderColor: chatIdValidation.includes('✅') ? '#28a745' : chatIdValidation.includes('❌') ? 'var(--danger-red)' : 'var(--matrix-green)'
                  }}
                />
                {chatIdValidation && (
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.8rem',
                    color: chatIdValidation.includes('✅') ? '#28a745' : 'var(--danger-red)'
                  }}>
                    {chatIdValidation}
                  </div>
                )}
              </div>
              <div style={{
                color: 'rgba(0, 255, 65, 0.6)',
                fontSize: '0.8rem',
                fontStyle: 'italic'
              }}>
                チャットIDは数字のみ、または負の数値（グループの場合）です
              </div>
            </div>
          </div>
          
          {/* ステップ 4 */}
          <div style={{
            background: 'rgba(0, 255, 65, 0.05)',
            border: '1px solid rgba(0, 255, 65, 0.3)',
            borderRadius: '8px',
            marginBottom: '1rem',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderBottom: '1px solid rgba(0, 255, 65, 0.3)'
            }}>
              <div style={{
                background: 'var(--matrix-green)',
                color: '#000',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.1rem'
              }}>
                4
              </div>
              <div style={{
                color: 'var(--matrix-green)',
                fontWeight: 500,
                fontSize: '1.1rem'
              }}>
                接続テスト
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{
                color: 'rgba(0, 255, 65, 0.8)',
                marginBottom: '1rem',
                lineHeight: 1.5
              }}>
                チャットIDを入力後、テスト通知を送信して接続を確認します
              </p>
              <button
                onClick={handleTestNotification}
                disabled={!telegramChatId || !validateChatId(telegramChatId)}
                style={{
                  background: 'rgba(40, 167, 69, 0.2)',
                  color: '#28a745',
                  border: '1px solid #28a745',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'Roboto Mono, monospace',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  transition: 'all 0.3s ease',
                  opacity: (!telegramChatId || !validateChatId(telegramChatId)) ? 0.5 : 1
                }}
              >
                🔔 テスト通知を送信
              </button>
              {testResult && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  background: testResult.includes('🎉') ? 'rgba(40, 167, 69, 0.1)' : 'rgba(255, 0, 64, 0.1)',
                  border: `1px solid ${testResult.includes('🎉') ? '#28a745' : 'var(--danger-red)'}`,
                  color: testResult.includes('🎉') ? '#28a745' : 'var(--danger-red)'
                }}>
                  {testResult}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* テレグラムの特徴 */}
        <div style={{
          background: 'rgba(0, 255, 65, 0.05)',
          border: '1px solid rgba(0, 255, 65, 0.3)',
          borderRadius: '8px',
          padding: '1.5rem'
        }}>
          <div style={{
            color: 'var(--matrix-green)',
            fontSize: '1.1rem',
            fontWeight: 500,
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            📋 テレグラム通知の特徴
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '4px',
              border: '1px solid rgba(0, 255, 65, 0.2)'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💰</div>
              <div style={{
                color: 'var(--matrix-green)',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                完全無料<br />
                <small style={{
                  color: 'rgba(0, 255, 65, 0.7)',
                  fontSize: '0.7rem',
                  display: 'block',
                  marginTop: '0.25rem'
                }}>
                  APIに制限なし
                </small>
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '4px',
              border: '1px solid rgba(0, 255, 65, 0.2)'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚡</div>
              <div style={{
                color: 'var(--matrix-green)',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                リアルタイム<br />
                <small style={{
                  color: 'rgba(0, 255, 65, 0.7)',
                  fontSize: '0.7rem',
                  display: 'block',
                  marginTop: '0.25rem'
                }}>
                  瞬時に通知
                </small>
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '4px',
              border: '1px solid rgba(0, 255, 65, 0.2)'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📱</div>
              <div style={{
                color: 'var(--matrix-green)',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                マルチデバイス<br />
                <small style={{
                  color: 'rgba(0, 255, 65, 0.7)',
                  fontSize: '0.7rem',
                  display: 'block',
                  marginTop: '0.25rem'
                }}>
                  スマホ・PC対応
                </small>
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '4px',
              border: '1px solid rgba(0, 255, 65, 0.2)'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔒</div>
              <div style={{
                color: 'var(--matrix-green)',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                セキュア<br />
                <small style={{
                  color: 'rgba(0, 255, 65, 0.7)',
                  fontSize: '0.7rem',
                  display: 'block',
                  marginTop: '0.25rem'
                }}>
                  暗号化通信
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 保存セクション */}
      <div style={{
        background: 'rgba(0, 255, 65, 0.05)',
        border: '1px solid var(--matrix-green)',
        borderRadius: '4px',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            background: 'rgba(0, 255, 65, 0.2)',
            color: 'var(--matrix-green)',
            border: '2px solid var(--matrix-green)',
            padding: '1rem 2rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1.1rem',
            fontWeight: 700,
            fontFamily: 'Orbitron, monospace',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            transition: 'all 0.3s ease',
            boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
            opacity: loading ? 0.5 : 1
          }}
        >
          {loading ? '保存中...' : '設定を保存'}
        </button>
        
        {saveMessage && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            borderRadius: '4px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            background: 'rgba(0, 255, 65, 0.1)',
            color: 'var(--matrix-green)',
            border: '1px solid var(--matrix-green)',
            textShadow: '0 0 5px var(--matrix-green)'
          }}>
            {saveMessage}
          </div>
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
          設定はモックサービスに保存されます<br />
          テレグラムテストは80%の成功率でシミュレート
        </div>
      )}
    </div>
  );
};

export default SettingsPage;