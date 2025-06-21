import mongoose, { Schema, Document } from 'mongoose';
import { User, UserSettings } from '@/types';

export interface UserDocument extends Omit<User, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const userSettingsSchema = new Schema<UserSettings>({
  scoreThreshold: {
    type: Number,
    required: true,
    default: 75,
    min: 60,
    max: 90
  },
  notificationInterval: {
    type: Number,
    required: true,
    default: 60,
    min: 15,
    max: 240
  },
  watchlistSymbols: [{
    type: String,
    required: true
  }],
  mexcApiKey: {
    type: String,
    required: false
  },
  mexcApiSecret: {
    type: String,
    required: false
  },
  telegramChatId: {
    type: String,
    required: false
  },
  telegramEnabled: {
    type: Boolean,
    required: true,
    default: false
  }
}, { _id: false });

const userSchema = new Schema<UserDocument>({
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  isTrialUser: {
    type: Boolean,
    required: true,
    default: true
  },
  trialExpires: {
    type: Date,
    required: false
  },
  settings: {
    type: userSettingsSchema,
    required: true,
    default: () => ({
      scoreThreshold: 75,
      notificationInterval: 60,
      watchlistSymbols: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'],
      telegramEnabled: false
    })
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      if (ret.mexcApiSecret) {
        ret.mexcApiSecret = '***';
      }
      return ret;
    }
  }
});

userSchema.index({ email: 1 });
userSchema.index({ isTrialUser: 1 });
userSchema.index({ createdAt: 1 });

userSchema.pre('save', function(next) {
  if (this.isTrialUser && !this.trialExpires) {
    const now = new Date();
    this.trialExpires = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30日後
  }
  next();
});

userSchema.methods.isTrialExpired = function(): boolean {
  if (!this.isTrialUser || !this.trialExpires) {
    return false;
  }
  return new Date() > this.trialExpires;
};

userSchema.methods.updateSettings = function(newSettings: Partial<UserSettings>): void {
  this.settings = { ...this.settings.toObject(), ...newSettings };
  this.markModified('settings');
};

export const UserModel = mongoose.model<UserDocument>('User', userSchema);