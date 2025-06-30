// シンプルなサーバー起動ファイル
const app = require('./dist/app.simple.js');

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`✅ AWAKEN2 Server is running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});