import React, { useEffect } from 'react';
import AppRouter from './routes';

const App: React.FC = () => {
  useEffect(() => {
    // モックデータ使用中バナーの表示
    // @MOCK_UI: モック表示要素
    if (process.env.NODE_ENV === 'development') {
      const banner = document.createElement('div');
      banner.className = 'mock-banner';
      banner.textContent = '⚠️ モックデータ使用中 - 本番環境では使用不可';
      document.body.appendChild(banner);
      document.body.classList.add('has-mock-banner');
      
      return () => {
        document.body.removeChild(banner);
        document.body.classList.remove('has-mock-banner');
      };
    }
  }, []);

  return <AppRouter />;
};

export default App;