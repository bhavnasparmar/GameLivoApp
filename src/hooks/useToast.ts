import { toastService } from '../services/toast/toastService';

// ─── useToast Hook ────────────────────────────────────────────────────────────

export const useToast = () => ({
  success: (message: string) => toastService.success(message),
  error: (message: string) => toastService.error(message),
  info: (message: string) => toastService.info(message),
  warning: (message: string) => toastService.warning(message),
});
