const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// 基本的なミドルウェア設定
app.use(cors());
app.use(express.json());

// ヘルスチェックエンドポイント
app.get('/api/system/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'awaken2-backend',
    version: '1.0.0'
  });
});

// ルートエンドポイント
app.get('/', (req, res) => {
  res.json({
    message: 'AWAKEN2 Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
    status: 'running'
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/system/health`);
});