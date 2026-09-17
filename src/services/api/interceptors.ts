import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { storageService } from '../storage/storageService';

// ─── Axios Interceptors ───────────────────────────────────────────────────────

interface PendingRequest {
  resolve: (token: string) => void;
  reject: (err: any) => void;
}

let isRefreshing = false;
let failedQueue: PendingRequest[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const setupInterceptors = (instance: AxiosInstance): void => {
  // Request interceptor — inject auth token
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await storageService.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error),
  );

  // Response interceptor — handle 401 token refresh with request queuing
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

      if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
        if (isRefreshing) {
          // If a refresh is already in flight, queue this request until refresh completes
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (newToken: string) => {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                resolve(instance(originalRequest));
              },
              reject: (err: any) => {
                reject(err);
              },
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = await storageService.get<string>(
            STORAGE_KEYS.REFRESH_TOKEN,
          );

          if (!refreshToken) {
            throw new Error('No refresh token available in storage');
          }

          const baseURL = instance.defaults.baseURL || '';
          const refreshUrl = baseURL.endsWith('/')
            ? `${baseURL}auth/refresh`
            : `${baseURL}/auth/refresh`;

          // Use raw axios instance to prevent interceptor loops
          const res = await axios.post<any>(
            refreshUrl,
            { refreshToken },
            {
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'ngrok-skip-browser-warning': 'true',
              },
              timeout: 10000,
            },
          );

          const resData = res?.data;
          const data = resData?.data || resData;
          const rawTokens = data?.tokens || data;

          const newToken =
            rawTokens?.accessToken ||
            rawTokens?.token ||
            data?.accessToken ||
            data?.token ||
            (typeof resData === 'string' ? resData : null);

          if (!newToken) {
            throw new Error('No new access token returned from refresh endpoint');
          }

          // Persist refreshed tokens
          await storageService.set(STORAGE_KEYS.ACCESS_TOKEN, newToken);
          const newRefreshToken = rawTokens?.refreshToken || data?.refreshToken;
          if (newRefreshToken) {
            await storageService.set(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
          }

          // Set default header for future requests
          instance.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Notify and replay all queued pending requests
          processQueue(null, newToken);

          return instance(originalRequest);
        } catch (refreshError) {
          // Reject all queued requests
          processQueue(refreshError, null);

          // Clear tokens and stored profile on definitive auth failure
          await storageService.remove(STORAGE_KEYS.ACCESS_TOKEN);
          await storageService.remove(STORAGE_KEYS.REFRESH_TOKEN);
          await storageService.remove(STORAGE_KEYS.USER_ID);
          await storageService.remove(STORAGE_KEYS.USER_PROFILE);

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );
};
