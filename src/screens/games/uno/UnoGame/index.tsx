import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../theme';
import { ROUTES } from '../../../../navigation/routes';
import {
  UnoActiveColor,
  UnoCard,
  UnoDifficulty,
  UnoGameMode,
  UnoGameState,
  UnoMove,
  UnoPlayer,
} from '../../../../gameEngine/uno/unoTypes';
import { unoEngine } from '../../../../gameEngine/uno/unoEngine';
import { UnoRules } from '../../../../gameEngine/uno/unoRules';
import { UnoBotAI } from '../../../../gameEngine/uno/unoBot';
import {
  UNO_COLOR_THEMES,
  UNO_DEFAULT_TIME_SECONDS,
  UNO_ROBOT_PROFILES,
} from '../../../../gameEngine/uno/unoConstants';
import { soundService } from '../../../../services/sound/soundService';
import { vibrationService } from '../../../../services/vibration/vibrationService';
import { useAppSelector } from '../../../../redux/hooks';

import UnoCardView from '../components/UnoCardView';
import UnoHandView from '../components/UnoHandView';
import UnoOpponentHand from '../components/UnoOpponentHand';
import UnoTableCenter from '../components/UnoTableCenter';
import UnoColorPickerModal from '../components/UnoColorPickerModal';
import UnoActionVFXOverlay from '../components/UnoActionVFXOverlay';
import UnoPlayerBar from '../components/UnoPlayerBar';

const { width, height } = Dimensions.get('window');

