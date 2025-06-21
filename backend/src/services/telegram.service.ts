import axios from 'axios';

interface TelegramMessage {
    chatId: string;
    text: string;
    parseMode?: 'HTML' | 'Markdown';
}

class TelegramService {
    private botToken: string;
    private defaultChatId: string;
    private baseUrl: string;

    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
        this.defaultChatId = process.env.TELEGRAM_CHAT_ID || '';
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    }

    // メッセージ送信
    async sendMessage(message: TelegramMessage): Promise<boolean> {
        try {
            const chatId = message.chatId || this.defaultChatId;
            
            const response = await axios.post(`${this.baseUrl}/sendMessage`, {
                chat_id: chatId,
                text: message.text,
                parse_mode: message.parseMode || 'HTML'
            });

            return response.data.ok === true;
        } catch (error) {
            console.error('Telegram send error:', error);
            return false;
        }
    }

    // 高スコア通知を送信（根拠付き）
    async sendHighScoreAlert(symbol: string, score: number, price: number, change: string, keyFactors?: string[]): Promise<boolean> {
        let message = `
🚨 <b>投資チャンス検出！</b> 🚨

📊 <b>通貨ペア:</b> ${symbol}
🎯 <b>買い度指数:</b> ${score}点
💰 <b>現在価格:</b> $${price.toLocaleString()}
📈 <b>24時間変動:</b> ${change}
`;

        // 判断根拠を追加
        if (keyFactors && keyFactors.length > 0) {
            message += `
🔍 <b>判断根拠:</b>
`;
            keyFactors.forEach(factor => {
                message += `• ${factor}\n`;
                
                // 根拠の根拠を追加
                if (factor.includes('RSI') && factor.includes('売られすぎ')) {
                    message += `  → 過度の売り圧力で反発上昇の可能性\n`;
                } else if (factor.includes('出来高')) {
                    message += `  → 通常より多い取引量で大口投資家の動き\n`;
                } else if (factor.includes('上昇トレンド')) {
                    message += `  → 移動平均線が上向きで勢い継続中\n`;
                } else if (factor.includes('BB下限')) {
                    message += `  → ボリンジャーバンド下限で買い時\n`;
                }
            });
        }
        
        message += `
⚡ AIが高い投資機会を検出しました。
詳細はダッシュボードをご確認ください。

<i>${new Date().toLocaleString('ja-JP')}</i>
`;

        return await this.sendMessage({
            chatId: this.defaultChatId,
            text: message,
            parseMode: 'HTML'
        });
    }

    // 定期レポート送信
    async sendDailyReport(topCurrencies: Array<{symbol: string, score: number, change: string}>): Promise<boolean> {
        let message = `
📊 <b>AWAKEN2 デイリーレポート</b> 📊

<b>本日のトップ3通貨:</b>
`;

        topCurrencies.forEach((currency, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
            message += `
${medal} <b>${currency.symbol}</b>
   買い度: ${currency.score}点 | 変動: ${currency.change}
`;
        });

        message += `
<i>レポート生成: ${new Date().toLocaleString('ja-JP')}</i>
`;

        return await this.sendMessage({
            chatId: this.defaultChatId,
            text: message,
            parseMode: 'HTML'
        });
    }

    // システムアラート送信
    async sendSystemAlert(title: string, description: string): Promise<boolean> {
        const message = `
⚠️ <b>システムアラート</b> ⚠️

<b>${title}</b>

${description}

<i>${new Date().toLocaleString('ja-JP')}</i>
`;

        return await this.sendMessage({
            chatId: this.defaultChatId,
            text: message,
            parseMode: 'HTML'
        });
    }

    // Webhook設定（オプション）
    async setWebhook(url: string): Promise<boolean> {
        try {
            const response = await axios.post(`${this.baseUrl}/setWebhook`, {
                url: url
            });
            return response.data.ok === true;
        } catch (error) {
            console.error('Webhook setup error:', error);
            return false;
        }
    }

    // 接続テスト
    async testConnection(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.baseUrl}/getMe`);
            console.log('Telegram Bot Info:', response.data.result);
            return response.data.ok === true;
        } catch (error) {
            console.error('Telegram connection test failed:', error);
            return false;
        }
    }
    
    // 特定の認証情報で接続テスト
    async testConnectionWithCredentials(token: string, chatId: string): Promise<boolean> {
        try {
            // ボットの有効性を確認
            const botResponse = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
            
            if (!botResponse.data.ok) {
                return false;
            }
            
            // テストメッセージを送信
            const messageResponse = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
                chat_id: chatId,
                text: `✅ AWAKEN2 接続テスト成功！\n\nこのメッセージが表示されていれば、Telegram通知の設定は正常です。\n\n買い度指数が設定値を超えると、このチャットに通知が送信されます。`,
                parse_mode: 'HTML'
            });
            
            return messageResponse.data.ok === true;
        } catch (error) {
            console.error('Telegram connection test with credentials failed:', error);
            return false;
        }
    }
}

export const telegramService = new TelegramService();