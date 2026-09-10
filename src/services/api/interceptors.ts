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

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshToken = await storageService.get<string>(
            STORAGE_KEYS.REFRESH_TOKEN,
          );

          if (!refreshToken) throw new Error('No refresh token');

          const res = await instance.post<{ accessToken: string }>(
            '/auth/refresh',
            { refreshToken },
          );

          const newToken = res.data.accessToken;
          await storageService.set(STORAGE_KEYS.ACCESS_TOKEN, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return instance(originalRequest);
        } catch {
          // Clear tokens and let the auth slice handle logout
          await storageService.remove(STORAGE_KEYS.ACCESS_TOKEN);
          await storageService.remove(STORAGE_KEYS.REFRESH_TOKEN);
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    },
  );
};
