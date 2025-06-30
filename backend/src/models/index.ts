import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// ユーザードキュメント
export interface IUser extends Document {
  userId: string;
  email: string;
  userType: 'trial' | 'registered';
  registeredAt: Date;
  lastLogin: Date;
  settings?: any;
}

// ユーザー設定ドキュメント
export interface IUserSettings extends Document {
  userId: string;
  settings: {
    threshold?: number;
    notificationInterval?: number;
    notificationsEnabled?: boolean;
    symbolsWithIntervals?: Array<{
      symbol: string;
      interval: number;
    }>;
    quietHoursStart?: number;
    quietHoursEnd?: number;
    alertConfig?: {
      enabled: boolean;
      surgeAlert: boolean;
      dropAlert: boolean;
      volumeAlert: boolean;
      volatilityAlert: boolean;
      stagnationAlert: boolean;
      whipsawAlert: boolean;
      supportResistanceAlert: boolean;
      consecutiveBarsAlert: boolean;
      volumeDryUpAlert: boolean;
      surgeThreshold: number;
      dropThreshold: number;
      volumeMultiplier: number;
      volatilityThreshold: number;
      stagnationHours: number;
      whipsawCount: number;
    };
  };
  updatedAt: Date;
}

// ユーザー認証情報ドキュメント
export interface IUserCredentials extends Document {
  userId: string;
  claudeApiKey?: string;
  mexcApiKey?: string;
  mexcApiSecret?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  updatedAt: Date;
}

// ユーザースキーマ
const userSchema = new Schema<IUser>({
  userId: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => uuidv4()
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  userType: { 
    type: String, 
    enum: ['trial', 'registered'],
    default: 'trial'
  },
  registeredAt: { 
    type: Date, 
    default: Date.now 
  },
  lastLogin: { 
    type: Date, 
    default: Date.now 
  },
  settings: { 
    type: Schema.Types.Mixed 
  }
}, {
  timestamps: true
});

// インデックス設定
userSchema.index({ email: 1 });
userSchema.index({ userId: 1 });

// ユーザー設定スキーマ
const userSettingsSchema = new Schema<IUserSettings>({
  userId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  settings: {
    threshold: { 
      type: Number, 
      default: 75,
      min: 60,
      max: 95
    },
    notificationInterval: { 
      type: Number, 
      default: 60,
      min: 5,
      max: 1440
    },
    notificationsEnabled: { 
      type: Boolean, 
      default: true 
    },
    symbolsWithIntervals: [{
      symbol: { type: String, required: true },
      interval: { type: Number, default: 300000 }
    }],
    quietHoursStart: { 
      type: Number,
      min: 0,
      max: 23
    },
    quietHoursEnd: { 
      type: Number,
      min: 0,
      max: 23
    }
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// ユーザー認証情報スキーマ
const userCredentialsSchema = new Schema<IUserCredentials>({
  userId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  claudeApiKey: { 
    type: String 
  },
  mexcApiKey: { 
    type: String 
  },
  mexcApiSecret: { 
    type: String 
  },
  telegramBotToken: { 
    type: String 
  },
  telegramChatId: { 
    type: String 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// モデルのエクスポート
export const User = mongoose.model<IUser>('User', userSchema);
export const UserSettings = mongoose.model<IUserSettings>('UserSettings', userSettingsSchema);
export const UserCredentials = mongoose.model<IUserCredentials>('UserCredentials', userCredentialsSchema);