import {
  LudoGameState,
  LudoPlayer,
  LudoToken,
  LudoDifficulty,
} from './ludoTypes';
import { LudoRules } from './ludoRules';
import { LudoPath } from './ludoPath';

// ─── Ludo Intelligent Bot AI ──────────────────────────────────────────────────

export const LudoBotAI = {
  // Choose best token to move for a bot player
  chooseBestToken: (
    gameState: LudoGameState,
    botPlayer: LudoPlayer,
    diceValue: number,
    difficulty: LudoDifficulty = 'medium',
  ): LudoToken | null => {
    const validTokens = LudoRules.getValidMovableTokens(botPlayer, diceValue, gameState.boardType);
    if (validTokens.length === 0) return null;
    if (validTokens.length === 1) return validTokens[0];

    // Easy AI: Random selection among valid moves
    if (difficulty === 'easy') {
      const randomIdx = Math.floor(Math.random() * validTokens.length);
      return validTokens[randomIdx];
    }

    const maxWinStep = gameState.boardType === '4player' ? 57 : 77;
    let bestToken: LudoToken = validTokens[0];
    let highestScore = -Infinity;

    for (const token of validTokens) {
      let score = 0;

      // 1. Move to home (win token) -> HUGE priority (+100)
      if (token.status === 'active' && token.stepCount + diceValue === maxWinStep) {
        score += 100;
      }

      // 2. Capture an opponent -> VERY HIGH priority (+80)
      if (token.status === 'active') {
        const nextStep = token.stepCount + diceValue;
        const capture = LudoRules.checkCapture(
          token,
          nextStep,
          botPlayer.color,
          gameState.players,
          gameState.boardType,
        );
        if (capture.canCapture) {
          score += 85;
        }
      }

      // 3. Opening token on 6 from base yard (+60)
      if (token.status === 'home' && diceValue === 6) {
        // If bot already has active tokens, check if advancing active is better or opening
        const activeTokensCount = botPlayer.tokens.filter((t) => t.status === 'active').length;
        score += activeTokensCount === 0 ? 70 : 45;
      }

      // 4. Moving to a safe star cell (+35)
      if (token.status === 'active') {
        const nextStep = token.stepCount + diceValue;
        const nextTrackIdx = LudoPath.getTrackIndex(nextStep, botPlayer.color, gameState.boardType);
        if (nextTrackIdx !== null && LudoRules.isSafeCell(nextTrackIdx, gameState.boardType)) {
          score += 35;
        }
      }

      // 5. Entering safe home corridor (+40)
      if (token.status === 'active') {
        const currentInCorridor = token.stepCount >= (gameState.boardType === '4player' ? 52 : 72);
        const nextInCorridor = (token.stepCount + diceValue) >= (gameState.boardType === '4player' ? 52 : 72);
        if (!currentInCorridor && nextInCorridor) {
          score += 40;
        }
      }

      // 6. Advance tokens closer to finish line
      if (token.status === 'active') {
        score += token.stepCount * 0.5;
      }

      // Add slight randomness for natural gameplay
      score += Math.random() * 5;

      if (score > highestScore) {
        highestScore = score;
        bestToken = token;
      }
    }

    return bestToken;
  },
};
