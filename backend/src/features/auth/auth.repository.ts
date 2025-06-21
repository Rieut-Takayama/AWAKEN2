import { UserModel, UserDocument } from '@/db/models/user.model';
import { User, UserSettings } from '@/types';
import { createError } from '@/common/middlewares/error.middleware';
import { logger, createOperationLogger } from '@/common/utils/logger.util';
import mongoose from 'mongoose';

export interface CreateTrialUserRequest {
  settings?: Partial<UserSettings>;
}

export class AuthRepository {
  private static instance: AuthRepository;
  
  private constructor() {}
  
  public static getInstance(): AuthRepository {
    if (!AuthRepository.instance) {
      AuthRepository.instance = new AuthRepository();
    }
    return AuthRepository.instance;
  }
  
  public async createTrialUser(request: CreateTrialUserRequest = {}): Promise<User> {
    const opLogger = createOperationLogger('認証リポジトリ:トライアルユーザー作成');
    
    try {
      opLogger.milestone('バリデーション開始');
      
      const defaultSettings: UserSettings = {
        scoreThreshold: 75,
        notificationInterval: 60,
        watchlistSymbols: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'],
        telegramEnabled: false
      };
      
      const settings = { ...defaultSettings, ...request.settings };
      
      opLogger.milestone('デフォルト設定適用完了', settings);
      
      const now = new Date();
      const trialExpires = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30日後
      
      const userData = {
        isTrialUser: true,
        trialExpires,
        settings
      };
      
      opLogger.milestone('ユーザーデータ構築完了');
      
      const user = new UserModel(userData);
      const savedUser = await user.save();
      
      opLogger.milestone('データベース保存完了', {
        userId: savedUser._id.toString(),
        trialExpires: savedUser.trialExpires
      });
      
      const userObject = savedUser.toJSON() as User;
      
      opLogger.complete({
        userId: userObject.id,
        isTrialUser: userObject.isTrialUser,
        settingsCount: Object.keys(userObject.settings).length
      });
      
      return userObject;
    } catch (error: any) {
      opLogger.error(error, { request });
      
      if (error.code === 11000) {
        logger.warn('[AUTH_REPO] 重複ユーザー作成試行', error.keyValue);
        throw createError.conflict('既に存在するユーザーです', { duplicateFields: error.keyValue });
      }
      
      if (error instanceof mongoose.Error.ValidationError) {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        throw createError.validationError('ユーザーデータの検証に失敗しました', { errors: validationErrors });
      }
      
      throw createError.internal('ユーザー作成中にエラーが発生しました', { originalError: error.message });
    }
  }
  
  public async findById(id: string): Promise<User | null> {
    const opLogger = createOperationLogger('認証リポジトリ:ID検索');
    
    try {
      opLogger.milestone('IDバリデーション', { id });
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        opLogger.milestone('無効なID形式検出');
        return null;
      }
      
      opLogger.milestone('データベース検索開始');
      
      const user = await UserModel.findById(id).lean();
      
      if (!user) {
        opLogger.milestone('ユーザー未発見');
        return null;
      }
      
      opLogger.milestone('ユーザー発見', {
        userId: user._id.toString(),
        isTrialUser: user.isTrialUser
      });
      
      const userObject: User = {
        id: user._id.toString(),
        email: user.email,
        isTrialUser: user.isTrialUser,
        trialExpires: user.trialExpires,
        settings: user.settings,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      opLogger.complete({ userId: userObject.id });
      
      return userObject;
    } catch (error: any) {
      opLogger.error(error, { id });
      throw createError.internal('ユーザー取得中にエラーが発生しました', { userId: id, originalError: error.message });
    }
  }
  
  public async updateUserSettings(id: string, settings: Partial<UserSettings>): Promise<User> {
    const opLogger = createOperationLogger('認証リポジトリ:設定更新');
    
    try {
      opLogger.milestone('更新データバリデーション', { id, settingsKeys: Object.keys(settings) });
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw createError.badRequest('無効なユーザーIDです', { id });
      }
      
      opLogger.milestone('データベース更新開始');
      
      const updatedUser = await UserModel.findByIdAndUpdate(
        id,
        { 
          $set: { 
            'settings': settings,
            updatedAt: new Date()
          }
        },
        { 
          new: true,
          runValidators: true,
          lean: true
        }
      );
      
      if (!updatedUser) {
        opLogger.milestone('更新対象ユーザー未発見');
        throw createError.notFound('ユーザーが見つかりません', { userId: id });
      }
      
      opLogger.milestone('設定更新完了', {
        userId: updatedUser._id.toString(),
        updatedFields: Object.keys(settings)
      });
      
      const userObject: User = {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        isTrialUser: updatedUser.isTrialUser,
        trialExpires: updatedUser.trialExpires,
        settings: updatedUser.settings,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      };
      
      opLogger.complete({ userId: userObject.id });
      
      return userObject;
    } catch (error: any) {
      opLogger.error(error, { id, settings });
      
      if (error instanceof mongoose.Error.ValidationError) {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        throw createError.validationError('設定データの検証に失敗しました', { errors: validationErrors });
      }
      
      if (error.statusCode) {
        throw error;
      }
      
      throw createError.internal('設定更新中にエラーが発生しました', { userId: id, originalError: error.message });
    }
  }
  
  public async isTrialExpired(id: string): Promise<boolean> {
    const opLogger = createOperationLogger('認証リポジトリ:トライアル期限確認');
    
    try {
      opLogger.milestone('ユーザー検索開始', { id });
      
      const user = await this.findById(id);
      
      if (!user) {
        opLogger.milestone('ユーザー未発見');
        throw createError.notFound('ユーザーが見つかりません', { userId: id });
      }
      
      opLogger.milestone('期限確認実行', {
        isTrialUser: user.isTrialUser,
        trialExpires: user.trialExpires
      });
      
      if (!user.isTrialUser || !user.trialExpires) {
        opLogger.complete({ expired: false, reason: 'トライアルユーザーではない' });
        return false;
      }
      
      const now = new Date();
      const expired = now > user.trialExpires;
      
      opLogger.complete({
        expired,
        now: now.toISOString(),
        expires: user.trialExpires.toISOString()
      });
      
      return expired;
    } catch (error: any) {
      opLogger.error(error, { id });
      
      if (error.statusCode) {
        throw error;
      }
      
      throw createError.internal('トライアル期限確認中にエラーが発生しました', { userId: id, originalError: error.message });
    }
  }
}

export const authRepository = AuthRepository.getInstance();