import { telegramService } from './telegram.service';
import { memoryStorage } from './memory-storage.service';

interface EconomicEvent {
    id: string;
    title: string;
    country: string;
    importance: 'high' | 'medium' | 'low';
    actual?: string;
    forecast?: string;
    previous?: string;
    time: Date;
    impact?: 'positive' | 'negative' | 'neutral';
}

class EconomicIndicatorsService {
    private enabled: boolean = false;
    private checkInterval: NodeJS.Timeout | null = null;
    private lastCheckedTime: Date = new Date();
    
    // 重要な経済指標（仮想通貨に影響大）
    private importantIndicators = [
        // 米国
        'FOMC政策金利',
        'CPI（消費者物価指数）',
        'NFP（雇用統計）',
        'GDP',
        'ISM製造業景況指数',
        
        // 中央銀行
        'FRB議長発言',
        'ECB政策金利',
        'BOJ政策金利',
        
        // 仮想通貨関連
        'SEC仮想通貨規制発表',
        'ビットコインETF承認',
        '大手企業の仮想通貨採用'
    ];
    
    // モックデータ（実際はAPIから取得）
    private getMockEvents(): EconomicEvent[] {
        const now = new Date();
        const events: EconomicEvent[] = [
            {
                id: '1',
                title: '米国CPI（消費者物価指数）',
                country: 'US',
                importance: 'high',
                forecast: '3.2%',
                previous: '3.7%',
                time: new Date(now.getTime() + 30 * 60000), // 30分後
                impact: 'positive'
            },
            {
                id: '2',
                title: 'FOMC議事録公表',
                country: 'US',
                importance: 'high',
                time: new Date(now.getTime() + 120 * 60000), // 2時間後
                impact: 'neutral'
            },
            {
                id: '3',
                title: '中国GDP',
                country: 'CN',
                importance: 'medium',
                forecast: '5.0%',
                previous: '4.9%',
                time: new Date(now.getTime() + 180 * 60000), // 3時間後
                impact: 'positive'
            }
        ];
        
        return events;
    }
    
    // 経済指標通知を開始
    async startMonitoring(): Promise<void> {
        if (this.enabled) {
            console.log('⚠️ 経済指標通知は既に有効です');
            return;
        }
        
        this.enabled = true;
        console.log('📊 経済指標通知を開始しました');
        
        // 初回チェック
        await this.checkUpcomingEvents();
        
        // 5分ごとにチェック
        this.checkInterval = setInterval(async () => {
            await this.checkUpcomingEvents();
        }, 5 * 60 * 1000);
    }
    
    // 経済指標通知を停止
    stopMonitoring(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.enabled = false;
        console.log('🛑 経済指標通知を停止しました');
    }
    
    // 今後の経済指標をチェック
    private async checkUpcomingEvents(): Promise<void> {
        try {
            const events = this.getMockEvents(); // 実際はAPIから取得
            const now = new Date();
            
            for (const event of events) {
                const timeDiff = event.time.getTime() - now.getTime();
                const minutesUntil = Math.floor(timeDiff / 60000);
                
                // 30分前、5分前に通知
                if (minutesUntil === 30 || minutesUntil === 5) {
                    const alreadyNotified = await memoryStorage.get(`event_notified_${event.id}_${minutesUntil}`);
                    
                    if (!alreadyNotified) {
                        await this.sendEventNotification(event, minutesUntil);
                        await memoryStorage.set(`event_notified_${event.id}_${minutesUntil}`, true, 3600); // 1時間保持
                    }
                }
            }
            
            // 発表された指標の結果通知
            await this.checkReleasedEvents();
            
        } catch (error) {
            console.error('経済指標チェックエラー:', error);
        }
    }
    
