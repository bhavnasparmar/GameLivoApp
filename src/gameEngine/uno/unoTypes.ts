// ─── Uno Types ────────────────────────────────────────────────────────────────

export type UnoColor = 'red' | 'green' | 'blue' | 'yellow' | 'wild';
export type UnoCardValue = '0'|'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'skip'|'reverse'|'draw2'|'wild'|'wild_draw4';

export interface UnoCard {
  id: string;
  color: UnoColor;
  value: UnoCardValue;
}

export interface UnoPlayer {
  id: string;
  hand: UnoCard[];
  hasCalledUno: boolean;
}

export interface UnoMove {
  cardId: string;
  chosenColor?: UnoColor; // For wild cards
}

export interface UnoGameState {
  players: UnoPlayer[];
  deck: UnoCard[];
  discardPile: UnoCard[];
  currentPlayerId: string;
  direction: 1 | -1; // 1 = clockwise, -1 = counter-clockwise
  pendingDrawCount: number; // For stacked draw 2/4
  topCard: UnoCard;
  turnNumber: number;
  winnerId: string | null;
}
