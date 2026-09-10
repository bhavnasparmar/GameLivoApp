import { useCallback, useEffect } from 'react';
import { socketService } from '../services/socket/socketService';

// ─── useSocket Hook ───────────────────────────────────────────────────────────

export const useSocket = () => {
  const emit = useCallback(<T>(event: string, data: T) => {
    socketService.emit(event, data);
  }, []);

  const on = useCallback(<T>(event: string, handler: (data: T) => void) => {
    socketService.on(event, handler);
    return () => socketService.off(event, handler as (...args: unknown[]) => void);
  }, []);

  const isConnected = socketService.isConnected();

  return { emit, on, isConnected, status: socketService.getStatus() };
};
