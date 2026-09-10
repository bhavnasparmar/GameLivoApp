import { SnakeLadderGameState, SnakeLadderMove, SnakeLadderPlayer } from './snakeLadderTypes';
import { SNAKE_POSITIONS, LADDER_POSITIONS, WINNING_POSITION } from './snakeLadderRules';
import { BaseGameEngine, MoveResult } from '../common/gameTypes';
import { TurnManager } from '../common/turnManager';
import { NumberUtils } from '../../utils/numberUtils';

class SnakeLadderEngineImpl implements BaseGameEngine<SnakeLadderGameState, SnakeLadderMove> {
  getInitialState(playerIds: string[]): SnakeLadderGameState {
    const colors = ['#E5584A', '#27AE60', '#3A7BD5', '#E5A93D'];
    return {
      players: playerIds.map((id, i) => ({ id, position: 0, color: colors[i] })),
      currentPlayerId: playerIds[0],
      diceValue: null,
      snakes: SNAKE_POSITIONS,
      ladders: LADDER_POSITIONS,
      winnerId: null,
      turnNumber: 1,
    };
  }

  applyMove(state: SnakeLadderGameState, move: SnakeLadderMove, playerId: string): { newState: SnakeLadderGameState; result: MoveResult } {
    const newState = JSON.parse(JSON.stringify(state)) as SnakeLadderGameState;
    const player = newState.players.find(p => p.id === playerId)!;
    let newPos = player.position + move.diceValue;

    if (newPos > WINNING_POSITION) {
      // Bounce back
      newPos = WINNING_POSITION - (newPos - WINNING_POSITION);
    }

    if (newPos === WINNING_POSITION) {
      player.position = WINNING_POSITION;
      newState.winnerId = playerId;
      return { newState, result: { isValid: true, isGameOver: true, winnerId: playerId } };
    }

    // Check snake
    if (newState.snakes[newPos]) newPos = newState.snakes[newPos];
    // Check ladder
    if (newState.ladders[newPos]) newPos = newState.ladders[newPos];

    player.position = newPos;
    newState.diceValue = move.diceValue;

    // Advance turn
    const turnMgr = new TurnManager(newState.players.map(p => p.id));
    turnMgr.setCurrentPlayer(playerId);
    newState.currentPlayerId = turnMgr.next();
    newState.turnNumber += 1;

    return { newState, result: { isValid: true, nextPlayerId: newState.currentPlayerId } };
  }

  isValidMove(_state: SnakeLadderGameState, _move: SnakeLadderMove, _playerId: string): boolean {
    return true;
  }

  isGameOver(state: SnakeLadderGameState): boolean {
    return !!state.winnerId;
  }

  getWinner(state: SnakeLadderGameState): string | null {
    return state.winnerId;
  }
}

export const snakeLadderEngine = new SnakeLadderEngineImpl();
