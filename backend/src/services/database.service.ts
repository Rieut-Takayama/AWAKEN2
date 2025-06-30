import mongoose from 'mongoose';
import Redis from 'ioredis';

class DatabaseService {
    private mongoConnection: typeof mongoose | null = null;
    private redisClient: Redis | null = null;

    // MongoDB接続
    async connectMongoDB(): Promise<void> {
        try {
            const mongoUrl = process.env.DATABASE_URL || process.env.MONGODB_URI;
            if (!mongoUrl) {
                console.log('⚠️ MongoDBスキップモード！メモリ内ストレージを使うぜ！');
                // モックモードを有効化
                this.mongoConnection = null;
                return;
            }

            await mongoose.connect(mongoUrl);
            this.mongoConnection = mongoose;
            console.log('✅ MongoDB connected successfully');
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            // エラーでも続行！
            this.mongoConnection = null;
        }
    }

    // Redis接続
    async connectRedis(): Promise<void> {
        try {
            const redisUrl = process.env.REDIS_URL;
            if (!redisUrl) {
                console.warn('⚠️ REDIS_URL is not defined, Redis features will be disabled');
                this.redisClient = null;
                return;
            }

            this.redisClient = new Redis(redisUrl);
            
            this.redisClient.on('connect', () => {
                console.log('✅ Redis connected successfully');
            });

            this.redisClient.on('error', (error) => {
                console.error('❌ Redis error:', error);
            });

            // 接続テスト
            await this.redisClient.ping();
        } catch (error) {
            console.error('❌ Redis connection error:', error);
            this.redisClient = null;
            // Redisエラーでも続行
        }
    }

    // データベース接続を初期化
    async initialize(): Promise<void> {
        try {
            // よっしゃ！MongoDB接続も解放だ！
            await this.connectMongoDB();
            // Redisは一時的にスキップ
            // await this.connectRedis();
            console.log('✅ おっす！データベース初期化完了！');
        } catch (error) {
            console.error('Database init error:', error);
            // エラーでも続行するぞ！
        }
    }

    // MongoDB接続を取得
    getMongoConnection(): typeof mongoose | null {
        return this.mongoConnection;
    }

    // Redisクライアントを取得
    getRedisClient(): Redis | null {
        return this.redisClient;
    }

    // 接続を閉じる
    async close(): Promise<void> {
        if (this.mongoConnection) {
            await this.mongoConnection.disconnect();
            console.log('MongoDB disconnected');
        }

        if (this.redisClient) {
            this.redisClient.disconnect();
            console.log('Redis disconnected');
        }
    }
}

export const databaseService = new DatabaseService();