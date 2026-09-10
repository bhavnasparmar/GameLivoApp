import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types/user';

interface Friend extends User {
  friendshipId: string;
  addedAt: string;
}

interface FriendRequest {
  id: string;
  from: User;
  to: User;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

interface FriendState {
  list: Friend[];
  onlineFriends: string[]; // user IDs
  requests: FriendRequest[];
  searchResults: User[];
  isLoading: boolean;
  error: string | null;
}

const initialState: FriendState = {
  list: [],
  onlineFriends: [],
  requests: [],
  searchResults: [],
  isLoading: false,
  error: null,
};

const friendSlice = createSlice({
  name: 'friend',
  initialState,
  reducers: {
    setFriendList: (state, action: PayloadAction<Friend[]>) => {
      state.list = action.payload;
    },
    setOnlineFriends: (state, action: PayloadAction<string[]>) => {
      state.onlineFriends = action.payload;
    },
    setFriendOnline: (state, action: PayloadAction<string>) => {
      if (!state.onlineFriends.includes(action.payload)) {
        state.onlineFriends.push(action.payload);
      }
    },
    setFriendOffline: (state, action: PayloadAction<string>) => {
      state.onlineFriends = state.onlineFriends.filter(id => id !== action.payload);
    },
    setFriendRequests: (state, action: PayloadAction<FriendRequest[]>) => {
      state.requests = action.payload;
    },
    removeFriendRequest: (state, action: PayloadAction<string>) => {
      state.requests = state.requests.filter(r => r.id !== action.payload);
    },
    setSearchResults: (state, action: PayloadAction<User[]>) => {
      state.searchResults = action.payload;
    },
    clearSearchResults: state => {
      state.searchResults = [];
    },
    removeFriend: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(f => f.id !== action.payload);
    },
  },
});

export const { setFriendList, setOnlineFriends, setFriendOnline, setFriendOffline, setFriendRequests, removeFriendRequest, setSearchResults, clearSearchResults, removeFriend } = friendSlice.actions;
export default friendSlice.reducer;