    // 経済指標の事前通知
    private async sendEventNotification(event: EconomicEvent, minutesUntil: number): Promise<void> {
        let urgency = minutesUntil === 5 ? '🚨' : '📢';
        let timeText = minutesUntil === 5 ? 'まもなく' : `${minutesUntil}分後`;
        
        const impactEmoji = {
            high: '🔴',
            medium: '🟡',
            low: '🔵'
        };
        
        const message = `${urgency} <b>経済指標発表通知</b> ${urgency}

${impactEmoji[event.importance]} <b>${event.title}</b>
🌍 国: ${event.country}
⏰ 発表時刻: <b>${timeText}</b>

${event.forecast ? `📊 予想: ${event.forecast}` : ''}
${event.previous ? `📈 前回: ${event.previous}` : ''}

${event.importance === 'high' ? '⚠️ <b>相場が大きく動く可能性があります！</b>\nポジション管理にご注意ください。' : '💡 市場への影響を注視しましょう。'}

${this.getImpactAnalysis(event)}`;
        
        await telegramService.sendMessage({
            chatId: '',
            text: message,
            parseMode: 'HTML'
        });
    }
    
    // 発表後の結果通知
    private async checkReleasedEvents(): Promise<void> {
        // 実際はAPIから最新の発表済み指標を取得
        const releasedEvent: EconomicEvent = {
            id: '999',
            title: '米国CPI（消費者物価指数）',
            country: 'US',
            importance: 'high',
            actual: '3.0%',
            forecast: '3.2%',
            previous: '3.7%',
            time: new Date(),
            impact: 'positive'
        };
        
        const alreadyNotified = await memoryStorage.get(`event_result_${releasedEvent.id}`);
        if (!alreadyNotified && releasedEvent.actual) {
            await this.sendResultNotification(releasedEvent);
            await memoryStorage.set(`event_result_${releasedEvent.id}`, true, 86400); // 24時間保持
        }
    }
    
    // 発表結果の通知
    private async sendResultNotification(event: EconomicEvent): Promise<void> {
        const betterThanExpected = this.compareResults(event.actual!, event.forecast!);
        const resultEmoji = betterThanExpected ? '✅' : '❌';
        
        const message = `📊 <b>経済指標発表結果</b> 📊

${resultEmoji} <b>${event.title}</b>

📍 実績: <b>${event.actual}</b>
📈 予想: ${event.forecast}
📉 前回: ${event.previous}

${betterThanExpected ? 
    '🎯 <b>予想を上回る結果！</b>\n💹 リスクオン相場の可能性' : 
    '⚠️ <b>予想を下回る結果</b>\n📉 リスクオフ相場に注意'}

${this.getMarketImpact(event)}

<i>${new Date().toLocaleString('ja-JP')}</i>`;
        
        await telegramService.sendMessage({
            chatId: '',
            text: message,
            parseMode: 'HTML'
        });
    }
    
    // 結果の比較
    private compareResults(actual: string, forecast: string): boolean {
        const actualNum = parseFloat(actual.replace('%', ''));
        const forecastNum = parseFloat(forecast.replace('%', ''));
        return actualNum > forecastNum;
    }
    
    // 影響分析
    private getImpactAnalysis(event: EconomicEvent): string {
        const impacts: { [key: string]: string } = {
            'CPI': '📌 インフレ指標：高い→利上げ期待→仮想通貨下落圧力',
            'FOMC': '📌 金利政策：利上げ→ドル高→仮想通貨下落圧力',
            'NFP': '📌 雇用統計：好調→利上げ期待→リスク資産から資金流出',
            'GDP': '📌 経済成長：好調→リスクオン→仮想通貨上昇期待'
        };
        
        for (const [key, impact] of Object.entries(impacts)) {
            if (event.title.includes(key)) {
                return impact;
            }
        }
        
        return '📌 市場への影響度: ' + (event.importance === 'high' ? '大' : '中');
    }
    
    // 市場への影響
    private getMarketImpact(event: EconomicEvent): string {
        if (event.importance !== 'high') {
            return '💡 限定的な影響と予想されます';
        }
        
        const suggestions = [
            '🔸 ボラティリティ上昇に備えましょう',
            '🔸 ストップロスの確認を推奨',
            '🔸 新規ポジションは様子見が無難',
            '🔸 トレンド転換の可能性に注意'
        ];
        
        return suggestions.join('\n');
    }
    
    // ステータス取得
    getStatus(): {
        enabled: boolean;
        nextEvents: EconomicEvent[];
    } {
        return {
            enabled: this.enabled,
            nextEvents: this.getMockEvents()
        };
    }
}

export const economicIndicatorsService = new EconomicIndicatorsService();