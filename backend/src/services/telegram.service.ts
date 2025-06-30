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
        
        // デバッグログ: 環境変数の確認
        console.log('=== Telegram Service Initialization ===');
        console.log('Bot Token exists:', !!this.botToken);
        console.log('Bot Token length:', this.botToken.length);
        console.log('Chat ID:', this.defaultChatId);
        console.log('Base URL:', this.baseUrl);
    }

    // メッセージ送信
    async sendMessage(message: TelegramMessage): Promise<boolean> {
        try {
            const chatId = message.chatId || this.defaultChatId;
            
            console.log('=== Sending Telegram Message ===');
            console.log('Chat ID:', chatId);
            console.log('Message length:', message.text.length);
            console.log('Parse Mode:', message.parseMode || 'HTML');
            console.log('URL:', `${this.baseUrl}/sendMessage`);
            
            const response = await axios.post(`${this.baseUrl}/sendMessage`, {
                chat_id: chatId,
                text: message.text,
                parse_mode: message.parseMode || 'HTML'
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.data.ok);
            
            if (!response.data.ok) {
                console.error('Telegram API error:', response.data);
            }

            return response.data.ok === true;
        } catch (error: any) {
            console.error('=== Telegram Send Error ===');
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
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

    // 特定の認証情報でメッセージを送信
    async sendMessageWithCredentials(token: string, chatId: string, text: string): Promise<boolean> {
        if (!token || !chatId) {
            console.error('Telegram認証情報が不足しています');
            return false;
        }

        try {
            const response = await axios.post(
                `https://api.telegram.org/bot${token}/sendMessage`,
                {
                    chat_id: chatId,
                    text: text,
                    parse_mode: 'HTML'
                }
            );

            return response.data.ok === true;
        } catch (error: any) {
            console.error('Telegram送信エラー:', error.response?.data || error.message);
            return false;
        }
    }

    // 急落アラート送信（AI分析なし、コスト削減！）
    async sendPriceDropAlert(
        symbol: string, 
        currentPrice: number, 
        previousPrice: number,
        dropPercentage: number,
        timeframe: string = '5分'
    ): Promise<boolean> {
        const message = `
📉 <b>急落アラート！</b> 📉

💎 <b>通貨ペア:</b> ${symbol}
📊 <b>下落率:</b> <b>${dropPercentage.toFixed(2)}%</b> (${timeframe}間)

💰 <b>価格推移:</b>
  前回: $${previousPrice.toLocaleString()} 
  現在: $${currentPrice.toLocaleString()} 

${dropPercentage >= 10 ? '🚨 <b>大幅下落中！底値買いのチャンスかも！</b>' : ''}
${dropPercentage >= 7 && dropPercentage < 10 ? '⚡ <b>急落中！反発の可能性あり</b>' : ''}
${dropPercentage >= 5 && dropPercentage < 7 ? '📊 <b>下落中、様子見推奨</b>' : ''}

💡 <i>これは単純な価格監視通知です。
詳細な分析はダッシュボードでご確認ください。</i>

<i>${new Date().toLocaleString('ja-JP')}</i>
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
            console.log('=== Testing Telegram Connection ===');
            console.log('Test URL:', `${this.baseUrl}/getMe`);
            
            const response = await axios.get(`${this.baseUrl}/getMe`);
            console.log('Bot Info:', response.data.result);
            console.log('Bot Username:', response.data.result?.username);
            console.log('Bot ID:', response.data.result?.id);
            
            return response.data.ok === true;
        } catch (error: any) {
            console.error('=== Telegram Connection Test Failed ===');
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            return false;
        }
    }
    
    // 特定の認証情報で接続テスト
    async testConnectionWithCredentials(token: string, chatId: string): Promise<boolean> {
        try {
            console.log('=== Testing Connection with Credentials ===');
            console.log('Token exists:', !!token);
            console.log('Token length:', token.length);
            console.log('Chat ID:', chatId);
            
            // ボットの有効性を確認
            const botUrl = `https://api.telegram.org/bot${token}/getMe`;
            console.log('Bot validation URL:', botUrl);
            
            const botResponse = await axios.get(botUrl);
            console.log('Bot validation response:', botResponse.data);
            
            if (!botResponse.data.ok) {
                console.error('Bot validation failed:', botResponse.data);
                return false;
            }
            
            console.log('Bot is valid. Username:', botResponse.data.result?.username);
            
            // テストメッセージを送信
            const messageUrl = `https://api.telegram.org/bot${token}/sendMessage`;
            console.log('Sending test message to URL:', messageUrl);
            
            const messageResponse = await axios.post(messageUrl, {
                chat_id: chatId,
                text: `✅ AWAKEN2 接続テスト成功！\n\nこのメッセージが表示されていれば、Telegram通知の設定は正常です。\n\n買い度指数が設定値を超えると、このチャットに通知が送信されます。`,
                parse_mode: 'HTML'
            });
            
            console.log('Message send response:', messageResponse.data);
            
            return messageResponse.data.ok === true;
        } catch (error: any) {
            console.error('=== Test Connection with Credentials Failed ===');
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            return false;
        }
    }
}

export const telegramService = new TelegramService();