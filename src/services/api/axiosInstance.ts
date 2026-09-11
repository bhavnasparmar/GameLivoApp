import axios from 'axios';
import { Config } from '../../config/env';
import { TIMEOUTS } from '../../constants/appConstants';
import { setupInterceptors } from './interceptors';

// ─── Axios Instance ───────────────────────────────────────────────────────────

export const axiosInstance = axios.create({
  baseURL: Config.apiBaseUrl,
  timeout: TIMEOUTS.API_REQUEST,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Attach request / response interceptors
setupInterceptors(axiosInstance);

export default axiosInstance;
