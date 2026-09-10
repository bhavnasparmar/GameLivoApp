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

const apiClient = {
  get: async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
    const res: AxiosResponse<ApiResponse<T>> = await axiosInstance.get(url, { params });
    return res.data.data;
  },

  post: async <T>(url: string, body?: unknown): Promise<T> => {
    const res: AxiosResponse<ApiResponse<T>> = await axiosInstance.post(url, body);
    return res.data.data;
  },

  put: async <T>(url: string, body?: unknown): Promise<T> => {
    const res: AxiosResponse<ApiResponse<T>> = await axiosInstance.put(url, body);
    return res.data.data;
  },

  patch: async <T>(url: string, body?: unknown): Promise<T> => {
    const res: AxiosResponse<ApiResponse<T>> = await axiosInstance.patch(url, body);
    return res.data.data;
  },

  delete: async <T>(url: string): Promise<T> => {
    const res: AxiosResponse<ApiResponse<T>> = await axiosInstance.delete(url);
    return res.data.data;
  },

  upload: async <T>(url: string, formData: FormData): Promise<T> => {
    const res: AxiosResponse<ApiResponse<T>> = await axiosInstance.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
};

export default apiClient;
