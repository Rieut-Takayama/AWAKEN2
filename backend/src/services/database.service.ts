import mongoose from 'mongoose';
import Redis from 'ioredis';

class DatabaseService {
    private mongoConnection: typeof mongoose | null = null;
    private redisClient: Redis | null = null;

    // MongoDB接続
    async connectMongoDB(): Promise<void> {
        try {
            const mongoUrl = process.env.DATABASE_URL;
            if (!mongoUrl) {
                throw new Error('DATABASE_URL is not defined');
            }

            await mongoose.connect(mongoUrl);
            this.mongoConnection = mongoose;
            console.log('✅ MongoDB connected successfully');
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            throw error;
        }
    }

    // Redis接続
    async connectRedis(): Promise<void> {
        try {
            const redisUrl = process.env.REDIS_URL;
            if (!redisUrl) {
                throw new Error('REDIS_URL is not defined');
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
            throw error;
        }
    }

    // データベース接続を初期化
    async initialize(): Promise<void> {
        try {
            // MongoDBはスキップしてRedisだけ接続するぞ！
            // await this.connectMongoDB();
            await this.connectRedis();
            console.log('✅ Database services initialized (Redis only)');
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