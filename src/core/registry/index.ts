// ─── Registry Bootstrap ───────────────────────────────────────────────────────
// Import and register all Phase 1 game modules.
// Called ONCE at app startup (in App.tsx or store bootstrap).
// To add a new game: create its GameModule and add one line here.

import { GameRegistry } from './GameRegistry';
import { LudoModule } from '../../games/ludo/LudoModule';
import { ChessModule } from '../../games/chess/ChessModule';
import { UnoModule } from '../../games/uno/UnoModule';
import { ChidiyaUddModule } from '../../games/chidiyaUdd/ChidiyaUddModule';

export function bootstrapGameRegistry(): void {
  GameRegistry.register(LudoModule);
  GameRegistry.register(ChessModule);
  GameRegistry.register(UnoModule);
  GameRegistry.register(ChidiyaUddModule);

  if (__DEV__) {
    console.log(`[GameRegistry] Registered ${GameRegistry.count} games:`,
      GameRegistry.getAllModules().map(m => m.gameId).join(', '));
  }
}

export { GameRegistry };
