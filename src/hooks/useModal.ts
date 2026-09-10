import { modalService, ModalConfig } from '../services/modal/modalService';

// ─── useModal Hook ────────────────────────────────────────────────────────────

export const useModal = () => ({
  show: (config: ModalConfig) => modalService.show(config),
  hide: () => modalService.hide(),
  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    cancelText?: string,
  ) => modalService.confirm(title, message, onConfirm, confirmText, cancelText),
});
