// ─── GameDownloadManager ──────────────────────────────────────────────────────
// App Store compliant asset manager.
// Downloads only static assets (images/sounds) — never executable JS.
// Game code is always distributed through the app store.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameId } from '../../types/game';
import { GameAssetState, GameModule } from '../../types/gameModule';
import { GameRegistry } from '../registry/GameRegistry';

const STORAGE_PREFIX = '@gamelivo:download:';
const PROGRESS_PREFIX = '@gamelivo:progress:';

// ─── Internal State ───────────────────────────────────────────────────────────

interface PersistedAssetState {
  state: GameAssetState;
  version: string;
  downloadedAt?: number;
}

type ProgressListener = (gameId: GameId, progress: number, state: GameAssetState) => void;

// ─── Manager ──────────────────────────────────────────────────────────────────

class GameDownloadManagerClass {
  private listeners = new Set<ProgressListener>();
  private activeDownloads = new Map<GameId, AbortController>();

  // ─── Public API ────────────────────────────────────────────────────────────

  /** Returns current asset state for a game */
  async getGameStatus(gameId: GameId): Promise<GameAssetState> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_PREFIX + gameId);
      if (!raw) return GameAssetState.NOT_INSTALLED;
      const stored: PersistedAssetState = JSON.parse(raw);

      // Check if a newer version is available
      const module = GameRegistry.getModule(gameId);
      if (module && stored.state === GameAssetState.READY) {
        if (stored.version !== module.gameVersion) {
          await this.setState(gameId, GameAssetState.UPDATE_AVAILABLE, module.gameVersion);
          return GameAssetState.UPDATE_AVAILABLE;
        }
      }

      return stored.state;
    } catch {
      return GameAssetState.NOT_INSTALLED;
    }
  }

  /** Returns 0–100 download progress */
  async getDownloadProgress(gameId: GameId): Promise<number> {
    try {
      const raw = await AsyncStorage.getItem(PROGRESS_PREFIX + gameId);
      return raw ? parseInt(raw, 10) : 0;
    } catch {
      return 0;
    }
  }

  /** Returns all games with READY state */
  async getInstalledGames(): Promise<GameId[]> {
    const all = GameRegistry.getAllModules();
    const results: GameId[] = [];
    for (const module of all) {
      const state = await this.getGameStatus(module.gameId);
      if (state === GameAssetState.READY) results.push(module.gameId);
    }
    return results;
  }

  /**
   * Download game assets (images, sounds).
   * For Phase 1 games that are fully bundled, this immediately marks READY.
   * For future remote-asset games, this simulates/implements actual download.
   */
  async downloadGame(gameId: GameId): Promise<void> {
    const module = GameRegistry.getModule(gameId);
    if (!module) throw new Error(`Game "${gameId}" is not registered.`);

    const current = await this.getGameStatus(gameId);
    if (current === GameAssetState.DOWNLOADING) return; // Already running

    const controller = new AbortController();
    this.activeDownloads.set(gameId, controller);

    try {
      await this.setState(gameId, GameAssetState.DOWNLOADING, module.gameVersion);
      this.emit(gameId, 0, GameAssetState.DOWNLOADING);

      // Phase 1: all game code is bundled → assets start READY.
      // Simulate a quick download for UX (asset sizes are small).
      await this.simulateAssetDownload(gameId, module, controller.signal);

      if (!controller.signal.aborted) {
        await this.setState(gameId, GameAssetState.READY, module.gameVersion);
        this.emit(gameId, 100, GameAssetState.READY);
      }
    } catch (err: any) {
      if (!controller.signal.aborted) {
        await this.setState(gameId, GameAssetState.ERROR, module.gameVersion);
        this.emit(gameId, 0, GameAssetState.ERROR);
      }
    } finally {
      this.activeDownloads.delete(gameId);
    }
  }

  async updateGame(gameId: GameId): Promise<void> {
    // Delete existing → re-download
    await this.setState(gameId, GameAssetState.NOT_INSTALLED, '');
    await AsyncStorage.removeItem(PROGRESS_PREFIX + gameId);
    await this.downloadGame(gameId);
  }

  async deleteGame(gameId: GameId): Promise<void> {
    // Cancel any active download
    this.activeDownloads.get(gameId)?.abort();
    this.activeDownloads.delete(gameId);
    await AsyncStorage.removeItem(STORAGE_PREFIX + gameId);
    await AsyncStorage.removeItem(PROGRESS_PREFIX + gameId);
    this.emit(gameId, 0, GameAssetState.NOT_INSTALLED);
  }

  /**
   * Mark a Phase 1 bundled game as READY immediately.
   * Called during app bootstrap for Ludo/Chess/UNO/ChidiyaUdd.
   */
  async markBundledAsReady(gameId: GameId): Promise<void> {
    const module = GameRegistry.getModule(gameId);
    if (!module) return;
    const current = await this.getGameStatus(gameId);
    if (current === GameAssetState.NOT_INSTALLED) {
      await this.setState(gameId, GameAssetState.READY, module.gameVersion);
    }
  }

  // ─── Listeners ─────────────────────────────────────────────────────────────

  addProgressListener(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private async setState(gameId: GameId, state: GameAssetState, version: string): Promise<void> {
    const payload: PersistedAssetState = {
      state,
      version,
      downloadedAt: state === GameAssetState.READY ? Date.now() : undefined,
    };
    await AsyncStorage.setItem(STORAGE_PREFIX + gameId, JSON.stringify(payload));
  }

  private emit(gameId: GameId, progress: number, state: GameAssetState): void {
    this.listeners.forEach(l => l(gameId, progress, state));
    // Persist progress
    AsyncStorage.setItem(PROGRESS_PREFIX + gameId, String(progress)).catch(() => {});
  }

  /**
   * Simulates downloading game assets in steps.
   * For Phase 1, all assets are bundled, so this just advances progress.
   * Replace with actual `fetch` + file-write for real remote assets.
   */
  private async simulateAssetDownload(
    gameId: GameId,
    module: GameModule,
    signal: AbortSignal,
  ): Promise<void> {
    const totalAssets = module.assets.length || 1;
    for (let i = 0; i < totalAssets; i++) {
      if (signal.aborted) return;

      // Simulate chunk-by-chunk progress per asset
      const assetProgress = Math.round(((i + 1) / totalAssets) * 100);

      // Step through progress in ~20 increments per asset
      const startPct = Math.round((i / totalAssets) * 100);
      const steps = 5;
      for (let s = 1; s <= steps; s++) {
        if (signal.aborted) return;
        const pct = startPct + Math.round((s / steps) * (assetProgress - startPct));
        this.emit(gameId, pct, GameAssetState.DOWNLOADING);
        await delay(80);
      }
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Singleton
export const GameDownloadManager = new GameDownloadManagerClass();
