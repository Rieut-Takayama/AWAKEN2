import crypto from 'crypto';

const algorithm = 'aes-256-gcm';

// ユーザーごとに独自の暗号化キーを生成
export function generateUserKey(userId: string): Buffer {
    // ユーザーIDと環境変数を組み合わせて一意のキーを生成
    const baseKey = process.env.ENCRYPTION_KEY || 'default-awaken2-encryption-key-2024';
    const userSpecificKey = `${baseKey}-${userId}`;
    
    // SHA256でハッシュ化して32バイトのキーを生成
    return crypto.createHash('sha256').update(userSpecificKey).digest();
}

// ユーザー固有のキーで暗号化
export function encryptForUser(text: string, userId: string): string {
    const key = generateUserKey(userId);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // IV、認証タグ、暗号化データを結合
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

// ユーザー固有のキーで復号化
export function decryptForUser(encryptedData: string, userId: string): string {
    try {
        const parts = encryptedData.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format');
        }
        
        const key = generateUserKey(userId);
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('復号化エラー:', error);
        throw new Error('復号化に失敗しました');
    }
}