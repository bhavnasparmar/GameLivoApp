import {
  LudoGameState,
  LudoPlayer,
  LudoToken,
  LudoMove,
  LudoPlayerColor,
  LudoBoardType,
  LudoGameMode,
} from './ludoTypes';
import {
  LUDO_4P_COLORS,
  LUDO_6P_COLORS,
  LUDO_TOKENS_PER_PLAYER,
  LUDO_4P_WIN_STEP,
  LUDO_6P_WIN_STEP,
  LUDO_DEFAULT_TURN_TIME,
  LUDO_BOT_PROFILES,
} from './ludoConstants';
import { LudoRules } from './ludoRules';
import { MoveResult, BaseGameEngine } from '../common/gameTypes';
import { TurnManager } from '../common/turnManager';
import { NumberUtils } from '../../utils/numberUtils';

// ─── Ludo Engine Implementation ───────────────────────────────────────────────

const createTokensForColor = (color: LudoPlayerColor): LudoToken[] => {
  return Array.from({ length: LUDO_TOKENS_PER_PLAYER }, (_, i) => ({
    id: `${color}_${i}`,
    color,
    tokenIndex: i,
    position: -1, // in base yard
    stepCount: -1,
    status: 'home',
  }));
};

export class LudoEngineImpl implements BaseGameEngine<LudoGameState, LudoMove> {
  // Generate initial state for 1 to 6 players
  getInitialState(
    configOrPlayerIds:
      | string[]
      | {
          matchId?: string;
          mode?: LudoGameMode;
          playerCount?: number;
          timeSeconds?: number;
          currentUserId?: string;
          userName?: string;
          userAvatar?: string;
          players?: Array<{
            id: string;
            name: string;
            avatar: string;
            isBot?: boolean;
            isHost?: boolean;
            rating?: number;
          }>;
          stake?: number;
          prizePool?: number;
        },
  ): LudoGameState {
    const config: {
      matchId?: string;
      mode?: LudoGameMode;
      playerCount?: number;
      timeSeconds?: number;
      currentUserId?: string;
      userName?: string;
      userAvatar?: string;
      players?: Array<{
        id: string;
        name: string;
        avatar: string;
        isBot?: boolean;
        isHost?: boolean;
        rating?: number;
      }>;
      stake?: number;
      prizePool?: number;
    } = Array.isArray(configOrPlayerIds)
      ? {
          playerCount: configOrPlayerIds.length,
          players: configOrPlayerIds.map((id, idx) => ({
            id,
            name: `Player ${idx + 1}`,
            avatar: '👤',
            isBot: false,
            isHost: idx === 0,
            rating: 1450,
          })),
        }
      : configOrPlayerIds;
    const matchId = config.matchId || `LUDO-${Math.floor(1000 + Math.random() * 9000)}`;
    const mode: LudoGameMode = config.mode || 'computer';
    const totalCount = Math.max(1, Math.min(6, config.playerCount || 4));
    const boardType: LudoBoardType = totalCount > 4 ? '6player' : '4player';
    const colorPalette = boardType === '6player' ? LUDO_6P_COLORS : LUDO_4P_COLORS;

    // Build player list
    let playerList: LudoPlayer[] = [];

    if (config.players && config.players.length > 0) {
      playerList = config.players.map((p, idx) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        color: colorPalette[idx % colorPalette.length],
        seatIndex: idx,
        isBot: Boolean(p.isBot),
        isHost: Boolean(p.isHost),
        tokens: createTokensForColor(colorPalette[idx % colorPalette.length]),
        isFinished: false,
        consecutiveSixes: 0,
        rating: p.rating || 1450,
      }));
    } else if (mode === 'local') {
      // Pass & Play Mode: All players are human on this device
      playerList = Array.from({ length: totalCount }, (_, idx) => ({
        id: `player_${idx + 1}`,
        name: `Player ${idx + 1}`,
        avatar: ['👦🏻', '👧🏻', '👦🏽', '👧🏼', '👨🏻', '👩🏻'][idx % 6],
        color: colorPalette[idx % colorPalette.length],
        seatIndex: idx,
        isBot: false,
        isHost: idx === 0,
        tokens: createTokensForColor(colorPalette[idx % colorPalette.length]),
        isFinished: false,
        consecutiveSixes: 0,
        rating: 1500,
      }));
    } else {
      // 1 Player Solo or default Bot Fill
      const bots = LUDO_BOT_PROFILES.slice(0, Math.max(1, totalCount - 1));
      const humanPlayer: LudoPlayer = {
        id: config.currentUserId || 'player_me',
        name: config.userName || 'Player 1',
        avatar: config.userAvatar || '👦🏻',
        color: colorPalette[0],
        seatIndex: 0,
        isBot: false,
        isHost: true,
        tokens: createTokensForColor(colorPalette[0]),
        isFinished: false,
        consecutiveSixes: 0,
        rating: 1500,
      };

      const botPlayers: LudoPlayer[] = bots.map((b, idx) => ({
        id: b.id,
        name: b.name,
        avatar: b.avatar,
        color: colorPalette[(idx + 1) % colorPalette.length],
        seatIndex: idx + 1,
        isBot: true,
        tokens: createTokensForColor(colorPalette[(idx + 1) % colorPalette.length]),
        isFinished: false,
        consecutiveSixes: 0,
        rating: b.rating,
      }));

      playerList = [humanPlayer, ...botPlayers];
    }

    return {
      matchId,
      mode,
      boardType,
      playerCount: playerList.length,
      players: playerList,
      currentPlayerId: playerList[0].id,
      currentDiceValue: null,
      diceRolled: false,
      canRoll: true,
      consecutiveSixes: 0,
      finishedPlayers: [],
      turnNumber: 1,
      turnTimeSeconds: config.timeSeconds || LUDO_DEFAULT_TURN_TIME,
      isGameOver: false,
      stake: config.stake || 0,
      prizePool: config.prizePool || (config.stake ? config.stake * playerList.length : 0),
    };
  }

  // Roll dice action
  rollDice(state: LudoGameState, forceValue?: number): { newState: LudoGameState; value: number } {
    if (!state.canRoll && state.diceRolled) {
      return { newState: state, value: state.currentDiceValue || 1 };
    }

    const value = forceValue ?? NumberUtils.rollDice();
    const isSix = value === 6;
    const currentConsecutive = isSix ? state.consecutiveSixes + 1 : 0;

    let newState: LudoGameState = {
      ...state,
      currentDiceValue: value,
      diceRolled: true,
      canRoll: false,
      consecutiveSixes: currentConsecutive,
      lastActionType: 'roll',
      lastActionText: `${state.players.find((p) => p.id === state.currentPlayerId)?.name || 'Player'} rolled a ${value}!`,
    };

    // Official Rule: 3 consecutive sixes penalty cancels turn
    if (currentConsecutive >= 3) {
      newState = this._handleThreeSixesPenalty(newState);
      return { newState, value };
    }

    // Check if player has any valid moves with this dice value
    const currentPlayer = newState.players.find((p) => p.id === newState.currentPlayerId);
    if (currentPlayer && !LudoRules.hasAnyValidMove(currentPlayer, value, newState.boardType)) {
      // No valid moves possible -> automatically end turn after short timeout
      newState.lastActionText = `No valid moves for ${value}! Passing turn...`;
    }

    return { newState, value };
  }

  // Apply a token move
  applyMove(
    state: LudoGameState,
    move: LudoMove,
    playerId: string,
  ): { newState: LudoGameState; result: MoveResult } {
    const currentPlayer = state.players.find((p) => p.id === playerId);
    if (!currentPlayer) {
      return { newState: state, result: { isValid: false, reason: 'Player not found' } };
    }

    const token = currentPlayer.tokens.find((t) => t.id === move.tokenId);
    if (!token || !state.currentDiceValue) {
      return { newState: state, result: { isValid: false, reason: 'Invalid token or dice' } };
    }

    const maxWinStep = state.boardType === '4player' ? LUDO_4P_WIN_STEP : LUDO_6P_WIN_STEP;
    let nextState: LudoGameState = JSON.parse(JSON.stringify(state));
    const targetPlayer = nextState.players.find((p) => p.id === playerId)!;
    const targetToken = targetPlayer.tokens.find((t) => t.id === move.tokenId)!;

    let isOpening = false;
    let isFinished = false;
    let extraTurnAwarded = false;
    let capturedOpponentName: string | undefined;

    // 1. Move logic
    if (targetToken.status === 'home') {
      // Opening from home yard on a 6
      targetToken.status = 'active';
      targetToken.stepCount = 0;
      targetToken.position = 0;
      isOpening = true;
      nextState.lastActionText = `${targetPlayer.name} deployed a token to the track! 🚀`;
      nextState.lastActionType = 'move';
    } else {
      // Advancing along track
      const newStepCount = targetToken.stepCount + state.currentDiceValue;
      targetToken.stepCount = newStepCount;
      targetToken.position = newStepCount;

      // Check if reached final home center
      if (newStepCount >= maxWinStep) {
        targetToken.status = 'finished';
        targetToken.stepCount = maxWinStep;
        isFinished = true;
        extraTurnAwarded = true; // Bonus roll for reaching Home!
        nextState.lastActionText = `🌟 ${targetPlayer.name} got a token HOME! Extra roll!`;
        nextState.lastActionType = 'home';
      } else {
        // Check capture on active track
        const captureResult = LudoRules.checkCapture(
          targetToken,
          newStepCount,
          targetPlayer.color,
          nextState.players,
          nextState.boardType,
        );

        if (captureResult.canCapture && captureResult.capturedToken) {
          const oppPlayer = nextState.players.find((p) => p.id === captureResult.opponentPlayerId);
          const oppToken = oppPlayer?.tokens.find((t) => t.id === captureResult.capturedToken!.id);
          if (oppToken) {
            oppToken.status = 'home';
            oppToken.position = -1;
            oppToken.stepCount = -1;
            extraTurnAwarded = true; // Bonus roll for Knockout!
            capturedOpponentName = oppPlayer?.name;
            nextState.lastActionText = `💥 ${targetPlayer.name} knocked out ${oppPlayer?.name || 'opponent'}'s token! Extra roll!`;
            nextState.lastActionType = 'capture';
          }
        } else {
          nextState.lastActionText = `${targetPlayer.name} advanced a token!`;
          nextState.lastActionType = 'move';
        }
      }
    }

    // 2. Check if player finished all 4 tokens
    if (LudoRules.isPlayerFinished(targetPlayer) && !targetPlayer.isFinished) {
      targetPlayer.isFinished = true;
      targetPlayer.rank = nextState.finishedPlayers.length + 1;
      nextState.finishedPlayers.push(targetPlayer.id);
      nextState.lastActionText = `👑 ${targetPlayer.name} finished in Rank #${targetPlayer.rank}!`;
    }

    // 3. Check game over
    const activeUnfinished = nextState.players.filter((p) => !p.isFinished);
    const isGameOver = activeUnfinished.length <= 1;
    if (isGameOver) {
      nextState.isGameOver = true;
      // Remaining player gets last rank
      if (activeUnfinished.length === 1) {
        const lastP = activeUnfinished[0];
        lastP.isFinished = true;
        lastP.rank = nextState.finishedPlayers.length + 1;
        nextState.finishedPlayers.push(lastP.id);
      }
      nextState.winnerId = nextState.finishedPlayers[0];
      nextState.lastActionText = `🏆 Game Completed! ${nextState.players.find((p) => p.id === nextState.winnerId)?.name} Wins!`;
    }

    // 4. Bonus Turn check:
    // Bonus turn is given if: rolled a 6 (and < 3 sixes), or captured a token, or reached home!
    const rolledSixBonus = state.currentDiceValue === 6 && nextState.consecutiveSixes < 3;
    const keepTurn = (rolledSixBonus || extraTurnAwarded) && !isGameOver && !targetPlayer.isFinished;

    if (keepTurn) {
      nextState.canRoll = true;
      nextState.diceRolled = false;
      nextState.currentDiceValue = null;
      if (rolledSixBonus && !extraTurnAwarded) {
        nextState.lastActionText = `🎲 Six! ${targetPlayer.name} rolls again!`;
        nextState.lastActionType = 'bonus';
      }
    } else if (!isGameOver) {
      // Advance to next active player
      nextState = this._advanceToNextPlayer(nextState);
    }

    return {
      newState: nextState,
      result: {
        isValid: true,
        nextPlayerId: nextState.currentPlayerId,
        isGameOver: nextState.isGameOver,
        winnerId: nextState.winnerId,
      },
    };
  }

  // Pass or advance turn when no moves or timeout occurs
  passTurn(state: LudoGameState): LudoGameState {
    return this._advanceToNextPlayer(state);
  }

  // Internal: advance turn to next unfinished player
  private _advanceToNextPlayer(state: LudoGameState): LudoGameState {
    const unfinishedPlayers = state.players.filter((p) => !p.isFinished);
    if (unfinishedPlayers.length <= 1) {
      return { ...state, isGameOver: true, winnerId: state.finishedPlayers[0] };
    }

    const currentIdx = state.players.findIndex((p) => p.id === state.currentPlayerId);
    let nextIdx = (currentIdx + 1) % state.players.length;

    // Loop until we find an unfinished player
    while (state.players[nextIdx].isFinished) {
      nextIdx = (nextIdx + 1) % state.players.length;
    }

    const nextPlayer = state.players[nextIdx];

    return {
      ...state,
      currentPlayerId: nextPlayer.id,
      currentDiceValue: null,
      diceRolled: false,
      canRoll: true,
      consecutiveSixes: 0,
      turnNumber: state.turnNumber + 1,
      lastActionText: `${nextPlayer.name}'s turn to roll! 🎲`,
    };
  }

  // Handle 3 consecutive 6s penalty
  private _handleThreeSixesPenalty(state: LudoGameState): LudoGameState {
    const nextState = this._advanceToNextPlayer(state);
    nextState.lastActionText = `❌ 3 Consecutive Sixes! Turn cancelled!`;
    nextState.lastActionType = 'penalty_three_sixes';
    return nextState;
  }

  isValidMove(state: LudoGameState, move: LudoMove, playerId: string): boolean {
    if (state.currentPlayerId !== playerId || !state.diceRolled || !state.currentDiceValue) {
      return false;
    }
    const player = state.players.find((p) => p.id === playerId);
    if (!player) return false;
    const token = player.tokens.find((t) => t.id === move.tokenId);
    if (!token) return false;
    return LudoRules.canMoveToken(token, state.currentDiceValue, state.boardType);
  }

  isGameOver(state: LudoGameState): boolean {
    return state.isGameOver;
  }

  getWinner(state: LudoGameState): string | null {
    return state.winnerId || null;
  }
}

export const ludoEngine = new LudoEngineImpl();
