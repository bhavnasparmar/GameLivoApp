import { LudoGameState, LudoToken, LudoMove, LudoPlayerColor } from './ludoTypes';
import { LUDO_SAFE_CELLS, LUDO_WIN_POSITION, LUDO_START_POSITIONS } from './ludoConstants';

// ─── Ludo Rules ───────────────────────────────────────────────────────────────

export const LudoRules = {
  canMoveToken: (token: LudoToken, diceValue: number): boolean => {
    if (token.status === 'finished') return false;
    if (token.status === 'home') return diceValue === 6;
    const newPos = token.position + diceValue;
    return newPos <= LUDO_WIN_POSITION;
  },

  canCapture: (
    movingToken: LudoToken,
    targetPosition: number,
    allTokens: LudoToken[],
  ): { canCapture: boolean; capturedToken?: LudoToken } => {
    if (LUDO_SAFE_CELLS.includes(targetPosition)) {
      return { canCapture: false };
    }

    const tokensAtTarget = allTokens.filter(
      t => t.position === targetPosition && t.color !== movingToken.color && t.status === 'active',
    );

    if (tokensAtTarget.length === 1) {
      return { canCapture: true, capturedToken: tokensAtTarget[0] };
    }
    return { canCapture: false };
  },

  calculateNewPosition: (token: LudoToken, diceValue: number, color: LudoPlayerColor): number => {
    if (token.status === 'home') {
      return LUDO_START_POSITIONS[color];
    }
    return token.position + diceValue;
  },

  hasAnyValidMove: (state: LudoGameState, playerId: string): boolean => {
    const player = state.players.find(p => p.id === playerId);
    if (!player || state.currentDiceValue === null) return false;
    return player.tokens.some(t => LudoRules.canMoveToken(t, state.currentDiceValue!));
  },

  isHomeStretch: (position: number, color: LudoPlayerColor): boolean => {
    const stretchStart: Record<LudoPlayerColor, number> = {
      red: 51, green: 12, blue: 25, yellow: 38,
    };
    return position > stretchStart[color];
  },
};
