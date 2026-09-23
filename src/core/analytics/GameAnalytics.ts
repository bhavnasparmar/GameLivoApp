// ─── GameAnalytics ────────────────────────────────────────────────────────────
// Structured analytics events for the Game Hub.
// Every event includes gameId to enable per-game funnel analysis.

import { GameId } from '../../types/game';
import { analyticsService } from '../../services/analytics/analyticsService';

// ─── Event Names ──────────────────────────────────────────────────────────────

export const GAME_ANALYTICS_EVENTS = {
  GAME_VIEW:               'game_view',
  GAME_DOWNLOAD_STARTED:   'game_download_started',
  GAME_DOWNLOAD_COMPLETED: 'game_download_completed',
  GAME_DOWNLOAD_FAILED:    'game_download_failed',
  GAME_OPENED:             'game_opened',
  GAME_STARTED:            'game_started',
  GAME_COMPLETED:          'game_completed',
  GAME_ABANDONED:          'game_abandoned',
  GAME_UPDATED:            'game_updated',
  GAME_HUB_VIEWED:         'game_hub_viewed',
  GAME_CATEGORY_SELECTED:  'game_category_selected',
} as const;

// ─── Analytics ────────────────────────────────────────────────────────────────

class GameAnalyticsClass {
  private track(event: string, params: Record<string, unknown>): void {
    try {
      // analyticsService is the existing analytics integration
      if (analyticsService && typeof analyticsService.track === 'function') {
        analyticsService.track(event, params);
      } else {
        // Fallback: log in dev, silent in prod
        if (__DEV__) {
          console.log(`[Analytics] ${event}`, params);
        }
      }
    } catch {
      // Analytics must never crash the app
    }
  }

  trackGameView(gameId: GameId): void {
    this.track(GAME_ANALYTICS_EVENTS.GAME_VIEW, { gameId });
  }

  trackGameDownloadStarted(gameId: GameId): void {
    this.track(GAME_ANALYTICS_EVENTS.GAME_DOWNLOAD_STARTED, { gameId });
  }

  trackGameDownloadCompleted(gameId: GameId, durationMs: number): void {
    this.track(GAME_ANALYTICS_EVENTS.GAME_DOWNLOAD_COMPLETED, { gameId, durationMs });
  }

  trackGameDownloadFailed(gameId: GameId, reason: string): void {
    this.track(GAME_ANALYTICS_EVENTS.GAME_DOWNLOAD_FAILED, { gameId, reason });
  }

  trackGameOpened(gameId: GameId): void {
    this.track(GAME_ANALYTICS_EVENTS.GAME_OPENED, { gameId });
  }

  trackGameStarted(gameId: GameId, mode: string): void {
    this.track(GAME_ANALYTICS_EVENTS.GAME_STARTED, { gameId, mode });
  }

  trackGameCompleted(gameId: GameId, result: { won: boolean; duration: number }): void {
    this.track(GAME_ANALYTICS_EVENTS.GAME_COMPLETED, { gameId, ...result });
  }

  trackGameAbandoned(gameId: GameId, elapsedMs: number): void {
    this.track(GAME_ANALYTICS_EVENTS.GAME_ABANDONED, { gameId, elapsedMs });
  }

  trackGameUpdated(gameId: GameId, fromVersion: string, toVersion: string): void {
    this.track(GAME_ANALYTICS_EVENTS.GAME_UPDATED, { gameId, fromVersion, toVersion });
  }

  trackHubViewed(): void {
    this.track(GAME_ANALYTICS_EVENTS.GAME_HUB_VIEWED, {});
  }

  trackCategorySelected(category: string): void {
    this.track(GAME_ANALYTICS_EVENTS.GAME_CATEGORY_SELECTED, { category });
  }
}

export const GameAnalytics = new GameAnalyticsClass();
