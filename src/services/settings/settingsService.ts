import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../api/apiEndpoints';

// ─── Settings Types ──────────────────────────────────────────────────────────

export interface UserPreferences {
  notifications: boolean;
  matchAlerts: boolean;
  friendActivity: boolean;
  marketingEmails: boolean;
  soundEffects: boolean;
  bgMusic: boolean;
  haptics: boolean;
  theme: 'dark' | 'light' | 'system';
  language: string;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showOnlineStatus: boolean;
  allowFriendRequests: boolean;
  allowGameInvites: boolean;
  twoFactorEnabled: boolean;
}

export interface BlockedUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  blockedAt: string;
  reason?: string;
}

export interface AppPermissionItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  granted: boolean;
  required: boolean;
}

// ─── Settings Service ─────────────────────────────────────────────────────────

export const settingsService = {
  /**
   * Get user preferences from backend API
   */
  getPreferences: async (): Promise<UserPreferences> => {
    return apiClient.get<UserPreferences>('/user/preferences');
  },

  /**
   * Update user preferences on backend API
   */
  updatePreferences: async (prefs: Partial<UserPreferences>): Promise<UserPreferences> => {
    return apiClient.put<UserPreferences>('/user/preferences', prefs);
  },

  /**
   * Get privacy and security settings from backend API
   */
  getPrivacySettings: async (): Promise<PrivacySettings> => {
    return apiClient.get<PrivacySettings>('/user/privacy');
  },

  /**
   * Update privacy and security settings on backend API
   */
  updatePrivacySettings: async (privacy: Partial<PrivacySettings>): Promise<PrivacySettings> => {
    return apiClient.put<PrivacySettings>('/user/privacy', privacy);
  },

  /**
   * Get list of blocked users from backend API
   */
  getBlockedUsers: async (): Promise<BlockedUser[]> => {
    return apiClient.get<BlockedUser[]>('/user/blocked');
  },

  /**
   * Block a user via backend API
   */
  blockUser: async (user: { id: string; name: string; username: string; reason?: string }): Promise<BlockedUser> => {
    return apiClient.post<BlockedUser>(`/user/block/${user.id}`, {
      reason: user.reason,
      name: user.name,
      username: user.username,
    });
  },

  /**
   * Unblock a user via backend API
   */
  unblockUser: async (userId: string): Promise<{ unblockedId: string }> => {
    return apiClient.delete<{ unblockedId: string }>(`/user/block/${userId}`);
  },

  /**
   * Request account data export / download via backend API
   */
  requestDataDownload: async (): Promise<{ downloadUrl: string; estimatedSize: string; expiresAt: string }> => {
    return apiClient.post<{ downloadUrl: string; estimatedSize: string; expiresAt: string }>('/user/data/download', {});
  },

  /**
   * Delete account permanently via backend API
   */
  deleteAccount: async (): Promise<void> => {
    return apiClient.delete<void>('/user/account');
  },

  /**
   * Submit support ticket via backend API
   */
  submitSupportTicket: async (payload: {
    subject: string;
    message: string;
    category: string;
  }): Promise<{ ticketId: string }> => {
    return apiClient.post<{ ticketId: string }>(API_ENDPOINTS.SUPPORT.SUBMIT, payload);
  },
};

export default settingsService;
