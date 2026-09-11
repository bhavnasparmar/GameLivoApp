// ─── Friends Types ───────────────────────────────────────────────────────────

export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  level: number;
  rank: number;
  isOnline: boolean;
  currentActivity?: string; // e.g. "Playing Ludo", "In lobby", "Online"
  lastSeen?: string;
  mutualFriends?: number;
}

export interface FriendRequest {
  id: string;
  requestId: string; // the request entity ID (for accept/decline)
  name: string;
  username: string;
  avatar?: string;
  level: number;
  mutualFriends?: number;
  sentAt: string;
  direction: 'incoming' | 'outgoing';
}

export interface SearchedUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  level: number;
  rank: number;
  mutualFriends?: number;
  isFriend: boolean;
  hasPendingRequest: boolean;
}

export interface SendFriendRequestPayload {
  userId: string;
}

export interface FriendsState {
  friends: Friend[];
  requests: FriendRequest[];
  searchResults: SearchedUser[];
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
}
