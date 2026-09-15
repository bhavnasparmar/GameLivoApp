import { io, Socket } from 'socket.io-client';
import { Config } from '../../config/env';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { storageService } from '../storage/storageService';
import { SOCKET_EVENTS } from './socketEvents';
import { SocketStatus } from './socketTypes';

// ─── Socket Service ───────────────────────────────────────────────────────────

class SocketService {
  private socket: Socket | null = null;
  private status: SocketStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(): Promise<void> {
    if (this.socket?.connected) return;

    const token = await storageService.get<string>(STORAGE_KEYS.ACCESS_TOKEN);

    this.socket = io(Config.socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 3000,
      timeout: 10000,
    });

    this.bindCoreListeners();
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.status = 'disconnected';
  }

  emit<T = any>(event: string, data?: T): void {
    if (!this.socket?.connected) {
      console.warn(`[Socket] Cannot emit "${event}" — not connected`);
      return;
    }
    if (data !== undefined) {
      this.socket.emit(event, data);
    } else {
      this.socket.emit(event);
    }
  }

  on<T>(event: string, handler: (data: T) => void): void {
    this.socket?.on(event, handler);
  }

  off(event: string, handler?: (...args: unknown[]) => void): void {
    this.socket?.off(event, handler);
  }

  getStatus(): SocketStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  private bindCoreListeners(): void {
    if (!this.socket) return;

    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      this.status = 'connected';
      this.reconnectAttempts = 0;
      console.log('[Socket] Connected');
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      this.status = 'disconnected';
      console.log('[Socket] Disconnected');
    });

    this.socket.on(SOCKET_EVENTS.RECONNECT, () => {
      this.status = 'connected';
      console.log('[Socket] Reconnected');
    });

    this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, (err: Error) => {
      this.status = 'error';
      console.error('[Socket] Connection error:', err.message);
    });
  }
}

// Singleton export
export const socketService = new SocketService();
