import { UnoGameState, UnoMove, UnoCard } from './unoTypes';

export const UnoRules = {
  canPlayCard: (topCard: UnoCard, cardToPlay: UnoCard): boolean => {
    if (cardToPlay.color === 'wild') return true;
    if (cardToPlay.value === 'wild_draw4') return true;
    return cardToPlay.color === topCard.color || cardToPlay.value === topCard.value;
  },

  isSpecialCard: (card: UnoCard): boolean =>
    ['skip', 'reverse', 'draw2', 'wild', 'wild_draw4'].includes(card.value),

  isWildCard: (card: UnoCard): boolean =>
    card.color === 'wild',

  hasWon: (state: UnoGameState, playerId: string): boolean => {
    const player = state.players.find(p => p.id === playerId);
    return player?.hand.length === 0;
  },
};
