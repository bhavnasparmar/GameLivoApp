import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, AuthTokens } from '../../types/auth';

const initialState: AuthState = {
  isLoggedIn: false,
  isLoading: false,
  tokens: null,
  userId: null,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: state => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ tokens: AuthTokens; userId: string }>) => {
      state.isLoading = false;
      state.isLoggedIn = true;
      state.tokens = action.payload.tokens;
      state.userId = action.payload.userId;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: state => {
      state.isLoggedIn = false;
      state.tokens = null;
      state.userId = null;
      state.error = null;
    },
    tokenRefreshed: (state, action: PayloadAction<AuthTokens>) => {
      state.tokens = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
    stopLoading: state => {
      state.isLoading = false;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, tokenRefreshed, clearError, stopLoading } = authSlice.actions;
export default authSlice.reducer;
