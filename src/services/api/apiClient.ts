import { AxiosResponse } from 'axios';
import axiosInstance from './axiosInstance';

// ─── Generic API Client ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
}

const extractData = <T>(res: AxiosResponse<any>): T => {
  if (res.data && typeof res.data === 'object') {
    if ('data' in res.data && res.data.data !== undefined) {
      return res.data.data;
    }
  }
  return res.data;
};

const apiClient = {
  get: async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
    const res = await axiosInstance.get(url, { params });
    return extractData<T>(res);
  },

  post: async <T>(url: string, body?: unknown): Promise<T> => {
    const res = await axiosInstance.post(url, body);
    return extractData<T>(res);
  },

  put: async <T>(url: string, body?: unknown): Promise<T> => {
    const res = await axiosInstance.put(url, body);
    return extractData<T>(res);
  },

  patch: async <T>(url: string, body?: unknown): Promise<T> => {
    const res = await axiosInstance.patch(url, body);
    return extractData<T>(res);
  },

  delete: async <T>(url: string): Promise<T> => {
    const res = await axiosInstance.delete(url);
    return extractData<T>(res);
  },

  upload: async <T>(url: string, formData: FormData): Promise<T> => {
    const res = await axiosInstance.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return extractData<T>(res);
  },
};

export default apiClient;
