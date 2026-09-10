import { UnoGameState, UnoMove } from './unoTypes';
import { UnoRules } from './unoRules';
import { BaseGameEngine, MoveResult } from '../common/gameTypes';

class UnoEngineImpl implements BaseGameEngine<UnoGameState, UnoMove> {
  getInitialState(_playerIds: string[]): UnoGameState {
    // TODO: Build and shuffle full Uno deck, deal 7 cards each
    throw new Error('UnoEngine.getInitialState — not yet implemented');
  }

  applyMove(state: UnoGameState, move: UnoMove, playerId: string): { newState: UnoGameState; result: MoveResult } {
    const player = state.players.find(p => p.id === playerId);
    const card = player?.hand.find(c => c.id === move.cardId);
    if (!player || !card) return { newState: state, result: { isValid: false, reason: 'Invalid card' } };
    if (!UnoRules.canPlayCard(state.topCard, card)) return { newState: state, result: { isValid: false, reason: 'Card cannot be played' } };

    const newState = JSON.parse(JSON.stringify(state)) as UnoGameState;
    const newPlayer = newState.players.find(p => p.id === playerId)!;
    newPlayer.hand = newPlayer.hand.filter(c => c.id !== move.cardId);
    newState.discardPile.push(card);
    newState.topCard = { ...card, color: move.chosenColor ?? card.color };

    const isGameOver = UnoRules.hasWon(newState, playerId);
    if (isGameOver) newState.winnerId = playerId;

    return { newState, result: { isValid: true, isGameOver, winnerId: isGameOver ? playerId : undefined } };
  }

  isValidMove(state: UnoGameState, move: UnoMove, playerId: string): boolean {
    const player = state.players.find(p => p.id === playerId);
    const card = player?.hand.find(c => c.id === move.cardId);
    return !!card && UnoRules.canPlayCard(state.topCard, card);
  }

  isGameOver(state: UnoGameState): boolean {
    return !!state.winnerId;
  }

  getWinner(state: UnoGameState): string | null {
    return state.winnerId;
  }
}

export const unoEngine = new UnoEngineImpl();
