import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../theme';
import { ROUTES } from '../../../../navigation/routes';
import { useAppSelector } from '../../../../redux/hooks';
import {
  LudoGameState,
  LudoPlayer,
  LudoToken,
  LudoPlayerColor,
  LudoGameMode,
  LudoDifficulty,
} from '../../../../gameEngine/ludo/ludoTypes';
import { ludoEngine } from '../../../../gameEngine/ludo/ludoEngine';
import { LudoRules } from '../../../../gameEngine/ludo/ludoRules';
import { LudoBotAI } from '../../../../gameEngine/ludo/ludoBot';
import { LudoPath } from '../../../../gameEngine/ludo/ludoPath';
import { soundService } from '../../../../services/sound/soundService';
import { vibrationService } from '../../../../services/vibration/vibrationService';

import LudoBoard4P from '../components/LudoBoard4P';
import LudoBoard5P from '../components/LudoBoard5P';
import LudoBoard6P from '../components/LudoBoard6P';
import LudoPlayerBadge from '../components/LudoPlayerBadge';
import LudoActionVFX from '../components/LudoActionVFX';

const { width } = Dimensions.get('window');

export const LudoGameScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark } = useTheme();

  const userProfile = useAppSelector((state) => state.user.profile);
  const currentUserId = useAppSelector((state) => state.auth.userId) || 'player_me';
  const userName = userProfile?.name || userProfile?.username || 'Player 1';
  const userAvatar = userProfile?.avatar || '👦🏻';

  const matchId = route.params?.matchId || `LUDO-${Math.floor(1000 + Math.random() * 9000)}`;
  const mode: LudoGameMode = route.params?.mode || 'computer';
  const playerCount: number = route.params?.playerCount || 4;
  const difficulty: LudoDifficulty = route.params?.difficulty || 'medium';
  const initialTimeSeconds: number = route.params?.timeSeconds || 15;
  const customPlayers = route.params?.players;

  // Sound and Mic settings
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [showEmotePicker, setShowEmotePicker] = useState<boolean>(false);
  const [floatingEmote, setFloatingEmote] = useState<{ emoji: string; name: string } | null>(null);

  // Initialize Game State
  const [gameState, setGameState] = useState<LudoGameState>(() => {
    let initialPlayersList = undefined;
    if (customPlayers && customPlayers.length > 0) {
      initialPlayersList = customPlayers;
    }
    return ludoEngine.getInitialState({
      matchId,
      mode,
      playerCount,
      timeSeconds: initialTimeSeconds,
      currentUserId,
      userName,
      userAvatar,
      players: initialPlayersList,
    });
  });

  // Turn Timer State
  const [timeLeft, setTimeLeft] = useState<number>(initialTimeSeconds);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  // Active Movement Animation State
  const [activeMovingTokenId, setActiveMovingTokenId] = useState<string | null>(null);
  const [movingStepSteps, setMovingStepSteps] = useState<Array<[number, number]>>([]);
  const [pendingMove, setPendingMove] = useState<{ move: any; playerId: string } | null>(null);

  const currentPlayer = gameState.players.find((p) => p.id === gameState.currentPlayerId) || gameState.players[0];

  const isPlayerHumanTurn = useCallback(
    (player?: LudoPlayer) => {
      if (!player) return false;
      if (player.isBot) return false;
      if (mode === 'local' || mode === 'computer') return true;
      return player.id === currentUserId || player.id === 'player_me' || player.id.startsWith('player_');
    },
    [mode, currentUserId],
  );

  const isMyTurn = isPlayerHumanTurn(currentPlayer);

  // Movable / Selectable tokens for the active player
  const selectableTokenIds = React.useMemo(() => {
    if (!gameState.diceRolled || gameState.currentDiceValue === null) return [];
    const validTokens = LudoRules.getValidMovableTokens(
      currentPlayer,
      gameState.currentDiceValue,
      gameState.boardType,
    );
    return validTokens.map((t) => t.id);
  }, [gameState, currentPlayer]);

  // Turn Timer Countdown
  useEffect(() => {
    if (gameState.isGameOver || activeMovingTokenId) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTurnTimeout();
          return initialTimeSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.currentPlayerId, gameState.isGameOver, gameState.diceRolled, gameState.currentDiceValue, activeMovingTokenId]);

  // Reset timer on turn change
  useEffect(() => {
    setTimeLeft(initialTimeSeconds);
  }, [gameState.currentPlayerId]);

  // Handle Game Over -> Navigate to Results Screen
  useEffect(() => {
    if (gameState.isGameOver) {
      soundService.play('game_win');
      vibrationService.vibrateSuccess();
      const timeout = setTimeout(() => {
        navigation.replace(ROUTES.LUDO_RESULT, {
          matchId: gameState.matchId,
          gameState,
          winnerId: gameState.winnerId,
        });
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [gameState.isGameOver]);

  // Bot Auto Play Loop
  useEffect(() => {
    if (gameState.isGameOver || activeMovingTokenId) return;

    if (currentPlayer.isBot) {
      // 1. Bot Rolls Dice after 800ms
      if (gameState.canRoll && !gameState.diceRolled) {
        const rollTimeout = setTimeout(() => {
          handleDiceRoll();
        }, 800);
        return () => clearTimeout(rollTimeout);
      }

      // 2. Bot selects best token move after 700ms
      if (gameState.diceRolled && gameState.currentDiceValue !== null) {
        const moveTimeout = setTimeout(() => {
          const bestToken = LudoBotAI.chooseBestToken(
            gameState,
            currentPlayer,
            gameState.currentDiceValue!,
            difficulty,
          );

          if (bestToken) {
            handleMoveToken(bestToken.id);
          } else {
            setGameState((prev) => ludoEngine.passTurn(prev));
          }
        }, 750);
        return () => clearTimeout(moveTimeout);
      }
    }
  }, [gameState.currentPlayerId, gameState.canRoll, gameState.diceRolled, gameState.currentDiceValue, activeMovingTokenId]);

  // Auto-move for human player if only 1 valid token exists!
  useEffect(() => {
    if (isMyTurn && gameState.diceRolled && gameState.currentDiceValue !== null && !activeMovingTokenId) {
      if (selectableTokenIds.length === 1) {
        const autoMoveTimeout = setTimeout(() => {
          handleMoveToken(selectableTokenIds[0]);
        }, 400);
        return () => clearTimeout(autoMoveTimeout);
      } else if (selectableTokenIds.length === 0) {
        const passTimeout = setTimeout(() => {
          setGameState((prev) => ludoEngine.passTurn(prev));
        }, 1200);
        return () => clearTimeout(passTimeout);
      }
    }
  }, [isMyTurn, selectableTokenIds, gameState.diceRolled, gameState.currentDiceValue, activeMovingTokenId]);

  // Handle Dice Roll
  const handleDiceRoll = useCallback(() => {
    if (!gameState.canRoll || isRolling || gameState.isGameOver || activeMovingTokenId) return;

    setIsRolling(true);
    soundService.play('dice_roll');
    vibrationService.vibrateTap();

    setTimeout(() => {
      setIsRolling(false);
      const { newState } = ludoEngine.rollDice(gameState);
      setGameState(newState);
    }, 550);
  }, [gameState, isRolling, activeMovingTokenId]);

  // Handle Moving a Token with Step-by-Step Hopping Physics
  const handleMoveToken = useCallback(
    (tokenId: string) => {
      if (!gameState.diceRolled || gameState.currentDiceValue === null || activeMovingTokenId) return;

      const token = currentPlayer.tokens.find((t) => t.id === tokenId);
      if (!token) return;

      const diceVal = gameState.currentDiceValue;
      const move = {
        tokenId,
        fromPosition: token.position,
        toPosition: token.position + diceVal,
        fromStepCount: token.stepCount,
        toStepCount: token.stepCount + diceVal,
      };

      const steps: Array<[number, number]> = [];
      if (token.status === 'home') {
        const baseCoord = LudoPath.get4PCellCoordinates(
          token.stepCount,
          currentPlayer.color,
          'home',
          token.tokenIndex,
        );
        const startCoord = LudoPath.get4PCellCoordinates(
          0,
          currentPlayer.color,
          'active',
          token.tokenIndex,
        );
        steps.push(baseCoord);
        steps.push(startCoord);
      } else {
        const fromStep = token.stepCount;
        const toStep = Math.min(56, fromStep + diceVal);
        for (let s = fromStep; s <= toStep; s++) {
          steps.push(
            LudoPath.get4PCellCoordinates(
              s,
              currentPlayer.color,
              s >= 56 ? 'finished' : 'active',
              token.tokenIndex,
            ),
          );
        }
      }

      setPendingMove({ move, playerId: currentPlayer.id });
      setMovingStepSteps(steps);
      setActiveMovingTokenId(tokenId);
    },
    [gameState, currentPlayer, activeMovingTokenId],
  );

  // Callback after full step hopping sequence finishes
  const handleMoveAnimationEnd = useCallback(() => {
    if (pendingMove) {
      const { newState } = ludoEngine.applyMove(gameState, pendingMove.move, pendingMove.playerId);
      setGameState(newState);
      setPendingMove(null);
    }
    setActiveMovingTokenId(null);
    setMovingStepSteps([]);
  }, [gameState, pendingMove]);

  // Handle Turn Timeout
  const handleTurnTimeout = () => {
    if (activeMovingTokenId) return;

    if (gameState.canRoll && !gameState.diceRolled) {
      handleDiceRoll();
    } else if (gameState.diceRolled && selectableTokenIds.length > 0) {
      handleMoveToken(selectableTokenIds[0]);
    } else {
      setGameState((prev) => ludoEngine.passTurn(prev));
    }
  };

  // Emote Trigger
  const handleSendEmote = (emoji: string) => {
    setShowEmotePicker(false);
    setFloatingEmote({ emoji, name: userName });
    setTimeout(() => setFloatingEmote(null), 2500);
  };

  const EMOTE_LIST = ['😂', '🔥', '👏', '👑', '😱', '🎲', '😎', '🎉'];

  const renderPlayerBadge = (player?: LudoPlayer, customWidth?: number | string) => {
    if (!player) return null;
    const isCurrent = player.id === gameState.currentPlayerId;
    return (
      <LudoPlayerBadge
        key={player.id}
        player={player}
        badgeColor={player.color}
        placeholderText={player.name}
        isCurrentTurn={isCurrent}
        canRoll={isCurrent && gameState.canRoll && !gameState.diceRolled}
        isRolling={isRolling && isCurrent}
        currentDiceValue={isCurrent ? gameState.currentDiceValue : null}
        timeLeft={timeLeft}
        onRollDice={handleDiceRoll}
        isMyTurn={isPlayerHumanTurn(player)}
        containerWidth={customWidth}
      />
    );
  };

  // Identify players for classic board layouts
  const p1Red = gameState.players.find((p) => p.color === 'red');
  const p2Green = gameState.players.find((p) => p.color === 'green');
  const p3Yellow = gameState.players.find((p) => p.color === 'yellow');
  const p4Blue = gameState.players.find((p) => p.color === 'blue');
  const p5Purple = gameState.players.find((p) => p.color === 'purple');
  const p6Orange = gameState.players.find((p) => p.color === 'orange');

  // Render Top and Bottom Badges Row depending on player count (1v1, 3P, 4P, 5P, 6P)
  const renderTopBadges = () => {
    if (gameState.players.length === 2) {
      // 1v1 Duel: Opponent at Top
      return (
        <View style={styles.singleBadgeRow}>
          {renderPlayerBadge(gameState.players[1], width - 24)}
        </View>
      );
    }
    if (gameState.players.length === 3) {
      return (
        <View style={styles.badgesRow}>
          {renderPlayerBadge(gameState.players[0])}
          {renderPlayerBadge(gameState.players[1])}
        </View>
      );
    }
    if (gameState.players.length === 4) {
      return (
        <View style={styles.badgesRow}>
          {renderPlayerBadge(p1Red || gameState.players[0])}
          {renderPlayerBadge(p2Green || gameState.players[1])}
        </View>
      );
    }
    if (gameState.players.length === 5) {
      // 5-Player Pentagonal Top Row: Red (Left) & Green (Right)
      const itemWidth = (width - 24 - 8) / 2;
      return (
        <View style={styles.badgesRow}>
          {renderPlayerBadge(p1Red || gameState.players[0], itemWidth)}
          {renderPlayerBadge(p2Green || gameState.players[1], itemWidth)}
        </View>
      );
    }
    if (gameState.players.length === 6) {
      // 6-Player Hexagonal Top Row: Red (Left) & Green (Right)
      const itemWidth = (width - 24 - 8) / 2;
      return (
        <View style={styles.badgesRow}>
          {renderPlayerBadge(p1Red || gameState.players[0], itemWidth)}
          {renderPlayerBadge(p2Green || gameState.players[1], itemWidth)}
        </View>
      );
    }
    return null;
  };

  const renderBottomBadges = () => {
    if (gameState.players.length === 2) {
      // 1v1 Duel: User (You) at Bottom
      return (
        <View style={styles.singleBadgeRow}>
          {renderPlayerBadge(gameState.players[0], width - 24)}
        </View>
      );
    }
    if (gameState.players.length === 3) {
      return (
        <View style={styles.badgesRow}>
          {renderPlayerBadge(gameState.players[2])}
          <View style={{ width: (width - 32) / 2 }} />
        </View>
      );
    }
    if (gameState.players.length === 4) {
      return (
        <View style={styles.badgesRow}>
          {renderPlayerBadge(p4Blue || gameState.players[3])}
          {renderPlayerBadge(p3Yellow || gameState.players[2])}
        </View>
      );
    }
    if (gameState.players.length === 5) {
      // 5-Player Pentagonal Bottom Row: Purple (Left), Blue (Center), Yellow (Right)
      const itemWidth = (width - 24 - 12) / 3;
      return (
        <View style={styles.multiBadgesRow}>
          {renderPlayerBadge(p5Purple || gameState.players[4], itemWidth)}
          {renderPlayerBadge(p4Blue || gameState.players[3], itemWidth)}
          {renderPlayerBadge(p3Yellow || gameState.players[2], itemWidth)}
        </View>
      );
    }
    if (gameState.players.length === 6) {
      // 6-Player Hexagonal Bottom Rows:
      // Row 1: Purple (Left) & Yellow (Right)
      // Row 2: Orange (Left) & Blue (Right)
      const itemWidth = (width - 24 - 8) / 2;
      return (
        <View style={{ width: '100%' }}>
          <View style={[styles.badgesRow, { marginBottom: 6 }]}>
            {renderPlayerBadge(p5Purple || gameState.players[4], itemWidth)}
            {renderPlayerBadge(p3Yellow || gameState.players[2], itemWidth)}
          </View>
          <View style={styles.badgesRow}>
            {renderPlayerBadge(p6Orange || gameState.players[5], itemWidth)}
            {renderPlayerBadge(p4Blue || gameState.players[3], itemWidth)}
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <LinearGradient
      colors={['#422415', '#2E170C', '#1A0C05']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top + 4, 20) }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setShowExitModal(true)}
        >
          <Text style={styles.headerBtnText}>✕ Exit</Text>
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.headerCenterTitle}>
            {gameState.players.length === 2
              ? '1v1 LUDO DUEL'
              : gameState.players.length === 5
              ? '5-PLAYER PENTAGON'
              : 'PLAY · ROLL · WIN'}
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setIsSoundOn(!isSoundOn)}
          >
            <Text style={styles.iconText}>{isSoundOn ? '🔊' : '🔇'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowEmotePicker(!showEmotePicker)}
          >
            <Text style={styles.iconText}>💬</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating Action VFX Overlay */}
      {gameState.lastActionText ? (
        <LudoActionVFX
          actionText={gameState.lastActionText}
          actionType={gameState.lastActionType}
        />
      ) : null}

      {/* Floating Emote Overlay */}
      {floatingEmote ? (
        <View style={styles.floatingEmoteBox}>
          <Text style={styles.floatingEmoteEmoji}>{floatingEmote.emoji}</Text>
          <Text style={styles.floatingEmoteName}>{floatingEmote.name}</Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={[styles.mainLayout, { paddingBottom: insets.bottom + 10 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Badges Row */}
        {renderTopBadges()}

        {/* Center Ludo Board */}
        <View style={styles.boardWrap}>
          {gameState.boardType === '6player' ? (
            <LudoBoard6P
              gameState={gameState}
              selectableTokenIds={selectableTokenIds}
              onSelectToken={handleMoveToken}
              activeColor={currentPlayer.color}
            />
          ) : gameState.boardType === '5player' ? (
            <LudoBoard5P
              gameState={gameState}
              selectableTokenIds={selectableTokenIds}
              onSelectToken={handleMoveToken}
              activeColor={currentPlayer.color}
            />
          ) : (
            <LudoBoard4P
              gameState={gameState}
              selectableTokenIds={selectableTokenIds}
              onSelectToken={handleMoveToken}
              activeColor={currentPlayer.color}
              activeMovingTokenId={activeMovingTokenId}
              movingStepSteps={movingStepSteps}
              onMoveAnimationEnd={handleMoveAnimationEnd}
            />
          )}
        </View>

        {/* Bottom Badges Row */}
        {renderBottomBadges()}
      </ScrollView>

      {/* Quick Emote Picker Modal */}
      {showEmotePicker && (
        <View style={styles.emotePickerCard}>
          <View style={styles.emoteRow}>
            {EMOTE_LIST.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.emoteBtn}
                onPress={() => handleSendEmote(emoji)}
              >
                <Text style={styles.emoteText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Forfeit / Exit Modal */}
      <Modal
        visible={showExitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.exitModalContent}>
            <Text style={styles.exitTitle}>Leave Match?</Text>
            <Text style={styles.exitDesc}>
              Do you want to exit to the main menu?
            </Text>

            <View style={styles.exitBtnRow}>
              <TouchableOpacity
                style={styles.exitCancelBtn}
                onPress={() => setShowExitModal(false)}
              >
                <Text style={styles.exitCancelText}>Keep Playing</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exitConfirmBtn}
                onPress={() => {
                  setShowExitModal(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.exitConfirmText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  headerBtn: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  headerBtnText: {
    color: '#ECF0F1',
    fontWeight: '800',
    fontSize: 12,
  },
  titleWrap: {
    alignItems: 'center',
  },
  headerCenterTitle: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerRightActions: {
    flexDirection: 'row',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  iconText: {
    fontSize: 15,
  },
  mainLayout: {
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgesRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  singleBadgeRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  },
  multiBadgesRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
    gap: 6,
  },
  boardWrap: {
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingEmoteBox: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F39C12',
    alignItems: 'center',
    zIndex: 999,
  },
  floatingEmoteEmoji: {
    fontSize: 36,
  },
  floatingEmoteName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  emotePickerCard: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: '#1E272E',
    borderRadius: 20,
    padding: 10,
    borderWidth: 2,
    borderColor: '#3498DB',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  emoteRow: {
    flexDirection: 'row',
  },
  emoteBtn: {
    padding: 8,
  },
  emoteText: {
    fontSize: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  exitModalContent: {
    width: '100%',
    backgroundColor: '#1E272E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E74C3C',
    alignItems: 'center',
  },
  exitTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  exitDesc: {
    color: '#BDC3C7',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  exitBtnRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  exitCancelBtn: {
    flex: 1,
    marginRight: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  exitCancelText: {
    color: '#ECF0F1',
    fontWeight: '800',
  },
  exitConfirmBtn: {
    flex: 1,
    marginLeft: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E74C3C',
    alignItems: 'center',
  },
  exitConfirmText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});

export default LudoGameScreen;
