import {
  LudoGameState,
  LudoPlayer,
  LudoToken,
  LudoPlayerColor,
  LudoBoardType,
} from './ludoTypes';
import {
  LUDO_4P_SAFE_CELLS,
  LUDO_5P_SAFE_CELLS,
  LUDO_6P_SAFE_CELLS,
  LUDO_4P_WIN_STEP,
  LUDO_5P_WIN_STEP,
  LUDO_6P_WIN_STEP,
} from './ludoConstants';
import { LudoPath } from './ludoPath';

// ─── Ludo Rules Engine ─────────────────────────────────────────────────────────

export const LudoRules = {
  // Check if a token can move with the given dice value
  canMoveToken: (
    token: LudoToken,
    diceValue: number,
    boardType: LudoBoardType = '4player',
  ): boolean => {
    if (token.status === 'finished') return false;

    // To come out of home base, player must roll a 6
    if (token.status === 'home') {
      return diceValue === 6;
    }

    // On active track
    const maxWinStep =
      boardType === '5player'
        ? LUDO_5P_WIN_STEP
        : boardType === '4player'
        ? LUDO_4P_WIN_STEP
        : LUDO_6P_WIN_STEP;
    const newStep = token.stepCount + diceValue;

    // Must reach win position with exact roll or less (cannot overshoot)
    return newStep <= maxWinStep;
  },

  // Check if target position is a safe cell
  isSafeCell: (
    trackIndex: number,
    boardType: LudoBoardType = '4player',
  ): boolean => {
    const safeCells =
      boardType === '5player'
        ? LUDO_5P_SAFE_CELLS
        : boardType === '4player'
        ? LUDO_4P_SAFE_CELLS
        : LUDO_6P_SAFE_CELLS;
    return safeCells.includes(trackIndex);
  },

  // Check if a move results in capturing an opponent token
  checkCapture: (
    movingToken: LudoToken,
    newStepCount: number,
    color: LudoPlayerColor,
    allPlayers: LudoPlayer[],
    boardType: LudoBoardType = '4player',
  ): { canCapture: boolean; capturedToken?: LudoToken; opponentPlayerId?: string } => {
    const targetTrackIdx = LudoPath.getTrackIndex(newStepCount, color, boardType);
    if (targetTrackIdx === null) {
      return { canCapture: false }; // Home stretch is safe
    }

    // Safe cells cannot have captures
    if (LudoRules.isSafeCell(targetTrackIdx, boardType)) {
      return { canCapture: false };
    }

    // Check all opponent tokens on this track cell
    for (const player of allPlayers) {
      if (player.color === color) continue; // Cannot capture own token

      for (const oppToken of player.tokens) {
        if (oppToken.status !== 'active') continue;

        const oppTrackIdx = LudoPath.getTrackIndex(oppToken.stepCount, oppToken.color, boardType);
        if (oppTrackIdx === targetTrackIdx) {
          return {
            canCapture: true,
            capturedToken: oppToken,
            opponentPlayerId: player.id,
          };
        }
      }
    }

    return { canCapture: false };
  },

  // Find all valid playable tokens for a player with current dice value
  getValidMovableTokens: (
    player: LudoPlayer,
    diceValue: number,
    boardType: LudoBoardType = '4player',
  ): LudoToken[] => {
    if (!player || player.isFinished || diceValue <= 0) return [];
    return player.tokens.filter((t) => LudoRules.canMoveToken(t, diceValue, boardType));
  },

  // Check if a player has any valid move
  hasAnyValidMove: (
    player: LudoPlayer,
    diceValue: number,
    boardType: LudoBoardType = '4player',
  ): boolean => {
    return LudoRules.getValidMovableTokens(player, diceValue, boardType).length > 0;
  },

  // Check if player has finished all 4 tokens
  isPlayerFinished: (player: LudoPlayer): boolean => {
    return player.tokens.every((t) => t.status === 'finished');
  },
};
