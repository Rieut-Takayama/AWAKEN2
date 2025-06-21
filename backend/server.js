const express = require('express');
const path = require('path');
const app = express();

// 静的ファイルを配信
app.use(express.static(path.join(__dirname, 'public')));

// APIエンドポイント
app.get('/api/system/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.post('/api/auth/trial-login', express.json(), (req, res) => {
  const { passkey } = req.body;
  const validKeys = ['TRIAL2025', 'AWAKEN2'];
  
  if (validKeys.includes(passkey)) {
    res.json({
      success: true,
      token: 'dummy-token',
      expires: Date.now() + 86400000,
      user: { id: 1, trial: true }
    });
  } else {
    res.status(401).json({
      success: false,
      error: '無効なトライアルキーです'
    });
  }
});

// SPAのために全てのルートをindex.htmlに
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});