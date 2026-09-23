// ─── GameModule: Ludo ─────────────────────────────────────────────────────────
// Wraps the existing Ludo engine. Hub uses this; game logic stays in gameEngine/.

import { GameModule } from '../../types/gameModule';
import { GameAssetState } from '../../types/gameModule';

export const LudoModule: GameModule = {
  gameId: 'ludo',
  gameName: 'Ludo',
  icon: '⛃',
  cardGradient: ['#2668D9', '#123A80'],
  description: 'Classic Ludo board game with animated tokens',
  playerTag: '2–4 players',
  minPlayers: 2,
  maxPlayers: 4,
  category: 'board',
  additionalCategories: ['strategy'],
  offlineSupport: true,
  onlineSupport: true,
  entryFeeSupport: true,
  gameVersion: '1.0.0',
  minimumAppVersion: '1.0.0',
  downloadSizeLabel: '3.8 MB',
  onlineCountLabel: '3,890 online',
  assets: [
    {
      key: 'ludo_board',
      url: 'https://cdn.gamelivo.com/assets/ludo/board.webp',
      size: 1_200_000,
      required: true,
    },
    {
      key: 'ludo_dice',
      url: 'https://cdn.gamelivo.com/assets/ludo/dice.webp',
      size: 400_000,
      required: true,
    },
    {
      key: 'ludo_sounds',
      url: 'https://cdn.gamelivo.com/assets/ludo/sounds.zip',
      size: 2_200_000,
      required: false,
    },
  ],

  launchGame(navigation: any): void {
    try {
      navigation.navigate('Game', { screen: 'LudoHome' });
    } catch {
      navigation.navigate('LudoHome');
    }
  },

  async preload(): Promise<void> {
    // Ludo engine is bundled — assets are already available.
    // Future: prefetch remote board skin here.
  },

  cleanup(): void {
    // The LudoGame screen handles its own cleanup via useEffect return.
    // This is a safety net in case the hub navigates away directly.
  },
};
