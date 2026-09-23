// ─── Game Registry ────────────────────────────────────────────────────────────
// Central registry for all GameModules. The GameHub reads only from here.
// No game-specific logic lives in this file.

import { GameId, GameHubCategory } from '../../types/game';
import { GameModule } from '../../types/gameModule';

// ─── Hub Category → Game Category Mapping ────────────────────────────────────

const HUB_CATEGORY_MAP: Record<GameHubCategory, string[]> = {
  popular: ['ludo', 'chess', 'uno', 'chidiyaUdd', 'carrom', 'snakeLadder'],
  indian:  ['chidiyaUdd', 'chorChithya', 'rajaMantriChorSipahi', 'fingerCricket', 'tambola', 'carrom'],
  board:   ['board', 'strategy'],
  card:    ['card'],
};

// ─── Registry ─────────────────────────────────────────────────────────────────

class GameRegistryClass {
  private modules = new Map<GameId, GameModule>();

  /**
   * Register a game module. Called once per game during app bootstrap.
   * Later registrations overwrite earlier ones (useful for hot-reload in dev).
   */
  register(module: GameModule): void {
    this.modules.set(module.gameId, module);
  }

  /** Get a single module by its ID */
  getModule(gameId: GameId): GameModule | undefined {
    return this.modules.get(gameId);
  }

  /** All registered modules */
  getAllModules(): GameModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Returns modules for the given hub tab category.
   * 'popular' returns a curated ordered list.
   * Other categories match on GameModule.category or additionalCategories.
   */
  getModulesByHubCategory(hubCategory: GameHubCategory): GameModule[] {
    if (hubCategory === 'popular') {
      const popularIds = HUB_CATEGORY_MAP.popular as GameId[];
      return popularIds
        .map(id => this.modules.get(id))
        .filter((m): m is GameModule => m !== undefined);
    }

    const categoryValues = HUB_CATEGORY_MAP[hubCategory];

    return Array.from(this.modules.values()).filter(m => {
      const allCats = [m.category, ...(m.additionalCategories ?? [])];
      return allCats.some(c => categoryValues.includes(c));
    });
  }

  /** Check if a game is registered */
  isRegistered(gameId: GameId): boolean {
    return this.modules.has(gameId);
  }

  /** Total number of registered games */
  get count(): number {
    return this.modules.size;
  }
}

// Singleton
export const GameRegistry = new GameRegistryClass();
