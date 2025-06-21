const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// 静的ファイルの配信
app.use(express.static(path.join(__dirname, 'dist')));

// すべてのルートをindex.htmlにリダイレクト（SPA対応）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server is running on port ${PORT}`);
});