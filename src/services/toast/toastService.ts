// ─── Toast Service ────────────────────────────────────────────────────────────
// Decoupled from toast library — screens call toastService.* directly.
// The actual library call is centralised here; swap without touching any screen.

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  position?: 'top' | 'bottom';
}

// Callback set by GlobalToast component mounted in App.tsx
let _showToast: ((type: ToastType, message: string, options?: ToastOptions) => void) | null = null;

export const toastService = {
  // Called by GlobalToast to register itself
  register: (fn: typeof _showToast): void => {
    _showToast = fn;
  },

  success: (message: string, options?: ToastOptions): void => {
    _showToast?.('success', message, options);
  },

  error: (message: string, options?: ToastOptions): void => {
    _showToast?.('error', message, options);
  },

  info: (message: string, options?: ToastOptions): void => {
    _showToast?.('info', message, options);
  },

  warning: (message: string, options?: ToastOptions): void => {
    _showToast?.('warning', message, options);
  },
};
