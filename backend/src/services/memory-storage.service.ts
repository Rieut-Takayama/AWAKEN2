// メモリ内ストレージサービス - 仙豆みたいなもんだ！
class MemoryStorageService {
    private users: Map<string, any> = new Map();
    private userSettings: Map<string, any> = new Map();
    private userCredentials: Map<string, any> = new Map();
    private cache: Map<string, { value: any; expiry?: number }> = new Map();

    // ユーザー作成
    async createUser(userData: any) {
        // メールで既存チェック
        const existingUser = Array.from(this.users.values()).find(u => u.email === userData.email);
        if (existingUser) {
            return existingUser;
        }
        
        this.users.set(userData.userId, userData);
        console.log(`💾 メモリに新規ユーザー保存: ${userData.email}`);
        return userData;
    }

    // ユーザー検索（メールで）
    async findUserByEmail(email: string) {
        return Array.from(this.users.values()).find(u => u.email === email);
    }

    // ユーザー更新
    async updateUser(email: string, updateData: any) {
        const user = await this.findUserByEmail(email);
        if (user) {
            Object.assign(user, updateData);
            this.users.set(user.userId, user);
        }
        return user;
    }

    // 全ユーザー取得
    async getAllUsers() {
        return Array.from(this.users.values()).sort((a, b) => 
            new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
        );
    }

    // 設定保存
    async saveUserSettings(userId: string, settings: any) {
        this.userSettings.set(userId, {
            userId,
            settings,
            updatedAt: new Date()
        });
        console.log(`💾 メモリに設定保存: ${userId}`);
    }

    // 設定取得
    async getUserSettings(userId: string) {
        return this.userSettings.get(userId);
    }

    // 認証情報保存
    async saveUserCredentials(userId: string, credentials: any) {
        this.userCredentials.set(userId, {
            userId,
            ...credentials,
            updatedAt: new Date()
        });
        console.log(`💾 メモリに認証情報保存: ${userId}`);
    }
    
    // 認証情報取得
    async getUserCredentials(userId: string) {
        return this.userCredentials.get(userId);
    }

    // 汎用的なget/setメソッド
    async get(key: string): Promise<any> {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (item.expiry && Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        const item: { value: any; expiry?: number } = { value };
        
        if (ttlSeconds) {
            item.expiry = Date.now() + (ttlSeconds * 1000);
        }
        
        this.cache.set(key, item);
    }
    
    // メモリ状態を表示
    getStatus() {
        return {
            users: this.users.size,
            settings: this.userSettings.size,
            credentials: this.userCredentials.size,
            cache: this.cache.size
        };
    }
}

export const memoryStorage = new MemoryStorageService();