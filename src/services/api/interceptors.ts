import { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { storageService } from '../storage/storageService';

// ─── Axios Interceptors ───────────────────────────────────────────────────────

export const setupInterceptors = (instance: AxiosInstance): void => {
  // Request interceptor — inject auth token
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await storageService.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error),
  );

  // Response interceptor — handle 401 token refresh
  instance.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      const isAuthEndpoint =
        originalRequest?.url?.includes('/auth/login') ||
        originalRequest?.url?.includes('/auth/register') ||
        originalRequest?.url?.includes('/auth/refresh') ||
        originalRequest?.url?.includes('/auth/forgot-password') ||
        originalRequest?.url?.includes('/auth/reset-password');

      if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
        originalRequest._retry = true;
        try {
          const refreshToken = await storageService.get<string>(
            STORAGE_KEYS.REFRESH_TOKEN,
          );

          if (!refreshToken) throw new Error('No refresh token');

          const res = await instance.post<any>(
            '/auth/refresh',
            { refreshToken },
          );

          const data = res?.data;
          const newToken =
            data?.accessToken ||
            data?.token ||
            data?.data?.accessToken ||
            data?.data?.token ||
            (typeof data === 'string' ? data : null);

          if (!newToken) throw new Error('No new access token returned');

          await storageService.set(STORAGE_KEYS.ACCESS_TOKEN, newToken);
          const newRefreshToken = data?.refreshToken || data?.data?.refreshToken;
          if (newRefreshToken) {
            await storageService.set(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
          }

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return instance(originalRequest);
        } catch {
          // Clear tokens and stored profile on definitive auth failure
          await storageService.remove(STORAGE_KEYS.ACCESS_TOKEN);
          await storageService.remove(STORAGE_KEYS.REFRESH_TOKEN);
          await storageService.remove(STORAGE_KEYS.USER_ID);
          await storageService.remove(STORAGE_KEYS.USER_PROFILE);
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    },
  );
};
