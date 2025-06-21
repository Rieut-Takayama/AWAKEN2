import axios from 'axios';
import crypto from 'crypto';
import { databaseService } from './database.service';


interface PriceData {
    symbol: string;
    price: number;
    volume: number;
    change24h: number;
    timestamp: Date;
}

interface CandleData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

class MexcService {
    private apiKey: string;
    private apiSecret: string;
    private baseUrl: string;

    constructor() {
        this.apiKey = process.env.MEXC_API_KEY || '';
        this.apiSecret = process.env.MEXC_API_SECRET || '';
        this.baseUrl = process.env.MEXC_BASE_URL || 'https://api.mexc.com';
    }

    // MEXC APIの署名を生成
    private generateSignature(params: Record<string, any>): string {
        const timestamp = Date.now();
        const queryString = Object.entries({ ...params, timestamp })
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('&');

        return crypto
            .createHmac('sha256', this.apiSecret)
            .update(queryString)
            .digest('hex');
    }

    // 公開APIから価格データを取得（署名不要）
    async getTickerPrice(symbol: string): Promise<PriceData | null> {
        try {
            const response = await axios.get(`${this.baseUrl}/api/v3/ticker/24hr`, {
                params: { symbol }
            });

            const data = response.data;
            
            const priceData: PriceData = {
                symbol: data.symbol,
                price: parseFloat(data.lastPrice),
                volume: parseFloat(data.volume),
                change24h: parseFloat(data.priceChangePercent),
                timestamp: new Date()
            };

            // Redisにキャッシュ
            const redis = databaseService.getRedisClient();
            if (redis) {
                await redis.setex(
                    `price:${symbol}`,
                    10, // 10秒キャッシュ
                    JSON.stringify(priceData)
                );
            }

            return priceData;
        } catch (error) {
            console.error(`Error fetching price for ${symbol}:`, error);
            return null;
        }
    }

    // 複数の通貨ペアの価格を一括取得
    async getMultipleTickerPrices(symbols: string[]): Promise<PriceData[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/api/v3/ticker/24hr`);
            const allTickers = response.data;

            const filteredData = allTickers
                .filter((ticker: any) => symbols.includes(ticker.symbol))
                .map((ticker: any) => ({
                    symbol: ticker.symbol,
                    price: parseFloat(ticker.lastPrice),
                    volume: parseFloat(ticker.volume),
                    change24h: parseFloat(ticker.priceChangePercent),
                    timestamp: new Date()
                }));

            // Redisに一括キャッシュ
            const redis = databaseService.getRedisClient();
            if (redis) {
                const pipeline = redis.pipeline();
                filteredData.forEach((data: PriceData) => {
                    pipeline.setex(
                        `price:${data.symbol}`,
                        10,
                        JSON.stringify(data)
                    );
                });
                await pipeline.exec();
            }

            return filteredData;
        } catch (error) {
            console.error('Error fetching multiple prices:', error);
            return [];
        }
    }

    // キャッシュから価格データを取得
    async getCachedPrice(symbol: string): Promise<PriceData | null> {
        const redis = databaseService.getRedisClient();
        if (!redis) return null;

        try {
            const cached = await redis.get(`price:${symbol}`);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            console.error('Redis cache error:', error);
        }

        return null;
    }

    // ローソク足データ取得（テクニカル分析用）
    async getCandleData(symbol: string, interval: string = '5m', limit: number = 100): Promise<CandleData[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/api/v3/klines`, {
                params: {
                    symbol: symbol,
                    interval: interval,
                    limit: limit
                }
            });

            return response.data.map((candle: any[]) => ({
                time: candle[0],
                open: parseFloat(candle[1]),
                high: parseFloat(candle[2]),
                low: parseFloat(candle[3]),
                close: parseFloat(candle[4]),
                volume: parseFloat(candle[5])
            }));
        } catch (error) {
            console.error(`Error fetching candle data for ${symbol}:`, error);
            return [];
        }
    }

    // リアルタイム価格監視
    async startPriceMonitoring(symbols: string[], interval: number = 5000): Promise<void> {
        console.log(`Starting price monitoring for: ${symbols.join(', ')}`);
        
        // 初回取得
        await this.getMultipleTickerPrices(symbols);

        // 定期更新
        setInterval(async () => {
            const prices = await this.getMultipleTickerPrices(symbols);
            console.log(`Updated ${prices.length} prices at ${new Date().toISOString()}`);
        }, interval);
    }
}

export const mexcService = new MexcService();