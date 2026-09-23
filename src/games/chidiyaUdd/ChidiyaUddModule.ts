// ─── GameModule: Chidiya Udd ─────────────────────────────────────────────────

import { GameModule } from '../../types/gameModule';

export const ChidiyaUddModule: GameModule = {
  gameId: 'chidiyaUdd',
  gameName: 'Chidiya Udd',
  icon: '🐦',
  cardGradient: ['#F2B705', '#A67200'],
  description: 'Fast-paced Indian reaction game — tap when the bird flies!',
  playerTag: 'Up to 8 players',
  minPlayers: 2,
  maxPlayers: 8,
  category: 'indian',
  additionalCategories: ['casual', 'quick'],
  offlineSupport: false,
  onlineSupport: true,
  entryFeeSupport: false,
  gameVersion: '1.0.0',
  minimumAppVersion: '1.0.0',
  downloadSizeLabel: '1.2 MB',
  onlineCountLabel: '540 online',
  assets: [
    {
      key: 'chidiya_bird',
      url: 'https://cdn.gamelivo.com/assets/chidiya/bird.webp',
      size: 600_000,
      required: true,
    },
    {
      key: 'chidiya_sounds',
      url: 'https://cdn.gamelivo.com/assets/chidiya/sounds.zip',
      size: 600_000,
      required: false,
    },
  ],

  launchGame(navigation: any): void {
    try {
      navigation.navigate('Game', { screen: 'ChidiyaHome' });
    } catch {
      navigation.navigate('ChidiyaHome');
    }
  },

  async preload(): Promise<void> {
    // Lightweight engine — nothing heavy to preload.
  },

  cleanup(): void {
    // ChidiyaGame screen handles socket listener removal.
  },
};
