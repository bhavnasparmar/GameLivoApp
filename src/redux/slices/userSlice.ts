import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserState, UserProfile } from '../../types/user';

const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    fetchProfileStart: state => {
      state.isLoading = true;
      state.error = null;
    },
    fetchProfileSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.isLoading = false;
    },
    fetchProfileFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    updateCoins: (state, action: PayloadAction<number>) => {
      if (state.profile) {
        state.profile.coins = action.payload;
      }
    },
    clearProfile: state => {
      state.profile = null;
    },
  },
});

export const { fetchProfileStart, fetchProfileSuccess, fetchProfileFailure, updateProfile, updateCoins, clearProfile } = userSlice.actions;
export default userSlice.reducer;
