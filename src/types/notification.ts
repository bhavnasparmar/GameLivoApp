// ─── Notification Types ──────────────────────────────────────────────────────

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'game_invite'
  | 'match_result'
  | 'reward'
  | 'system'
  | 'achievement'
  | 'leaderboard';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string; // ISO date string
  actionUrl?: string; // deep link or route
  meta?: {
    fromUserId?: string;
    fromUserName?: string;
    fromUserInitials?: string;
    gameId?: string;
    matchId?: string;
    requestId?: string;
    rewardAmount?: number;
    achievementTitle?: string;
  };
}

export interface NotificationsState {
  items: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}
