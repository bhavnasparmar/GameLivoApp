import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../api/apiEndpoints';
import { AppNotification } from '../../types/notification';

// ─── Notification Service ─────────────────────────────────────────────────────

export const notificationService = {
  /**
   * Fetch all notifications for the current user (paginated)
   */
  getNotifications: async (page = 1, limit = 30): Promise<AppNotification[]> => {
    return apiClient.get<AppNotification[]>(API_ENDPOINTS.NOTIFICATIONS.LIST, {
      page,
      limit,
    });
  },

  /**
   * Mark a single notification as read
   */
  markRead: async (notificationId: string): Promise<void> => {
    return apiClient.patch<void>(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId));
  },

  /**
   * Mark ALL notifications as read
   */
  markAllRead: async (): Promise<void> => {
    return apiClient.patch<void>(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  },
};

export default notificationService;
