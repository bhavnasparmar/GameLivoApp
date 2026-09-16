import {
  UnoActiveColor,
  UnoCard,
  UnoDifficulty,
  UnoGameMode,
  UnoGameState,
  UnoMove,
  UnoPlayer,
} from './unoTypes';
import { UnoRules } from './unoRules';
import { buildStandardUnoDeck, UNO_DEFAULT_TIME_SECONDS } from './unoConstants';

// ─── Pure Fisher-Yates Deck Shuffler ──────────────────────────────────────────

export const shuffleDeck = (deck: UnoCard[]): UnoCard[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export interface UnoGameInitConfig {
  matchId?: string;
  mode?: UnoGameMode;
  difficulty?: UnoDifficulty;
  timeSeconds?: number;
  players: Array<{
    id: string;
    name: string;
    isBot: boolean;
    avatar?: string;
    isHost?: boolean;
  }>;
}

export class UnoEngineImpl {
  /**
   * Initializes a brand new Uno match with standard 108 card deck, deals 3 cards
   * to each player (Speed 3-Card Uno), and draws an initial valid top card.
   */
  getInitialState(config: UnoGameInitConfig): UnoGameState {
    let deck = shuffleDeck(buildStandardUnoDeck());
    const mode = config.mode || 'computer';
    const difficulty = config.difficulty || 'medium';
    const timeSeconds = config.timeSeconds || UNO_DEFAULT_TIME_SECONDS;
    const matchId = config.matchId || `uno_${Date.now()}`;

    // Deal 3 cards to each player (Speed 3-Card Uno)
    const players: UnoPlayer[] = config.players.map((p) => {
      const hand = deck.splice(0, 3);
      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isBot: p.isBot,
        hand,
        hasCalledUno: false,
        score: 0,
        isHost: p.isHost,
      };
    });

    // Draw starting card (cannot start with Wild Draw 4 as per official tournament rules)
    let topCardIndex = deck.findIndex((c) => c.value !== 'wild_draw4');
    if (topCardIndex === -1) topCardIndex = 0;
    const [topCard] = deck.splice(topCardIndex, 1);
    const discardPile: UnoCard[] = [topCard];

    let activeColor: UnoActiveColor =
      topCard.color === 'wild'
        ? (['red', 'green', 'blue', 'yellow'][Math.floor(Math.random() * 4)] as UnoActiveColor)
        : (topCard.color as UnoActiveColor);

    let currentPlayerIndex = 0;
    let direction: 1 | -1 = 1;

    // Apply starting card action effect if top card was an action card
    if (topCard.value === 'skip') {
      currentPlayerIndex = this.getNextPlayerIndex(0, direction, players.length, 1);
    } else if (topCard.value === 'reverse') {
      if (players.length === 2) {
        currentPlayerIndex = 1;
      } else {
        direction = -1;
        currentPlayerIndex = players.length - 1;
      }
    } else if (topCard.value === 'draw2') {
      // First player draws 2 cards and turn skips to next
      const firstPlayer = players[0];
      const drawn = deck.splice(0, 2);
      firstPlayer.hand.push(...drawn);
      currentPlayerIndex = this.getNextPlayerIndex(0, direction, players.length, 1);
    }

    return {
      matchId,
      mode,
      difficulty,
      players,
      deck,
      discardPile,
      currentPlayerIndex,
      currentPlayerId: players[currentPlayerIndex].id,
      direction,
      topCard,
      activeColor,
      pendingDrawCount: 0,
      turnNumber: 1,
      turnTimeLeft: timeSeconds,
      isDrawPhase: false,
      winnerId: null,
      roundOver: false,
      lastAction: {
        id: `act_${Date.now()}`,
        playerId: 'system',
        playerName: 'System',
        actionText: `Game started! Top card is ${topCard.color} ${topCard.value}`,
        card: topCard,
        color: activeColor,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Calculates next player index considering circular direction and step count (e.g. skips)
   */
  getNextPlayerIndex(
    currentIndex: number,
    direction: 1 | -1,
    totalPlayers: number,
    step: number = 1,
  ): number {
    const raw = (currentIndex + direction * step) % totalPlayers;
    return (raw + totalPlayers) % totalPlayers;
  }

  /**
   * Reshuffles discard pile back into deck when draw pile runs low.
   * If all cards are in hands, replenishes with fresh cards to prevent freezing.
   */
  reshuffleDeckIfNeeded(state: UnoGameState, minNeeded: number = 4): void {
    if (state.deck.length < minNeeded && state.discardPile.length > 1) {
      const top = state.discardPile.pop()!;
      const recycled = shuffleDeck(state.discardPile);
      state.deck.push(...recycled);
      state.discardPile = [top];
    }

    // Safeguard: If deck is still depleted, generate fresh shuffled cards
    if (state.deck.length < minNeeded) {
      const freshCards = shuffleDeck(buildStandardUnoDeck());
      state.deck.push(...freshCards);
    }
  }

  /**
   * Applies any game move (play card, draw, pass, uno shout, catch uno)
   */
  applyMove(
    state: UnoGameState,
    move: UnoMove,
    playerId: string,
  ): { newState: UnoGameState; isSuccess: boolean; reason?: string } {
    if (state.roundOver || state.winnerId) {
      return { newState: state, isSuccess: false, reason: 'Round is already over' };
    }

    const nextState: UnoGameState = JSON.parse(JSON.stringify(state));
    const playerIndex = nextState.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) {
      return { newState: state, isSuccess: false, reason: 'Player not in match' };
    }

    const player = nextState.players[playerIndex];

    // ─── 1. CALL UNO ────────────────────────────────────────────────────────
    if (move.type === 'call_uno') {
      if (UnoRules.canShoutUno(player)) {
        player.hasCalledUno = true;
        player.unoCallTimestamp = Date.now();
        nextState.lastAction = {
          id: `act_${Date.now()}`,
          playerId: player.id,
          playerName: player.name,
          actionText: `${player.name} shouted UNO! 🔥`,
          timestamp: Date.now(),
        };
        return { newState: nextState, isSuccess: true };
      }
      return { newState: state, isSuccess: false, reason: 'Cannot call UNO at this time' };
    }

    // ─── 2. CATCH UNO (Penalty for opponent who forgot to call UNO) ──────────
    if (move.type === 'catch_uno') {
      const targetId = move.targetPlayerId;
      const target = nextState.players.find((p) => p.id === targetId);
      if (target && UnoRules.canCatchUno(target)) {
        this.reshuffleDeckIfNeeded(nextState, 2);
        const penaltyCards = nextState.deck.splice(0, 2);
        target.hand.push(...penaltyCards);
        target.hasCalledUno = false;

        nextState.lastAction = {
          id: `act_${Date.now()}`,
          playerId: player.id,
          playerName: player.name,
          actionText: `${player.name} caught ${target.name} forgetting UNO! +2 Penalty! ⚡`,
          timestamp: Date.now(),
        };
        return { newState: nextState, isSuccess: true };
      }
      return { newState: state, isSuccess: false, reason: 'Target has validly called UNO or has more cards' };
    }

    // From here onwards, move must be made by the current active player
    if (nextState.currentPlayerId !== playerId) {
      return { newState: state, isSuccess: false, reason: 'Not your turn' };
    }

    // ─── 3. DRAW CARD ───────────────────────────────────────────────────────
    if (move.type === 'draw_card') {
      if (nextState.isDrawPhase) {
        return { newState: state, isSuccess: false, reason: 'Already drew a card this turn' };
      }

      this.reshuffleDeckIfNeeded(nextState, 1);
      if (nextState.deck.length === 0) {
        return { newState: state, isSuccess: false, reason: 'Deck is empty' };
      }

      const drawnCard = nextState.deck.pop()!;
      player.hand.push(drawnCard);

      const isPlayable = UnoRules.canPlayCard(
        nextState.topCard,
        nextState.activeColor,
        drawnCard,
      );

      if (isPlayable) {
        nextState.isDrawPhase = true;
        nextState.drawnCardId = drawnCard.id;
        nextState.lastAction = {
          id: `act_${Date.now()}`,
          playerId: player.id,
          playerName: player.name,
          actionText: `${player.name} drew a card and can play it`,
          timestamp: Date.now(),
        };
      } else {
        // Not playable: Automatically advance turn to next player
        nextState.isDrawPhase = false;
        nextState.drawnCardId = undefined;
        nextState.lastAction = {
          id: `act_${Date.now()}`,
          playerId: player.id,
          playerName: player.name,
          actionText: `${player.name} drew a card and passed`,
          timestamp: Date.now(),
        };
        this.advanceTurn(nextState, 1);
      }

      return { newState: nextState, isSuccess: true };
    }

    // ─── 4. PASS TURN (After drawing) ───────────────────────────────────────
    if (move.type === 'pass_turn') {
      if (!nextState.isDrawPhase) {
        return { newState: state, isSuccess: false, reason: 'Must draw before passing' };
      }

      nextState.isDrawPhase = false;
      nextState.drawnCardId = undefined;
      nextState.lastAction = {
        id: `act_${Date.now()}`,
        playerId: player.id,
        playerName: player.name,
        actionText: `${player.name} passed turn`,
        timestamp: Date.now(),
      };
      this.advanceTurn(nextState, 1);
      return { newState: nextState, isSuccess: true };
    }

    // ─── 5. PLAY CARD ───────────────────────────────────────────────────────
    if (move.type === 'play_card') {
      if (!move.cardId) {
        return { newState: state, isSuccess: false, reason: 'No card specified' };
      }

      const cardIndex = player.hand.findIndex((c) => c.id === move.cardId);
      if (cardIndex === -1) {
        return { newState: state, isSuccess: false, reason: 'Card not in player hand' };
      }

      const cardToPlay = player.hand[cardIndex];

      // If in draw phase, player can only play the card they just drew
      if (nextState.isDrawPhase && nextState.drawnCardId && cardToPlay.id !== nextState.drawnCardId) {
        return { newState: state, isSuccess: false, reason: 'Can only play the freshly drawn card' };
      }

      if (!UnoRules.canPlayCard(nextState.topCard, nextState.activeColor, cardToPlay)) {
        return { newState: state, isSuccess: false, reason: 'Illegal card play' };
      }

      // Check wild color choice
      const isWild = UnoRules.isWildCard(cardToPlay);
      let chosenColor = move.chosenColor;
      if (isWild && !chosenColor) {
        // Fallback default if not specified
        chosenColor = 'red';
      }

      // Remove card from hand and push to discard
      player.hand.splice(cardIndex, 1);
      nextState.discardPile.push(cardToPlay);
      nextState.topCard = cardToPlay;
      nextState.activeColor = isWild && chosenColor ? chosenColor : (cardToPlay.color as UnoActiveColor);

      // Check for round winner
      if (UnoRules.hasWonRound(player)) {
        nextState.roundOver = true;
        nextState.winnerId = player.id;
        const roundPoints = UnoRules.calculateWinnerPoints(nextState.players, player.id);
        player.score += roundPoints;

        nextState.lastAction = {
          id: `act_${Date.now()}`,
          playerId: player.id,
          playerName: player.name,
          actionText: `🏆 ${player.name} played ${cardToPlay.color} ${cardToPlay.value} and WON THE GAME! (+${roundPoints} pts)`,
          card: cardToPlay,
          color: nextState.activeColor,
          timestamp: Date.now(),
        };
        return { newState: nextState, isSuccess: true };
      }

      // Manage UNO calling state
      if (player.hand.length === 1) {
        if (!player.hasCalledUno) {
          // Player forgot to call UNO prior to playing their card.
          // In official rules, they have a short grace period or can be caught!
        }
      } else {
        // Reset UNO status if player has more than 1 card
        player.hasCalledUno = false;
      }

      // Process Action Card Effects & Advance Turn
      let stepAdvance = 1;
      let actionMsg = `${player.name} played ${cardToPlay.color} ${cardToPlay.value}`;

      if (cardToPlay.value === 'skip') {
        stepAdvance = 2;
        const skippedIndex = this.getNextPlayerIndex(nextState.currentPlayerIndex, nextState.direction, nextState.players.length, 1);
        actionMsg = `🚫 ${player.name} skipped ${nextState.players[skippedIndex].name}!`;
      } else if (cardToPlay.value === 'reverse') {
        if (nextState.players.length === 2) {
          // In 2-player Uno, Reverse acts as a Skip
          stepAdvance = 2;
          actionMsg = `⇄ ${player.name} played Reverse (Acts as Skip in 1v1)!`;
        } else {
          nextState.direction = (nextState.direction === 1 ? -1 : 1) as 1 | -1;
          stepAdvance = 1;
          actionMsg = `⇄ ${player.name} reversed the game direction!`;
        }
      } else if (cardToPlay.value === 'draw2') {
        const victimIndex = this.getNextPlayerIndex(nextState.currentPlayerIndex, nextState.direction, nextState.players.length, 1);
        const victim = nextState.players[victimIndex];
        this.reshuffleDeckIfNeeded(nextState, 2);
        const draw2Cards = nextState.deck.splice(0, 2);
        victim.hand.push(...draw2Cards);
        stepAdvance = 2; // Skips the victim's turn
        actionMsg = `🎴 ${player.name} hit ${victim.name} with +2 Cards!`;
      } else if (cardToPlay.value === 'wild') {
        actionMsg = `🌈 ${player.name} changed color to ${nextState.activeColor.toUpperCase()}!`;
      } else if (cardToPlay.value === 'wild_draw4') {
        const victimIndex = this.getNextPlayerIndex(nextState.currentPlayerIndex, nextState.direction, nextState.players.length, 1);
        const victim = nextState.players[victimIndex];
        this.reshuffleDeckIfNeeded(nextState, 4);
        const draw4Cards = nextState.deck.splice(0, 4);
        victim.hand.push(...draw4Cards);
        stepAdvance = 2; // Skips the victim's turn
        actionMsg = `💥 ${player.name} changed color to ${nextState.activeColor.toUpperCase()} and hit ${victim.name} with +4 Cards!`;
      }

      nextState.lastAction = {
        id: `act_${Date.now()}`,
        playerId: player.id,
        playerName: player.name,
        actionText: actionMsg,
        card: cardToPlay,
        color: nextState.activeColor,
        timestamp: Date.now(),
      };

      nextState.isDrawPhase = false;
      nextState.drawnCardId = undefined;
      this.advanceTurn(nextState, stepAdvance);

      return { newState: nextState, isSuccess: true };
    }

    return { newState: state, isSuccess: false, reason: 'Unsupported move type' };
  }

  /**
   * Advances the turn to the next player based on step and direction
   */
  advanceTurn(state: UnoGameState, step: number = 1): void {
    state.currentPlayerIndex = this.getNextPlayerIndex(
      state.currentPlayerIndex,
      state.direction,
      state.players.length,
      step,
    );
    state.currentPlayerId = state.players[state.currentPlayerIndex].id;
    state.turnNumber += 1;
    state.turnTimeLeft = UNO_DEFAULT_TIME_SECONDS;
  }
}

export const unoEngine = new UnoEngineImpl();
