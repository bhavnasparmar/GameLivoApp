// ─── GameModule: UNO ─────────────────────────────────────────────────────────

import { GameModule } from '../../types/gameModule';

export const UnoModule: GameModule = {
  gameId: 'uno',
  gameName: 'Uno',
  icon: '🂡',
  cardGradient: ['#E6483A', '#8F1D13'],
  description: 'Original UNO-style card game — play wild cards and call UNO!',
  playerTag: '2–6 players',
  minPlayers: 2,
  maxPlayers: 6,
  category: 'card',
  offlineSupport: true,
  onlineSupport: true,
  entryFeeSupport: false,
  gameVersion: '1.0.0',
  minimumAppVersion: '1.0.0',
  downloadSizeLabel: '2.4 MB',
  onlineCountLabel: '2,110 online',
  assets: [
    {
      key: 'uno_cards',
      url: 'https://cdn.gamelivo.com/assets/uno/cards.webp',
      size: 1_500_000,
      required: true,
    },
    {
      key: 'uno_sounds',
      url: 'https://cdn.gamelivo.com/assets/uno/sounds.zip',
      size: 900_000,
      required: false,
    },
  ],

  launchGame(navigation: any): void {
    try {
      navigation.navigate('Game', { screen: 'UnoHome' });
    } catch {
      navigation.navigate('UnoHome');
    }
  },

  async preload(): Promise<void> {
    // UNO card assets are bundled.
  },

  cleanup(): void {
    // UnoGame screen handles its own cleanup.
  },
};
