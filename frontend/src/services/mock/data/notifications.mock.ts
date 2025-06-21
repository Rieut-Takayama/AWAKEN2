// @MOCK_DATA: ハードコードされたサンプルデータ
import { NotificationHistory, NotificationSettings } from '@/types';

export const MOCK_NOTIFICATION_SETTINGS: NotificationSettings = {
  scoreThreshold: 75,
  interval: 60,
  methods: ['telegram', 'browser'],
  telegramChatId: undefined,
  enabled: true
};

export const MOCK_NOTIFICATION_HISTORY: NotificationHistory[] = [
  {
    id: '1',
    userId: '1',
    symbol: 'BTCUSDT',
    score: 82,
    price: 43250.67,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2時間前
    notificationType: 'telegram',
    sent: true,
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    outcome: 3.2, // 3.2%の価格上昇
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: '2',
    userId: '1',
    symbol: 'ETHUSDT',
    score: 78,
    price: 2520.45,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5時間前
    notificationType: 'browser',
    sent: true,
    sentAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    outcome: 1.9, // 1.9%の価格上昇
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: '3',
    userId: '1',
    symbol: 'BTCUSDT',
    score: 85,
    price: 42100.30,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24時間前
    notificationType: 'telegram',
    sent: true,
    sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    outcome: 2.7, // 2.7%の価格上昇
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  }
];