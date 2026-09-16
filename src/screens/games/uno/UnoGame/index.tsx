import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
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
  UNO_DEFAULT_TIME_SECONDS,
  UNO_ROBOT_PROFILES,
} from '../../../../gameEngine/uno/unoConstants';
import { soundService } from '../../../../services/sound/soundService';
import { vibrationService } from '../../../../services/vibration/vibrationService';
import { useAppSelector } from '../../../../redux/hooks';

import UnoHandView from '../components/UnoHandView';
import UnoOpponentHand from '../components/UnoOpponentHand';
import UnoTableCenter from '../components/UnoTableCenter';
import UnoColorPickerModal from '../components/UnoColorPickerModal';
import UnoActionVFXOverlay from '../components/UnoActionVFXOverlay';
import UnoPlayerBar from '../components/UnoPlayerBar';
import UnoCardFlightOverlay, { CardFlightItem } from '../components/UnoCardFlightOverlay';

const { width, height } = Dimensions.get('window');

export const UnoGameScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark } = useTheme();

  const userProfile = useAppSelector((state) => state.user.profile);
  const currentUserId = useAppSelector((state) => state.auth.userId) || 'player_me';

  const matchId = route.params?.matchId || `UN0856`;
  const mode: UnoGameMode = route.params?.mode || 'computer';
  const difficulty: UnoDifficulty = route.params?.difficulty || 'medium';
  const playerCount: number = route.params?.playerCount || 8;
  const initialTimeSeconds = route.params?.timeSeconds || UNO_DEFAULT_TIME_SECONDS;

  const player1Name = route.params?.player1Name || userProfile?.name || userProfile?.username || 'You';

  // State for toggles & toasts
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2000);
  };

  // Build Players Configuration
  const initialPlayers = React.useMemo(() => {
    if (playerCount === 2) {
      const bot = UNO_ROBOT_PROFILES[0];
      return [
        { id: currentUserId, name: player1Name, isBot: false, avatar: '👩🏻', isHost: true },
        { id: bot.id, name: bot.name, isBot: true, avatar: bot.avatar },
      ];
    } else if (playerCount === 4) {
      return [
        { id: currentUserId, name: player1Name, isBot: false, avatar: '👩🏻', isHost: true },
        { id: UNO_ROBOT_PROFILES[0].id, name: UNO_ROBOT_PROFILES[0].name, isBot: true, avatar: UNO_ROBOT_PROFILES[0].avatar },
        { id: UNO_ROBOT_PROFILES[1].id, name: UNO_ROBOT_PROFILES[1].name, isBot: true, avatar: UNO_ROBOT_PROFILES[1].avatar },
        { id: UNO_ROBOT_PROFILES[2].id, name: UNO_ROBOT_PROFILES[2].name, isBot: true, avatar: UNO_ROBOT_PROFILES[2].avatar },
      ];
    } else {
      // 8-Player Full Table
      const bots = UNO_ROBOT_PROFILES.slice(0, 7);
      return [
        { id: currentUserId, name: player1Name, isBot: false, avatar: '👩🏻', isHost: true },
        ...bots.map((b) => ({
          id: b.id,
          name: b.name,
          isBot: true,
          avatar: b.avatar,
        })),
      ];
    }
  }, [playerCount, currentUserId, player1Name]);

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
  const [cardFlights, setCardFlights] = useState<CardFlightItem[]>([]);
  const [opponentActions, setOpponentActions] = useState<Record<string, string>>({});

  const triggerFlight = useCallback((flight: Omit<CardFlightItem, 'id'>) => {
    const id = `fl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setCardFlights((prev) => [...prev, { ...flight, id }]);
  }, []);

  const removeFlight = useCallback((id: string) => {
    setCardFlights((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const triggerOpponentActionMsg = useCallback((playerId: string, msg: string) => {
    setOpponentActions((prev) => ({ ...prev, [playerId]: msg }));
    setTimeout(() => {
      setOpponentActions((prev) => {
        const copy = { ...prev };
        delete copy[playerId];
        return copy;
      });
    }, 2200);
  }, []);

  const gameStateRef = useRef<UnoGameState>(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const myPlayer = gameState.players.find((p) => p.id === currentUserId) || gameState.players[0];
  const isMyTurn = gameState.currentPlayerId === myPlayer.id && !gameState.roundOver;

  // Trigger Action Banner VFX
  const triggerVfx = useCallback((text: string) => {
    setActionVfxText(text);
    setShowActionVfx(true);
    const timer = setTimeout(() => setShowActionVfx(false), 1600);
    return () => clearTimeout(timer);
  }, []);

  // Execute Move Helper
  const executeMove = useCallback(
    (move: UnoMove, playerId: string) => {
      const currentState = gameStateRef.current;
      const res = unoEngine.applyMove(currentState, move, playerId);
      if (res.isSuccess) {
        gameStateRef.current = res.newState;
        setGameState(res.newState);
        if (isSoundOn) soundService.play('card_flip');

        if (res.newState.lastAction?.actionText) {
          triggerVfx(res.newState.lastAction.actionText);
        }

        // Check if game won
        if (res.newState.roundOver && res.newState.winnerId) {
          if (isSoundOn) soundService.play('game_win');
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
    [mode, difficulty, navigation, triggerVfx, isSoundOn],
  );

  // Turn Countdown Timer Interval
  useEffect(() => {
    if (gameState.roundOver) return;

    setTimeLeft(initialTimeSeconds);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    gameState.currentPlayerIndex,
    gameState.turnNumber,
    gameState.isDrawPhase,
    gameState.roundOver,
    initialTimeSeconds,
  ]);

  // Turn Timeout Watchdog
  useEffect(() => {
    if (gameState.roundOver || timeLeft > 0) return;

    const curState = gameStateRef.current;
    if (curState.roundOver) return;

    if (curState.currentPlayerId === myPlayer.id) {
      if (curState.isDrawPhase) {
        executeMove({ type: 'pass_turn' }, myPlayer.id);
      } else {
        executeMove({ type: 'draw_card' }, myPlayer.id);
      }
    } else {
      const curPlayer = curState.players[curState.currentPlayerIndex];
      if (curPlayer && curPlayer.isBot) {
        const decision = UnoBotAI.getBotDecision(curState, curPlayer.id);
        let moveRes = unoEngine.applyMove(curState, decision.move, curPlayer.id);
        if (!moveRes.isSuccess) {
          moveRes = unoEngine.applyMove(curState, { type: 'draw_card' }, curPlayer.id);
        }
        if (moveRes.isSuccess && moveRes.newState) {
          gameStateRef.current = moveRes.newState;
          setGameState(moveRes.newState);
        } else {
          const fallbackState = JSON.parse(JSON.stringify(curState));
          fallbackState.isDrawPhase = false;
          fallbackState.drawnCardId = undefined;
          unoEngine.advanceTurn(fallbackState, 1);
          gameStateRef.current = fallbackState;
          setGameState(fallbackState);
        }
      }
    }
  }, [timeLeft, myPlayer.id, executeMove, gameState.roundOver]);

  // Bot AI Turn Loop
  useEffect(() => {
    if (gameState.roundOver) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer && currentPlayer.isBot) {
      const decision = UnoBotAI.getBotDecision(gameStateRef.current, currentPlayer.id);
      // Realistic human-like thinking delay (1.4s - 2.0s)
      const thinkingDelay = Math.min(2200, Math.max(1400, decision.delayMs + 400));

      const botTimer = setTimeout(() => {
        let currentS = gameStateRef.current;
        if (currentS.roundOver || currentS.currentPlayerId !== currentPlayer.id) {
          return;
        }

        if (decision.catchTargetId) {
          const catchRes = unoEngine.applyMove(
            currentS,
            { type: 'catch_uno', targetPlayerId: decision.catchTargetId },
            currentPlayer.id,
          );
          if (catchRes.isSuccess) {
            currentS = catchRes.newState;
            triggerOpponentActionMsg(currentPlayer.id, '⚡ Caught UNO Penalty!');
          }
        }

        if (decision.shouldShoutUno) {
          const unoRes = unoEngine.applyMove(
            currentS,
            { type: 'call_uno' },
            currentPlayer.id,
          );
          if (unoRes.isSuccess) {
            currentS = unoRes.newState;
            triggerOpponentActionMsg(currentPlayer.id, '🔥 Shouted UNO!');
          }
        }

        if (decision.move.type === 'play_card' && decision.move.cardId) {
          const playedCard = currentS.players[currentS.currentPlayerIndex]?.hand.find(
            (c) => c.id === decision.move.cardId,
          );
          if (playedCard) {
            triggerFlight({
              card: playedCard,
              from: 'topOpponent',
              to: 'discardPile',
            });
            triggerOpponentActionMsg(
              currentPlayer.id,
              `🃏 Played ${playedCard.color.toUpperCase()} ${playedCard.value.toUpperCase()}`,
            );
          }
        } else if (decision.move.type === 'draw_card') {
          triggerOpponentActionMsg(currentPlayer.id, '🎴 Drew a card');
        } else if (decision.move.type === 'pass_turn') {
          triggerOpponentActionMsg(currentPlayer.id, '⏩ Passed turn');
        }

        let moveRes = unoEngine.applyMove(currentS, decision.move, currentPlayer.id);

        if (!moveRes.isSuccess) {
          if (currentS.isDrawPhase) {
            moveRes = unoEngine.applyMove(currentS, { type: 'pass_turn' }, currentPlayer.id);
          } else {
            moveRes = unoEngine.applyMove(currentS, { type: 'draw_card' }, currentPlayer.id);
          }
        }

        if (!moveRes.isSuccess) {
          const safeState = JSON.parse(JSON.stringify(currentS));
          safeState.isDrawPhase = false;
          safeState.drawnCardId = undefined;
          unoEngine.advanceTurn(safeState, 1);
          moveRes = { newState: safeState, isSuccess: true };
        }

        if (moveRes.isSuccess && moveRes.newState) {
          gameStateRef.current = moveRes.newState;
          setGameState(moveRes.newState);
          if (isSoundOn) soundService.play('card_flip');

          if (moveRes.newState.lastAction?.actionText) {
            triggerVfx(moveRes.newState.lastAction.actionText);
          }

          if (moveRes.newState.roundOver && moveRes.newState.winnerId) {
            if (isSoundOn) soundService.play('game_win');
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
      }, thinkingDelay);

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
    triggerFlight,
    triggerOpponentActionMsg,
    isSoundOn,
  ]);

  // Handle Player Card Tap
  const handleCardPress = (card: UnoCard) => {
    if (!isMyTurn || gameState.roundOver) return;

    if (UnoRules.isWildCard(card)) {
      setPendingWildCard(card);
      setShowColorPicker(true);
      return;
    }

    triggerFlight({
      card,
      from: 'playerHand',
      to: 'discardPile',
    });

    executeMove({ type: 'play_card', cardId: card.id }, myPlayer.id);
  };

  // Handle Color Selected for Wild Card
  const handleColorSelected = (color: UnoActiveColor) => {
    setShowColorPicker(false);
    if (pendingWildCard) {
      triggerFlight({
        card: pendingWildCard,
        from: 'playerHand',
        to: 'discardPile',
      });

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
    triggerFlight({
      isBack: true,
      from: 'deck',
      to: 'playerHand',
    });
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
    showToast('🔥 YOU SHOUTED UNO!');
  };

  // Handle Catch Opponent Uno
  const handleCatchUno = (targetPlayerId: string) => {
    executeMove({ type: 'catch_uno', targetPlayerId }, myPlayer.id);
    showToast('⚡ CAUGHT UNO PENALTY (+2)!');
  };

  const handleSendReaction = (emoji: string) => {
    triggerOpponentActionMsg(myPlayer.id, emoji);
    showToast(`Sent ${emoji}`);
  };

  const handleSendChat = (msg: string) => {
    triggerOpponentActionMsg(myPlayer.id, msg);
    showToast('Message sent');
  };

  const getPlayerBySeat = (seat: string): UnoPlayer | undefined => {
    if (seat === 'bottom') return myPlayer;
    const opponents = gameState.players.filter((p) => p.id !== myPlayer.id);

    if (opponents.length === 1) {
      if (seat === 'top') return opponents[0];
      return undefined;
    }

    if (opponents.length === 3) {
      if (seat === 'top') return opponents[0];
      if (seat === 'right') return opponents[1];
      if (seat === 'left') return opponents[2];
      return undefined;
    }

    const seatMap: Record<string, number> = {
      top: 0,
      topRight: 1,
      right: 2,
      bottomRight: 3,
      bottomLeft: 4,
      left: 5,
      topLeft: 6,
    };

    const index = seatMap[seat];
    return index !== undefined && index < opponents.length ? opponents[index] : undefined;
  };

  const rohanPlayer = getPlayerBySeat('top');
  const priyaPlayer = getPlayerBySeat('topRight');
  const arjunPlayer = getPlayerBySeat('right');
  const vikramPlayer = getPlayerBySeat('bottomRight');
  const simranPlayer = getPlayerBySeat('bottomLeft');
  const karanPlayer = getPlayerBySeat('left');
  const ananyaPlayer = getPlayerBySeat('topLeft');

  const formattedRoomCode = matchId.startsWith('UN') ? matchId : 'UN0856';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Cozy Dark Room Background */}
      <LinearGradient
        colors={['#0F151B', '#0B0F13', '#06080A']}
        style={StyleSheet.absoluteFill}
      />

      {/* ─── TOP APP BAR ────────────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top + 4, 20) }]}>
        {/* Left: Back Button & Room Code Pill */}
        <View style={styles.topLeftGroup}>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.glassCircleBtn}
            onPress={() => setIsPauseModalOpen(true)}
          >
            <Text style={styles.backChevronText}>‹</Text>
          </TouchableOpacity>

          {mode !== 'computer' && (
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.roomCodePill}
              onPress={() => showToast(`Room Code: ${formattedRoomCode} copied!`)}
            >
              <Text style={styles.roomCodeLabel}>ROOM CODE</Text>
              <View style={styles.roomCodeRow}>
                <Text style={styles.roomCodeValue}>{formattedRoomCode}</Text>
                <Text style={styles.copyIconGlyph}>⧉</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Center: 3D UNO Official Logo */}
        <View style={styles.unoLogoWrap}>
          <Text style={styles.unoLogo3DText}>UNO</Text>
        </View>

        {/* Right: Sound, Mic, Settings */}
        <View style={styles.topRightGroup}>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.glassCircleBtn}
            onPress={() => {
              setIsSoundOn((prev) => !prev);
              showToast(isSoundOn ? 'Sound Muted' : 'Sound Enabled');
            }}
          >
            <Text style={styles.topIconText}>{isSoundOn ? '🔊' : '🔇'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.glassCircleBtn}
            onPress={() => {
              setIsMicOn((prev) => !prev);
              showToast(isMicOn ? 'Mic Off' : 'Mic On');
            }}
          >
            <Text style={styles.topIconText}>{isMicOn ? '🎙️' : '🎤'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.glassCircleBtn}
            onPress={() => setIsPauseModalOpen(true)}
          >
            <Text style={styles.topIconText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dynamic Turn Announcement Banner */}
      <View style={styles.turnBannerWrap}>
        {isMyTurn ? (
          <View style={styles.myTurnBannerBadge}>
            <Text style={styles.myTurnBannerText}>
              ✨ YOUR TURN • PLAY OR DRAW ({timeLeft}s)
            </Text>
          </View>
        ) : (
          <View style={styles.botTurnBannerBadge}>
            <Text style={styles.botTurnBannerText}>
              🤖 {gameState.players[gameState.currentPlayerIndex]?.name?.toUpperCase() || 'OPPONENT'}'S TURN ({timeLeft}s)
            </Text>
          </View>
        )}
      </View>

      {/* Floating Toast Notification */}
      {toastMsg ? (
        <View style={styles.toastContainer} pointerEvents="none">
          <LinearGradient
            colors={['#2D3436', '#1E272E']}
            style={styles.toastGradient}
          >
            <Text style={styles.toastText}>{toastMsg}</Text>
          </LinearGradient>
        </View>
      ) : null}

      {/* Flying Card VFX Overlay */}
      <UnoCardFlightOverlay flights={cardFlights} onFlightFinished={removeFlight} />

      {/* Action Banner VFX Overlay */}
      <UnoActionVFXOverlay visible={showActionVfx} actionText={actionVfxText} />

      {/* ─── MAIN OVAL WOODEN TABLE ARENA ───────────────────────────── */}
      <View style={styles.tableCanvasContainer}>
        <LinearGradient
          colors={['#5A371F', '#3B2111', '#231208']}
          style={styles.woodenTableOuterOval}
        >
          <LinearGradient
            colors={['#3B2213', '#2B170C', '#1D0E07', '#150A04']}
            start={{ x: 0.5, y: 0.1 }}
            end={{ x: 0.5, y: 0.9 }}
            style={styles.woodenTableInnerSurface}
          >
            {/* Center Warm Ambient Spotlight */}
            <View style={styles.centralWarmSpotlight} />

            {/* ─── 1. TOP OPPONENT (Rohan) ─── */}
            <View style={styles.seatTopCenter}>
              {rohanPlayer && (
                <UnoOpponentHand
                  player={rohanPlayer}
                  isCurrentTurn={gameState.currentPlayerId === rohanPlayer.id}
                  position="top"
                  ringColor="#2ECC71"
                  timeLeft={timeLeft}
                  maxTime={initialTimeSeconds}
                  lastActionText={opponentActions[rohanPlayer.id]}
                  canCatchUno={UnoRules.canCatchUno(rohanPlayer)}
                  onCatchUno={handleCatchUno}
                />
              )}
            </View>

            {/* ─── 2. TOP-LEFT & TOP-RIGHT OPPONENTS (Ananya & Priya) ─── */}
            <View style={styles.topSideSeatsRow}>
              <View style={styles.seatTopLeft}>
                {ananyaPlayer && (
                  <UnoOpponentHand
                    player={ananyaPlayer}
                    isCurrentTurn={gameState.currentPlayerId === ananyaPlayer.id}
                    position="topLeft"
                    ringColor="#54A0FF"
                    timeLeft={timeLeft}
                    maxTime={initialTimeSeconds}
                    lastActionText={opponentActions[ananyaPlayer.id]}
                    canCatchUno={UnoRules.canCatchUno(ananyaPlayer)}
                    onCatchUno={handleCatchUno}
                  />
                )}
              </View>

              <View style={styles.seatTopRight}>
                {priyaPlayer && (
                  <UnoOpponentHand
                    player={priyaPlayer}
                    isCurrentTurn={gameState.currentPlayerId === priyaPlayer.id}
                    position="topRight"
                    ringColor="#E056FD"
                    timeLeft={timeLeft}
                    maxTime={initialTimeSeconds}
                    lastActionText={opponentActions[priyaPlayer.id]}
                    canCatchUno={UnoRules.canCatchUno(priyaPlayer)}
                    onCatchUno={handleCatchUno}
                  />
                )}
              </View>
            </View>

            {/* ─── 3. MID-LEFT, CENTER TABLE, MID-RIGHT (Karan, Orbit, Arjun) ─── */}
            <View style={styles.midSideSeatsRow}>
              <View style={styles.seatMidLeft}>
                {karanPlayer && (
                  <UnoOpponentHand
                    player={karanPlayer}
                    isCurrentTurn={gameState.currentPlayerId === karanPlayer.id}
                    position="left"
                    ringColor="#F1C40F"
                    timeLeft={timeLeft}
                    maxTime={initialTimeSeconds}
                    lastActionText={opponentActions[karanPlayer.id]}
                    canCatchUno={UnoRules.canCatchUno(karanPlayer)}
                    onCatchUno={handleCatchUno}
                  />
                )}
              </View>

              {/* CENTER TABLE */}
              <View style={styles.centerTableContainer}>
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
              </View>

              <View style={styles.seatMidRight}>
                {arjunPlayer && (
                  <UnoOpponentHand
                    player={arjunPlayer}
                    isCurrentTurn={gameState.currentPlayerId === arjunPlayer.id}
                    position="right"
                    ringColor="#00D2D3"
                    timeLeft={timeLeft}
                    maxTime={initialTimeSeconds}
                    lastActionText={opponentActions[arjunPlayer.id]}
                    canCatchUno={UnoRules.canCatchUno(arjunPlayer)}
                    onCatchUno={handleCatchUno}
                  />
                )}
              </View>
            </View>

            {/* ─── 4. BOTTOM-LEFT & BOTTOM-RIGHT OPPONENTS (Simran & Vikram) ─── */}
            <View style={styles.bottomSideSeatsRow}>
              <View style={styles.seatBottomLeft}>
                {simranPlayer && (
                  <UnoOpponentHand
                    player={simranPlayer}
                    isCurrentTurn={gameState.currentPlayerId === simranPlayer.id}
                    position="bottomLeft"
                    ringColor="#A55EEA"
                    timeLeft={timeLeft}
                    maxTime={initialTimeSeconds}
                    lastActionText={opponentActions[simranPlayer.id]}
                    canCatchUno={UnoRules.canCatchUno(simranPlayer)}
                    onCatchUno={handleCatchUno}
                  />
                )}
              </View>

              <View style={styles.seatBottomRight}>
                {vikramPlayer && (
                  <UnoOpponentHand
                    player={vikramPlayer}
                    isCurrentTurn={gameState.currentPlayerId === vikramPlayer.id}
                    position="bottomRight"
                    ringColor="#FF6B6B"
                    timeLeft={timeLeft}
                    maxTime={initialTimeSeconds}
                    lastActionText={opponentActions[vikramPlayer.id]}
                    canCatchUno={UnoRules.canCatchUno(vikramPlayer)}
                    onCatchUno={handleCatchUno}
                  />
                )}
              </View>
            </View>

            {/* ─── 5. PLAYER'S OWN SEAT ("You") AT BOTTOM CENTER ─── */}
            <View style={styles.seatBottomCenter}>
              <UnoOpponentHand
                player={myPlayer}
                isCurrentTurn={isMyTurn}
                position="bottom"
                ringColor="#2ECC71"
                isMe
                timeLeft={timeLeft}
                maxTime={initialTimeSeconds}
                lastActionText={opponentActions[myPlayer.id]}
              />
            </View>
          </LinearGradient>
        </LinearGradient>
      </View>

      {/* ─── PLAYER'S CURVED HAND VIEW (BOTTOM) ─────────────────────── */}
      <View style={styles.playerHandSection}>
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

      {/* ─── BOTTOM ACTION BAR (Emoji, Giant UNO! Button, Chat) ──────── */}
      <View style={[styles.bottomBarContainer, { paddingBottom: Math.max(insets.bottom, 6) }]}>
        <UnoPlayerBar
          hasCalledUno={myPlayer.hasCalledUno}
          canShoutUno={UnoRules.canShoutUno(myPlayer)}
          onShoutUno={handleShoutUno}
          onSendReaction={handleSendReaction}
          onSendChat={handleSendChat}
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
                <Text style={styles.pauseBtnText}>RESUME MATCH</Text>
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
    backgroundColor: '#070A0D',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 2,
    zIndex: 30,
  },
  topLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  glassCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  backChevronText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -3,
  },
  topIconText: {
    fontSize: 14,
  },
  roomCodePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  roomCodeLabel: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#A4B0BE',
    letterSpacing: 0.4,
  },
  roomCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  roomCodeValue: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  copyIconGlyph: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  unoLogoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  unoLogo3DText: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#E62429',
    letterSpacing: 1,
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 1.5, height: 1.5 },
    textShadowRadius: 1,
  },
  toastContainer: {
    position: 'absolute',
    top: 75,
    alignSelf: 'center',
    zIndex: 100,
  },
  turnBannerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    zIndex: 20,
  },
  myTurnBannerBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2ECC71',
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  myTurnBannerText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#2ECC71',
    letterSpacing: 0.5,
  },
  botTurnBannerBadge: {
    backgroundColor: 'rgba(241, 196, 15, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F1C40F',
    shadowColor: '#F1C40F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  botTurnBannerText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#F1C40F',
    letterSpacing: 0.5,
  },
  toastGradient: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2ECC71',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  tableCanvasContainer: {
    flex: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 0,
  },
  woodenTableOuterOval: {
    width: '100%',
    flex: 1,
    maxHeight: 460,
    borderRadius: 36,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#734626',
  },
  woodenTableInnerSurface: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 6,
    position: 'relative',
  },
  centralWarmSpotlight: {
    position: 'absolute',
    top: '20%',
    left: '15%',
    right: '15%',
    bottom: '20%',
    borderRadius: 24,
    backgroundColor: 'rgba(255, 177, 66, 0.05)',
    pointerEvents: 'none',
  },
  seatTopCenter: {
    zIndex: 15,
    marginTop: 2,
    alignItems: 'center',
  },
  topSideSeatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
    marginTop: -8,
    zIndex: 14,
  },
  seatTopLeft: {
    alignItems: 'center',
    minWidth: 50,
  },
  seatTopRight: {
    alignItems: 'center',
    minWidth: 50,
  },
  midSideSeatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    zIndex: 13,
  },
  seatMidLeft: {
    alignItems: 'center',
    minWidth: 50,
  },
  seatMidRight: {
    alignItems: 'center',
    minWidth: 50,
  },
  centerTableContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSideSeatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
    marginBottom: -6,
    zIndex: 12,
  },
  seatBottomLeft: {
    alignItems: 'center',
    minWidth: 50,
  },
  seatBottomRight: {
    alignItems: 'center',
    minWidth: 50,
  },
  seatBottomCenter: {
    zIndex: 16,
    marginBottom: 2,
    alignItems: 'center',
  },
  playerHandSection: {
    width: '100%',
    zIndex: 20,
    marginTop: -6,
  },
  bottomBarContainer: {
    width: '100%',
    zIndex: 25,
  },
  pauseOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pauseModalCard: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#1E272E',
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
    color: '#A4B0BE',
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
    color: '#FF4757',
  },
});

export default UnoGameScreen;
