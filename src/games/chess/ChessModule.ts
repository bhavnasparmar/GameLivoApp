// ─── GameModule: Chess ────────────────────────────────────────────────────────

import { GameModule } from '../../types/gameModule';

export const ChessModule: GameModule = {
  gameId: 'chess',
  gameName: 'Chess',
  icon: '♞',
  cardGradient: ['#4A4238', '#211C17'],
  description: 'Strategic chess with multiple time controls and ELO ranking',
  playerTag: '1v1 · Ranked',
  minPlayers: 2,
  maxPlayers: 2,
  category: 'strategy',
  additionalCategories: ['board'],
  offlineSupport: true,
  onlineSupport: true,
  entryFeeSupport: true,
  gameVersion: '1.0.0',
  minimumAppVersion: '1.0.0',
  downloadSizeLabel: '5.1 MB',
  onlineCountLabel: '1,204 online',
  assets: [
    {
      key: 'chess_pieces',
      url: 'https://cdn.gamelivo.com/assets/chess/pieces.webp',
      size: 2_000_000,
      required: true,
    },
    {
      key: 'chess_board',
      url: 'https://cdn.gamelivo.com/assets/chess/board.webp',
      size: 800_000,
      required: true,
    },
    {
      key: 'chess_sounds',
      url: 'https://cdn.gamelivo.com/assets/chess/sounds.zip',
      size: 2_300_000,
      required: false,
    },
  ],

  launchGame(navigation: any): void {
    try {
      navigation.navigate('Game', { screen: 'ChessHome' });
    } catch {
      navigation.navigate('ChessHome');
    }
  },

  async preload(): Promise<void> {
    // Chess engine is bundled — pieces are available offline.
  },

  cleanup(): void {
    // ChessGame screen handles its own cleanup.
  },
};
