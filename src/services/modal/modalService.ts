// ─── Modal Service ────────────────────────────────────────────────────────────
// Imperative modal API — no need to place <Modal> in every screen.

export type ModalType = 'confirmation' | 'success' | 'error' | 'game_mode' | 'player_invite' | 'report_player' | 'logout' | 'delete_account';

export interface ModalConfig {
  type: ModalType;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  data?: Record<string, unknown>;
}

// Callback set by ModalProvider in App.tsx
let _showModal: ((config: ModalConfig) => void) | null = null;
let _hideModal: (() => void) | null = null;

export const modalService = {
  register: (show: typeof _showModal, hide: typeof _hideModal): void => {
    _showModal = show;
    _hideModal = hide;
  },

  show: (config: ModalConfig): void => {
    _showModal?.(config);
  },

  hide: (): void => {
    _hideModal?.();
  },

  // Convenience shorthands
  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
  ): void => {
    modalService.show({ type: 'confirmation', title, message, confirmText, cancelText, onConfirm });
  },
};
