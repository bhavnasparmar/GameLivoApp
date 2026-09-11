import { LudoGameState, LudoPlayer, LudoToken, LudoMove, LudoPlayerColor } from './ludoTypes';
import { LUDO_TOKENS_PER_PLAYER, LUDO_WIN_POSITION } from './ludoConstants';
import { LudoRules } from './ludoRules';
import { MoveResult, BaseGameEngine } from '../common/gameTypes';
import { TurnManager } from '../common/turnManager';
import { NumberUtils } from '../../utils/numberUtils';

// ─── Ludo Engine ──────────────────────────────────────────────────────────────

const COLORS: LudoPlayerColor[] = ['red', 'green', 'blue', 'yellow'];

const createPlayer = (id: string, color: LudoPlayerColor): LudoPlayer => ({
  id,
  color,
  tokens: Array.from({ length: LUDO_TOKENS_PER_PLAYER }, (_, i) => ({
    id: `${color}_${i}`,
    color,
    position: -1,
    status: 'home',
  })),
  isFinished: false,
});

class LudoEngineImpl implements BaseGameEngine<LudoGameState, LudoMove> {
  getInitialState(playerIds: string[]): LudoGameState {
    const players: LudoPlayer[] = playerIds.map((id, idx) =>
      createPlayer(id, COLORS[idx]),
    );
    return {
      players,
      currentPlayerId: playerIds[0],
      currentDiceValue: null,
      diceRolled: false,
      consecutiveSixes: 0,
      finishedPlayers: [],
      turnNumber: 1,
    };
  }

  rollDice(state: LudoGameState): { newState: LudoGameState; value: number } {
    const value = NumberUtils.rollDice();
    const newState: LudoGameState = {
      ...state,
      currentDiceValue: value,
      diceRolled: true,
      consecutiveSixes: value === 6 ? state.consecutiveSixes + 1 : 0,
    };
    return { newState, value };
  }

  applyMove(
    state: LudoGameState,
    move: LudoMove,
    playerId: string,
  ): { newState: LudoGameState; result: MoveResult } {
    const { isValid } = this._validateMove(state, move, playerId);
    if (!isValid) {
      return { newState: state, result: { isValid: false, reason: 'Invalid move' } };
    }

    let newState = JSON.parse(JSON.stringify(state)) as LudoGameState;
    const player = newState.players.find(p => p.id === playerId)!;
    const token = player.tokens.find(t => t.id === move.tokenId)!;

    // Move token
    if (token.status === 'home') token.status = 'active';
    token.position = move.toPosition;

    // Check win
    if (token.position >= LUDO_WIN_POSITION) {
      token.status = 'finished';
      token.position = LUDO_WIN_POSITION;
    }

    // Check if player finished all tokens
    const allFinished = player.tokens.every(t => t.status === 'finished');
    if (allFinished) {
      player.isFinished = true;
      player.rank = newState.finishedPlayers.length + 1;
      newState.finishedPlayers.push(playerId);
    }

    // Check capture
    const allTokens = newState.players.flatMap(p => p.tokens);
    const { canCapture, capturedToken } = LudoRules.canCapture(token, move.toPosition, allTokens);
    if (canCapture && capturedToken) {
      capturedToken.position = -1;
      capturedToken.status = 'home';
    }
    const isGameOver = this.isGameOver(newState);
    const winnerId = isGameOver ? (this.getWinner(newState) || undefined) : undefined;

    // Advance turn (unless dice was 6 and below 3 consecutive)
    const keepTurn = state.currentDiceValue === 6 && newState.consecutiveSixes < 3;
    if (!keepTurn) {
      const turnMgr = new TurnManager(newState.players.filter(p => !p.isFinished).map(p => p.id));
      turnMgr.setCurrentPlayer(playerId);
      newState.currentPlayerId = turnMgr.next();
      newState.turnNumber += 1;
    }
    newState.diceRolled = false;
    newState.currentDiceValue = null;

    return {
      newState,
      result: { isValid: true, nextPlayerId: newState.currentPlayerId, isGameOver, winnerId },
    };
  }

  isValidMove(state: LudoGameState, move: LudoMove, playerId: string): boolean {
    return this._validateMove(state, move, playerId).isValid;
  }

  isGameOver(state: LudoGameState): boolean {
    const remaining = state.players.filter(p => !p.isFinished);
    return remaining.length <= 1;
  }

  getWinner(state: LudoGameState): string | null {
    return state.finishedPlayers[0] ?? null;
  }

  private _validateMove(
    state: LudoGameState,
    move: LudoMove,
    playerId: string,
  ): { isValid: boolean; reason?: string } {
    if (state.currentPlayerId !== playerId) return { isValid: false, reason: 'Not your turn' };
    if (!state.diceRolled || state.currentDiceValue === null) return { isValid: false, reason: 'Roll dice first' };
    const player = state.players.find(p => p.id === playerId);
    if (!player) return { isValid: false, reason: 'Player not found' };
    const token = player.tokens.find(t => t.id === move.tokenId);
    if (!token) return { isValid: false, reason: 'Token not found' };
    if (!LudoRules.canMoveToken(token, state.currentDiceValue)) return { isValid: false, reason: 'Cannot move this token' };
    return { isValid: true };
  }
}

export const ludoEngine = new LudoEngineImpl();
