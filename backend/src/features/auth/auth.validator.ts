import Joi from 'joi';
import { TrialAuthRequest } from '@/types';
import { appConfig } from '@/config/env.config';

export const trialAuthSchema = Joi.object<TrialAuthRequest>({
  passkey: Joi.string()
    .required()
    .min(5)
    .max(20)
    .trim()
    .valid(...appConfig.TRIAL_KEYS)
    .messages({
      'string.empty': 'パスキーを入力してください',
      'string.min': 'パスキーは5文字以上である必要があります',
      'string.max': 'パスキーは20文字以下である必要があります',
      'any.only': '無効なパスキーです',
      'any.required': 'パスキーは必須です'
    })
});

export const validateTrialAuth = (data: any): { value: TrialAuthRequest; error?: Joi.ValidationError } => {
  const { error, value } = trialAuthSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
  
  return { value, error };
};

export const jwtTokenSchema = Joi.string()
  .required()
  .pattern(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)
  .messages({
    'string.empty': 'トークンを提供してください',
    'string.pattern.base': '無効なJWTトークン形式です',
    'any.required': 'トークンは必須です'
  });

export const validateJwtToken = (token: any): { value: string; error?: Joi.ValidationError } => {
  const { error, value } = jwtTokenSchema.validate(token);
  return { value, error };
};