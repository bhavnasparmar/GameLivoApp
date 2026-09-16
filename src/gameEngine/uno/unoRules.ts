import { UnoActiveColor, UnoCard, UnoGameState, UnoPlayer } from './unoTypes';

export const UnoRules = {
  /**
   * Evaluates whether a card can be legally played onto the discard pile.
   * A card is valid if:
   * 1. It is a Wild or Wild Draw 4 card.
   * 2. Its color matches the current active table color.
   * 3. Its value matches the current discard pile top card's value.
   */
  canPlayCard: (
    topCard: UnoCard,
    activeColor: UnoActiveColor,
    cardToPlay: UnoCard,
  ): boolean => {
    if (cardToPlay.color === 'wild' || cardToPlay.value === 'wild' || cardToPlay.value === 'wild_draw4') {
      return true;
    }
    if (cardToPlay.color === activeColor) {
      return true;
    }
    if (cardToPlay.value === topCard.value) {
      return true;
    }
    return false;
  },

  /**
   * Returns all playable cards from a player's hand against the current table state.
   */
  getPlayableCards: (
    hand: UnoCard[],
    topCard: UnoCard,
    activeColor: UnoActiveColor,
  ): UnoCard[] => {
    return hand.filter((card) => UnoRules.canPlayCard(topCard, activeColor, card));
  },

  /**
   * Checks if card is an action or wild card
   */
  isSpecialCard: (card: UnoCard): boolean => {
    return ['skip', 'reverse', 'draw2', 'wild', 'wild_draw4'].includes(card.value);
  },

  /**
   * Checks if card requires choosing an active color
   */
  isWildCard: (card: UnoCard): boolean => {
    return card.color === 'wild' || card.value === 'wild' || card.value === 'wild_draw4';
  },

  /**
   * Check if a player has won the round (has 0 cards in hand)
   */
  hasWonRound: (player: UnoPlayer): boolean => {
    return player.hand.length === 0;
  },

  /**
   * Calculates total penalty points contained in a hand
   */
  calculateHandScore: (hand: UnoCard[]): number => {
    return hand.reduce((total, card) => total + (card.scoreValue || 0), 0);
  },

  /**
   * Calculates points awarded to the winner from all opponents' leftover hands
   */
  calculateWinnerPoints: (players: UnoPlayer[], winnerId: string): number => {
    return players.reduce((total, player) => {
      if (player.id !== winnerId) {
        return total + UnoRules.calculateHandScore(player.hand);
      }
      return total;
    }, 0);
  },

  /**
   * Checks if a player can legitimately press "UNO!"
   */
  canShoutUno: (player: UnoPlayer): boolean => {
    return (player.hand.length === 2 || player.hand.length === 1) && !player.hasCalledUno;
  },

  /**
   * Checks if an opponent can be caught for failing to shout "UNO!"
   */
  canCatchUno: (targetPlayer: UnoPlayer): boolean => {
    return targetPlayer.hand.length === 1 && !targetPlayer.hasCalledUno;
  },
};
