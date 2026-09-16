import { UnoActiveColor, UnoCard, UnoGameState, UnoMove, UnoPlayer } from './unoTypes';
import { UnoRules } from './unoRules';

export interface BotDecision {
  move: UnoMove;
  delayMs: number;
  shouldShoutUno?: boolean;
  catchTargetId?: string;
}

export class UnoBotAI {
  /**
   * Evaluates the best legal move for the robot according to its difficulty level.
   */
  static getBotDecision(state: UnoGameState, botId: string): BotDecision {
    const bot = state.players.find((p) => p.id === botId);
    if (!bot) {
      return { move: { type: 'draw_card' }, delayMs: 1000 };
    }

    const difficulty = state.difficulty || 'medium';

    // Base delay with human-like randomness
    let baseDelay = 1100;
    if (difficulty === 'easy') baseDelay = 1400;
    if (difficulty === 'hard') baseDelay = 800;
    const jitter = Math.floor(Math.random() * 400);
    const delayMs = baseDelay + jitter;

    // 1. Check if any opponent forgot to call UNO
    const catchTarget = state.players.find(
      (p) => p.id !== botId && UnoRules.canCatchUno(p),
    );
    if (catchTarget) {
      const catchProb = difficulty === 'hard' ? 0.95 : difficulty === 'medium' ? 0.7 : 0.35;
      if (Math.random() < catchProb) {
        return {
          move: { type: 'catch_uno', targetPlayerId: catchTarget.id },
          delayMs: Math.max(500, delayMs - 300),
          catchTargetId: catchTarget.id,
        };
      }
    }

    // 2. Check if bot has 2 cards and should call UNO prior to / with its move
    let shouldShoutUno = false;
    if (bot.hand.length === 2 && !bot.hasCalledUno) {
      const unoProb = difficulty === 'hard' ? 1.0 : difficulty === 'medium' ? 0.9 : 0.7;
      if (Math.random() < unoProb) {
        shouldShoutUno = true;
      }
    }

    // 3. If in Draw Phase (bot already drew a card):
    if (state.isDrawPhase && state.drawnCardId) {
      const drawnCard = bot.hand.find((c) => c.id === state.drawnCardId);
      if (drawnCard && UnoRules.canPlayCard(state.topCard, state.activeColor, drawnCard)) {
        const chosenColor = UnoRules.isWildCard(drawnCard)
          ? this.chooseBestColor(bot.hand)
          : undefined;
        return {
          move: {
            type: 'play_card',
            cardId: drawnCard.id,
            chosenColor,
          },
          delayMs: 700,
          shouldShoutUno,
        };
      }
      return {
        move: { type: 'pass_turn' },
        delayMs: 600,
      };
    }

    // 4. Normal Turn: Find all playable cards from hand
    const playableCards = UnoRules.getPlayableCards(
      bot.hand,
      state.topCard,
      state.activeColor,
    );

    // If no playable cards, Draw!
    if (playableCards.length === 0) {
      return {
        move: { type: 'draw_card' },
        delayMs,
      };
    }

    // 5. Select best card based on difficulty level
    const selectedCard = this.selectCardByDifficulty(
      bot,
      playableCards,
      state,
      difficulty,
    );

    const chosenColor = UnoRules.isWildCard(selectedCard)
      ? this.chooseBestColor(bot.hand)
      : undefined;

    return {
      move: {
        type: 'play_card',
        cardId: selectedCard.id,
        chosenColor,
      },
      delayMs,
      shouldShoutUno,
    };
  }

  /**
   * Strategic card selection based on AI difficulty
   */
  private static selectCardByDifficulty(
    bot: UnoPlayer,
    playableCards: UnoCard[],
    state: UnoGameState,
    difficulty: 'easy' | 'medium' | 'hard',
  ): UnoCard {
    if (difficulty === 'easy') {
      // Pick random playable card
      const idx = Math.floor(Math.random() * playableCards.length);
      return playableCards[idx];
    }

    // Determine danger level of next player
    const nextPlayerIndex =
      (state.currentPlayerIndex + state.direction + state.players.length) %
      state.players.length;
    const nextPlayer = state.players[nextPlayerIndex];
    const isNextPlayerCritical = nextPlayer.hand.length <= 2;

    if (difficulty === 'hard') {
      // ─── HARD AI ──────────────────────────────────────────────────────────
      // 1. If next player is on 1 or 2 cards, attack with +4, +2, or Skip immediately!
      if (isNextPlayerCritical) {
        const attackCard = playableCards.find((c) =>
          ['wild_draw4', 'draw2', 'skip'].includes(c.value),
        );
        if (attackCard) return attackCard;
      }

      // 2. Separate regular non-wild cards vs wild cards
      const regularCards = playableCards.filter((c) => !UnoRules.isWildCard(c));
      if (regularCards.length > 0) {
        // Play highest point card first to dump points
        regularCards.sort((a, b) => b.scoreValue - a.scoreValue);
        return regularCards[0];
      }

      // 3. Fallback to Wilds
      return playableCards[0];
    }

    // ─── MEDIUM AI ────────────────────────────────────────────────────────
    // 1. Prefer regular color/value matches over Wilds when possible
    const regularMatches = playableCards.filter((c) => !UnoRules.isWildCard(c));
    if (regularMatches.length > 0) {
      if (isNextPlayerCritical) {
        const attackAction = regularMatches.find((c) =>
          ['draw2', 'skip', 'reverse'].includes(c.value),
        );
        if (attackAction) return attackAction;
      }
      return regularMatches[Math.floor(Math.random() * regularMatches.length)];
    }

    return playableCards[0];
  }

  /**
   * Intelligently selects the best color for Wild cards based on frequency in hand
   */
  static chooseBestColor(hand: UnoCard[]): UnoActiveColor {
    const counts: Record<UnoActiveColor, number> = {
      red: 0,
      blue: 0,
      green: 0,
      yellow: 0,
    };

    hand.forEach((card) => {
      if (card.color !== 'wild' && counts[card.color as UnoActiveColor] !== undefined) {
        counts[card.color as UnoActiveColor] += 1;
      }
    });

    let bestColor: UnoActiveColor = 'red';
    let maxCount = -1;

    (Object.keys(counts) as UnoActiveColor[]).forEach((col) => {
      if (counts[col] > maxCount) {
        maxCount = counts[col];
        bestColor = col;
      }
    });

    return bestColor;
  }
}