export const UnoGameScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark } = useTheme();

  const userProfile = useAppSelector((state) => state.user.profile);
  const currentUserId = useAppSelector((state) => state.auth.userId) || 'player_me';

  const matchId = route.params?.matchId || `uno_${Date.now()}`;
  const mode: UnoGameMode = route.params?.mode || 'computer';
  const difficulty: UnoDifficulty = route.params?.difficulty || 'medium';
  const playerCount: 2 | 4 = route.params?.playerCount || 2;
  const initialTimeSeconds = route.params?.timeSeconds || UNO_DEFAULT_TIME_SECONDS;

  const player1Name = route.params?.player1Name || userProfile?.name || userProfile?.username || 'Player 1';
  const player2Name = route.params?.player2Name || 'Player 2';

  // Build Players Configuration
  const initialPlayers = React.useMemo(() => {
    if (mode === 'computer') {
      if (playerCount === 2) {
        const bot = UNO_ROBOT_PROFILES.find((b) => b.difficulty === difficulty) || UNO_ROBOT_PROFILES[0];
        return [
          { id: currentUserId, name: player1Name, isBot: false, avatar: '😎', isHost: true },
          { id: bot.id, name: bot.name, isBot: true, avatar: bot.avatar },
        ];
      } else {
        // 4-Player Table: 1 Human + 3 Bots
        return [
          { id: currentUserId, name: player1Name, isBot: false, avatar: '😎', isHost: true },
          { id: UNO_ROBOT_PROFILES[0].id, name: UNO_ROBOT_PROFILES[0].name, isBot: true, avatar: UNO_ROBOT_PROFILES[0].avatar },
          { id: UNO_ROBOT_PROFILES[1].id, name: UNO_ROBOT_PROFILES[1].name, isBot: true, avatar: UNO_ROBOT_PROFILES[1].avatar },
          { id: UNO_ROBOT_PROFILES[3].id, name: UNO_ROBOT_PROFILES[3].name, isBot: true, avatar: UNO_ROBOT_PROFILES[3].avatar },
        ];
      }
    } else {
      // Local Pass & Play
      return [
        { id: 'p1', name: player1Name, isBot: false, avatar: '😎', isHost: true },
        { id: 'p2', name: player2Name, isBot: false, avatar: '🤠' },
      ];
    }
  }, [mode, difficulty, playerCount, currentUserId, player1Name, player2Name]);

  // Game Engine State
  const [gameState, setGameState] = useState<UnoGameState>(() =>
    unoEngine.getInitialState({
      matchId,
      mode,
      difficulty,
      timeSeconds: initialTimeSeconds,
      players: initialPlayers,
    }),
  );

  const [timeLeft, setTimeLeft] = useState<number>(initialTimeSeconds);
  const [pendingWildCard, setPendingWildCard] = useState<UnoCard | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [actionVfxText, setActionVfxText] = useState<string>('');
  const [showActionVfx, setShowActionVfx] = useState<boolean>(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState<boolean>(false);
  const [botThinkingText, setBotThinkingText] = useState<string>('');

  const gameStateRef = useRef<UnoGameState>(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const myPlayer = gameState.players.find((p) => p.id === currentUserId) || gameState.players[0];
  const isMyTurn = gameState.currentPlayerId === myPlayer.id && !gameState.roundOver;
  const is2Player = gameState.players.length === 2;

  // Trigger Action Banner VFX
  const triggerVfx = useCallback((text: string) => {
    setActionVfxText(text);
    setShowActionVfx(true);
    const timer = setTimeout(() => setShowActionVfx(false), 1600);
    return () => clearTimeout(timer);
  }, []);

  // Turn Countdown Timer
  useEffect(() => {
    if (gameState.roundOver) return;

    setTimeLeft(initialTimeSeconds);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timeout: If human player, automatically draw card
          if (gameStateRef.current.currentPlayerId === myPlayer.id) {
            handleDrawCard();
          }
          return initialTimeSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.currentPlayerIndex, gameState.turnNumber, gameState.roundOver]);

  // Execute Move Helper
  const executeMove = useCallback(
    (move: UnoMove, playerId: string) => {
      const currentState = gameStateRef.current;
      const res = unoEngine.applyMove(currentState, move, playerId);
      if (res.isSuccess) {
        gameStateRef.current = res.newState;
        setGameState(res.newState);
        soundService.play('card_flip');

        if (res.newState.lastAction?.actionText) {
          triggerVfx(res.newState.lastAction.actionText);
        }

        // Check if game won
        if (res.newState.roundOver && res.newState.winnerId) {
          soundService.play('game_win');
          vibrationService.vibrate('success');

          setTimeout(() => {
            navigation.navigate(ROUTES.UNO_RESULT, {
              matchId: res.newState.matchId,
              gameState: res.newState,
              winnerId: res.newState.winnerId,
              mode,
              difficulty,
            });
          }, 1200);
        }
      } else if (res.reason) {
        vibrationService.vibrate('error');
      }
    },
    [mode, difficulty, navigation, triggerVfx],
  );

  // Bot AI Turn Loop
  useEffect(() => {
    if (gameState.roundOver) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer && currentPlayer.isBot) {
      setBotThinkingText(`${currentPlayer.name} is thinking...`);

      const decision = UnoBotAI.getBotDecision(gameStateRef.current, currentPlayer.id);

      const botTimer = setTimeout(() => {
        setBotThinkingText('');

        let currentS = gameStateRef.current;

        // If bot catches opponent Uno
        if (decision.catchTargetId) {
          const catchRes = unoEngine.applyMove(
            currentS,
            { type: 'catch_uno', targetPlayerId: decision.catchTargetId },
            currentPlayer.id,
          );
          if (catchRes.isSuccess) currentS = catchRes.newState;
        }

        // If bot calls Uno
        if (decision.shouldShoutUno) {
          const unoRes = unoEngine.applyMove(
            currentS,
            { type: 'call_uno' },
            currentPlayer.id,
          );
          if (unoRes.isSuccess) currentS = unoRes.newState;
        }

        // Apply primary bot move
        const moveRes = unoEngine.applyMove(currentS, decision.move, currentPlayer.id);
        if (moveRes.isSuccess) {
          gameStateRef.current = moveRes.newState;
          setGameState(moveRes.newState);
          soundService.play('card_flip');

          if (moveRes.newState.lastAction?.actionText) {
            triggerVfx(moveRes.newState.lastAction.actionText);
          }

          if (moveRes.newState.roundOver && moveRes.newState.winnerId) {
            soundService.play('game_win');
            vibrationService.vibrate('success');

            setTimeout(() => {
              navigation.navigate(ROUTES.UNO_RESULT, {
                matchId: moveRes.newState.matchId,
                gameState: moveRes.newState,
                winnerId: moveRes.newState.winnerId,
                mode,
                difficulty,
              });
            }, 1200);
          }
        }
      }, decision.delayMs);

      return () => clearTimeout(botTimer);
    }
  }, [
    gameState.currentPlayerIndex,
    gameState.turnNumber,
    gameState.roundOver,
    gameState.isDrawPhase,
    mode,
    difficulty,
    navigation,
    triggerVfx,
  ]);

  // Handle Player Card Tap
  const handleCardPress = (card: UnoCard) => {
    if (!isMyTurn || gameState.roundOver) return;

    // Check if card requires Wild Color selection
    if (UnoRules.isWildCard(card)) {
      setPendingWildCard(card);
      setShowColorPicker(true);
      return;
    }

    executeMove({ type: 'play_card', cardId: card.id }, myPlayer.id);
  };

  // Handle Color Selected for Wild Card
  const handleColorSelected = (color: UnoActiveColor) => {
    setShowColorPicker(false);
    if (pendingWildCard) {
      executeMove(
        { type: 'play_card', cardId: pendingWildCard.id, chosenColor: color },
        myPlayer.id,
      );
      setPendingWildCard(null);
    }
  };

  // Handle Draw Card
  const handleDrawCard = () => {
    if (!isMyTurn || gameState.isDrawPhase || gameState.roundOver) return;
    executeMove({ type: 'draw_card' }, myPlayer.id);
  };

  // Handle Pass Turn
  const handlePassTurn = () => {
    if (!isMyTurn || !gameState.isDrawPhase || gameState.roundOver) return;
    executeMove({ type: 'pass_turn' }, myPlayer.id);
  };

  // Handle Shout Uno
  const handleShoutUno = () => {
    executeMove({ type: 'call_uno' }, myPlayer.id);
    vibrationService.vibrate('success');
  };

  // Handle Catch Opponent Uno
  const handleCatchUno = (targetPlayerId: string) => {
    executeMove({ type: 'catch_uno', targetPlayerId }, myPlayer.id);
  };

  // Opponents arrangement
  const otherPlayers = gameState.players.filter((p) => p.id !== myPlayer.id);
  const topOpponent = otherPlayers[0];
  const leftOpponent = otherPlayers.length > 1 ? otherPlayers[1] : null;
  const rightOpponent = otherPlayers.length > 2 ? otherPlayers[2] : null;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#050D09' : '#0B1A12' }]}>
      <StatusBar barStyle="light-content" />

      {/* Top Table App Bar */}
      <LinearGradient
        colors={['rgba(192, 57, 43, 0.9)', 'rgba(100, 30, 22, 0.6)', 'transparent']}
        style={[styles.topBar, { paddingTop: Math.max(insets.top + 6, 24) }]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.iconBtn}
          onPress={() => setIsPauseModalOpen(true)}
        >
          <Text style={styles.iconBtnText}>⏸</Text>
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={styles.matchTitle}>
            {mode === 'computer' ? `VS ROBOT (${difficulty.toUpperCase()})` : 'PASS & PLAY'}
          </Text>
          {botThinkingText ? (
            <Text style={styles.botThinkingText}>{botThinkingText}</Text>
          ) : (
            <Text style={styles.turnStatusText}>
              {isMyTurn ? '🌟 YOUR TURN' : `${gameState.players[gameState.currentPlayerIndex].name}'s Turn`}
            </Text>
          )}
        </View>

        <View style={styles.iconBtn}>
          <Text style={styles.deckSmallText}>🂡 {gameState.deck.length}</Text>
        </View>
      </LinearGradient>

      {/* Action VFX Overlay */}
      <UnoActionVFXOverlay visible={showActionVfx} actionText={actionVfxText} />

      {/* Main Table Arena */}
      <View style={styles.tableArena}>
        {/* Top Opponent (2P or 4P Center) */}
        {topOpponent && (
          <View style={styles.topOpponentArea}>
            <UnoOpponentHand
              player={topOpponent}
              isCurrentTurn={gameState.currentPlayerId === topOpponent.id}
              position="top"
              canCatchUno={UnoRules.canCatchUno(topOpponent)}
              onCatchUno={handleCatchUno}
            />
          </View>
        )}

        {/* Center Middle Row (Left Opponent, Center Orbit & Piles, Right Opponent) */}
        <View style={styles.centerRow}>
          {/* Left Opponent in 4-Player Table */}
          {leftOpponent && (
            <View style={styles.sideOpponentArea}>
              <UnoOpponentHand
                player={leftOpponent}
                isCurrentTurn={gameState.currentPlayerId === leftOpponent.id}
                position="left"
                canCatchUno={UnoRules.canCatchUno(leftOpponent)}
                onCatchUno={handleCatchUno}
              />
            </View>
          )}

          {/* Center Table Piles & Direction Orbit */}
          <UnoTableCenter
            topCard={gameState.topCard}
            activeColor={gameState.activeColor}
            deckCount={gameState.deck.length}
            direction={gameState.direction}
            isMyTurn={isMyTurn}
            isDrawPhase={gameState.isDrawPhase}
            canPass={gameState.isDrawPhase}
            onDrawCard={handleDrawCard}
            onPassTurn={handlePassTurn}
            disabled={gameState.roundOver}
          />

          {/* Right Opponent in 4-Player Table */}
          {rightOpponent && (
            <View style={styles.sideOpponentArea}>
              <UnoOpponentHand
                player={rightOpponent}
                isCurrentTurn={gameState.currentPlayerId === rightOpponent.id}
                position="right"
                canCatchUno={UnoRules.canCatchUno(rightOpponent)}
                onCatchUno={handleCatchUno}
              />
            </View>
          )}
        </View>
      </View>

      {/* Bottom Area: Player Bar & Hand */}
      <View style={[styles.bottomHandArea, { paddingBottom: insets.bottom + 8 }]}>
        <UnoPlayerBar
          player={myPlayer}
          isMyTurn={isMyTurn}
          timeLeft={timeLeft}
          maxTime={initialTimeSeconds}
          canShoutUno={UnoRules.canShoutUno(myPlayer)}
          onShoutUno={handleShoutUno}
        />

        <UnoHandView
          hand={myPlayer.hand}
          topCard={gameState.topCard}
          activeColor={gameState.activeColor}
          isMyTurn={isMyTurn}
          isDrawPhase={gameState.isDrawPhase}
          drawnCardId={gameState.drawnCardId}
          onCardPress={handleCardPress}
          disabled={gameState.roundOver}
        />
      </View>

      {/* Color Picker Modal */}
      <UnoColorPickerModal
        visible={showColorPicker}
        onSelectColor={handleColorSelected}
      />

      {/* Pause & Settings Modal */}
      <Modal
        visible={isPauseModalOpen}
        transparent
        animationType="fade"
      >
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseModalCard}>
            <Text style={styles.pauseTitle}>MATCH PAUSED</Text>
            <Text style={styles.pauseSub}>What would you like to do?</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.pauseBtnResume}
              onPress={() => setIsPauseModalOpen(false)}
            >
              <LinearGradient
                colors={['#2ECC71', '#27AE60']}
                style={styles.pauseBtnGradient}
              >
                <Text style={styles.pauseBtnText}>RESUME GAME</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.pauseBtnLeave}
              onPress={() => {
                setIsPauseModalOpen(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.leaveText}>Leave Match</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 20,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  iconBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  deckSmallText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F1C40F',
  },
  topBarCenter: {
    alignItems: 'center',
  },
  matchTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FADBD8',
    letterSpacing: 1,
  },
  turnStatusText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2ECC71',
    marginTop: 2,
  },
  botThinkingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F1C40F',
    marginTop: 2,
  },
  tableArena: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  topOpponentArea: {
    alignItems: 'center',
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  sideOpponentArea: {
    width: 70,
    alignItems: 'center',
  },
  bottomHandArea: {
    width: '100%',
    backgroundColor: 'rgba(8, 16, 12, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  pauseOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pauseModalCard: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#141E18',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pauseTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  pauseSub: {
    fontSize: 12,
    color: '#8CA093',
    marginTop: 4,
    marginBottom: 20,
  },
  pauseBtnResume: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  pauseBtnGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  pauseBtnLeave: {
    paddingVertical: 10,
  },
  leaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E74C3C',
  },
});

export default UnoGameScreen;
