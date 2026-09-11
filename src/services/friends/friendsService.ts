import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../api/apiEndpoints';
import { Friend, FriendRequest, SearchedUser } from '../../types/friends';

// ─── Friends Service ─────────────────────────────────────────────────────────

export const friendsService = {
  /**
   * Get the current user's full friends list
   */
  getFriends: async (): Promise<Friend[]> => {
    return apiClient.get<Friend[]>(API_ENDPOINTS.FRIENDS.LIST);
  },

  /**
   * Get incoming + outgoing friend requests
   */
  getFriendRequests: async (): Promise<FriendRequest[]> => {
    return apiClient.get<FriendRequest[]>(API_ENDPOINTS.FRIENDS.REQUESTS);
  },

  /**
   * Search for users by username
   */
  searchUsers: async (query: string): Promise<SearchedUser[]> => {
    return apiClient.get<SearchedUser[]>(API_ENDPOINTS.FRIENDS.SEARCH, { q: query });
  },

  /**
   * Send a friend request to a user
   */
  sendFriendRequest: async (userId: string): Promise<void> => {
    return apiClient.post<void>(API_ENDPOINTS.FRIENDS.SEND_REQUEST, { userId });
  },

  /**
   * Accept an incoming friend request
   */
  acceptFriendRequest: async (requestId: string): Promise<void> => {
    return apiClient.post<void>(API_ENDPOINTS.FRIENDS.ACCEPT(requestId));
  },

  /**
   * Decline an incoming friend request
   */
  declineFriendRequest: async (requestId: string): Promise<void> => {
    return apiClient.post<void>(API_ENDPOINTS.FRIENDS.DECLINE(requestId));
  },

  /**
   * Remove an existing friend
   */
  removeFriend: async (friendId: string): Promise<void> => {
    return apiClient.delete<void>(API_ENDPOINTS.FRIENDS.REMOVE(friendId));
  },
};

export default friendsService;
