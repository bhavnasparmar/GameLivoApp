import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectIsLoggedIn, selectAuthLoading, selectAuthError } from '../redux/selectors/authSelectors';
import { loginStart, loginSuccess, loginFailure, logout as logoutAction } from '../redux/slices/authSlice';
import { clearProfile } from '../redux/slices/userSlice';
import { authService } from '../services/auth/authService';
import { LoginRequest, RegisterRequest } from '../types/auth';

// ─── useAuth Hook ─────────────────────────────────────────────────────────────

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  const login = useCallback(async (payload: LoginRequest) => {
    dispatch(loginStart());
    try {
      const { tokens, user } = await authService.login(payload);
      dispatch(loginSuccess({ tokens, userId: user.id }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      dispatch(loginFailure(message));
    }
  }, [dispatch]);

  const logout = useCallback(async () => {
    await authService.logout();
    dispatch(logoutAction());
    dispatch(clearProfile());
  }, [dispatch]);

  return { isLoggedIn, isLoading, error, login, logout };
};
