import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../theme';
import { ROUTES } from '../../../../navigation/routes';
import { ChessGameState } from '../../../../gameEngine/chess/chessTypes';
import { CHESS_PIECE_IMAGES } from '../../../../gameEngine/chess/chessConstants';
import { soundService } from '../../../../services/sound/soundService';

const { width, height } = Dimensions.get('window');

// ─── Celebration Confetti & Firework Burst Specs ─────────────────────────────
const CONFETTI_COUNT = 30;
const CONFETTI_SHAPES = ['ribbon', 'rect', 'star', 'circle', 'diamond', 'gem'];
const CONFETTI_COLORS = [
  '#F0C64A',
  '#5CF27A',
  '#4A90E2',
  '#FF5E7E',
  '#9B51E0',
  '#FFD700',
  '#00F5D4',
  '#FFFFFF',
  '#FFAA00',
];

interface ConfettiPiece {
  id: number;
  shape: string;
  color: string;
  startX: number;
  startY: number;
  endY: number;
  driftX: number;
  scale: number;
  duration: number;
  delay: number;
}

interface TouchSpark {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
  color: string;
  size: number;
}

export const ChessResultScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark } = useTheme();

  const gameState: ChessGameState = route.params?.gameState || {};
  const mode = route.params?.mode || 'computer';
  const difficulty = route.params?.difficulty || 'medium';
  const myColor: 'white' | 'black' = route.params?.myColor || 'white';
  const player1Name = route.params?.player1Name || 'Player 1';
  const player2Name = route.params?.player2Name || 'Player 2';

  const isDraw =
    gameState.winner === 'draw' ||
    gameState.gameStatus === 'stalemate' ||
    gameState.gameStatus?.startsWith('draw');

  // Player 1 & 2 Colors & Outcomes
  const p1Color: 'white' | 'black' = mode === 'local' ? 'white' : myColor;
  const p2Color: 'white' | 'black' = p1Color === 'white' ? 'black' : 'white';

  const p1Won = !isDraw && gameState.winner === p1Color;
  const p2Won = !isDraw && gameState.winner === p2Color;

  const isPlayerWin = mode === 'local' ? !isDraw : p1Won;
  const localWinnerName = isDraw ? null : gameState.winner === 'white' ? player1Name : player2Name;

  // ─── Animation References ───────────────────────────────────────────────────
  const bannerScale = useRef(new Animated.Value(0.78)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  // Dual Sunburst Rotations (Clockwise & Counter-Clockwise)
  const sunburstClockwise = useRef(new Animated.Value(0)).current;
  const sunburstCounter = useRef(new Animated.Value(0)).current;

  // Dual Shockwave Impact Ripples
  const shockwave1 = useRef(new Animated.Value(0)).current;
  const shockwave2 = useRef(new Animated.Value(0)).current;

  // Hero Crown / Trophy Animations
  const trophyScale = useRef(new Animated.Value(0.05)).current;
  const trophyRotate = useRef(new Animated.Value(0)).current;
  const trophyFloat = useRef(new Animated.Value(0)).current;
  const trophyGlowPulse = useRef(new Animated.Value(0)).current;
  const crownGleamAnim = useRef(new Animated.Value(0)).current;

  // Floating Royal Chess Pieces (Left & Right)
  const pieceFloatLeft = useRef(new Animated.Value(0)).current;
  const pieceFloatRight = useRef(new Animated.Value(0)).current;

  // Orbiting Sparkles
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;
  const sparkle4 = useRef(new Animated.Value(0)).current;

  // Winner Neon Border Pulse
  const winnerBorderPulse = useRef(new Animated.Value(0)).current;

  // Staggered Section Entrances
  const headToHeadAnim = useRef(new Animated.Value(0)).current;
  const rewardsCardAnim = useRef(new Animated.Value(0)).current;
  const xpProgressBarAnim = useRef(new Animated.Value(0)).current;
  const statsCardAnim = useRef(new Animated.Value(0)).current;
  const actionButtonsAnim = useRef(new Animated.Value(0)).current;

  // Rematch CTA Glare Shimmer & Breathing Pulse
  const rematchBtnPulse = useRef(new Animated.Value(1)).current;
  const rematchShimmerAnim = useRef(new Animated.Value(0)).current;
  const rematchPressScale = useRef(new Animated.Value(1)).current;

  // Numbers ticker / count-up state
  const targetElo = isPlayerWin ? 18 : isDraw ? 2 : -12;
  const targetCoins = isPlayerWin ? (mode === 'computer' ? 120 : 250) : isDraw ? 50 : 15;
  const targetXp = isPlayerWin ? (mode === 'computer' ? 80 : 120) : isDraw ? 40 : 20;

  const [displayedElo, setDisplayedElo] = useState(0);
  const [displayedCoins, setDisplayedCoins] = useState(0);
  const [displayedXp, setDisplayedXp] = useState(0);

  // Interactive touch spark bursts state
  const [touchSparks, setTouchSparks] = useState<TouchSpark[]>([]);
  const sparkAnim = useRef(new Animated.Value(0)).current;

  // Confetti particles
  const confettiAnims = useRef(
    Array.from({ length: CONFETTI_COUNT }, () => new Animated.Value(0)),
  ).current;

  const confettiPieces = useRef<ConfettiPiece[]>(
    Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      shape: CONFETTI_SHAPES[i % CONFETTI_SHAPES.length],
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      startX: (Math.random() - 0.5) * (width - 16),
      startY: 10 + Math.random() * 60,
      endY: 200 + Math.random() * 320,
      driftX: (Math.random() - 0.5) * 90,
      scale: 0.55 + Math.random() * 0.65,
      duration: 2000 + Math.random() * 1500,
      delay: i * 65,
    })),
  ).current;

  useEffect(() => {
    // 1. Play Audio
    try {
      if (mode === 'local') {
        soundService.play('game_win');
      } else if (isPlayerWin) {
        soundService.play('game_win');
      } else if (!isDraw) {
        soundService.play('game_lose');
      }
    } catch {
      // safe fallback
    }

    // 2. Dual Sunburst Rotations
    const clockwiseLoop = Animated.loop(
      Animated.timing(sunburstClockwise, {
        toValue: 1,
        duration: 16000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    clockwiseLoop.start();

    const counterLoop = Animated.loop(
      Animated.timing(sunburstCounter, {
        toValue: 1,
        duration: 22000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    counterLoop.start();

    // 3. Banner Entrance with Spring
    Animated.parallel([
      Animated.timing(bannerOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(bannerScale, {
        toValue: 1,
        tension: 75,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // 4. Dual Shockwave Rings
    Animated.sequence([
      Animated.delay(180),
      Animated.parallel([
        Animated.timing(shockwave1, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(260),
          Animated.timing(shockwave2, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // 5. Crown / Trophy Pop, Wiggle & Gleam
    Animated.sequence([
      Animated.spring(trophyScale, {
        toValue: 1,
        tension: 90,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(trophyRotate, {
        toValue: 1,
        duration: 350,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // Crown Glare Gleam Sweep
    const gleamLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(1800),
        Animated.timing(crownGleamAnim, {
          toValue: 1,
          duration: 950,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(crownGleamAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    gleamLoop.start();

    // 6. Trophy & Royal Pieces Floating Levitation
    const trophyFloatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(trophyFloat, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(trophyFloat, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    trophyFloatLoop.start();

    const leftPieceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pieceFloatLeft, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pieceFloatLeft, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    leftPieceLoop.start();

    const rightPieceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pieceFloatRight, {
          toValue: 1,
          duration: 1750,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pieceFloatRight, {
          toValue: 0,
          duration: 1750,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    rightPieceLoop.start();

    // 7. Radiant Glow & Winner Border Pulses
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(trophyGlowPulse, {
          toValue: 1,
          duration: 1150,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(trophyGlowPulse, {
          toValue: 0,
          duration: 1150,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    glowLoop.start();

    const winnerBorderLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(winnerBorderPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(winnerBorderPulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    winnerBorderLoop.start();

    // 8. Orbiting Sparkles
    const sparkleLoop = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 650,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 650,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );

    sparkleLoop(sparkle1, 50).start();
    sparkleLoop(sparkle2, 380).start();
    sparkleLoop(sparkle3, 720).start();
    sparkleLoop(sparkle4, 1050).start();

    // 9. Staggered Sections Entrance
    Animated.stagger(120, [
      Animated.spring(headToHeadAnim, {
        toValue: 1,
        tension: 65,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(rewardsCardAnim, {
        toValue: 1,
        tension: 65,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(xpProgressBarAnim, {
        toValue: 1,
        duration: 950,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.spring(statsCardAnim, {
        toValue: 1,
        tension: 65,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(actionButtonsAnim, {
        toValue: 1,
        tension: 65,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // 10. Rematch CTA Button Glare Shimmer & Pulse
    const rematchPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(rematchBtnPulse, {
          toValue: 1.035,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rematchBtnPulse, {
          toValue: 1.0,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    rematchPulse.start();

    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(1300),
        Animated.timing(rematchShimmerAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rematchShimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    shimmerLoop.start();

    // 11. Confetti Fall Loop
    if (isPlayerWin || isDraw || mode === 'local') {
      confettiAnims.forEach((anim, i) => {
        const item = confettiPieces[i];
        Animated.loop(
          Animated.sequence([
            Animated.delay(item.delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: item.duration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      });
    }

    // 12. Dynamic Number Ticker
    let step = 0;
    const totalSteps = 28;
    const tickerInterval = setInterval(() => {
      step += 1;
      const progress = step / totalSteps;
      setDisplayedElo(Math.round(targetElo * progress));
      setDisplayedCoins(Math.round(targetCoins * progress));
      setDisplayedXp(Math.round(targetXp * progress));

      if (step >= totalSteps) {
        clearInterval(tickerInterval);
      }
    }, 30);

    return () => {
      clockwiseLoop.stop();
      counterLoop.stop();
      trophyFloatLoop.stop();
      leftPieceLoop.stop();
      rightPieceLoop.stop();
      glowLoop.stop();
      gleamLoop.stop();
      winnerBorderLoop.stop();
      rematchPulse.stop();
      shimmerLoop.stop();
      clearInterval(tickerInterval);
    };
  }, []);

  // ─── Interactive Touch Spark Bursts Handler ──────────────────────────────────
  const handleBannerPress = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const newSparks: TouchSpark[] = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: locationX,
      y: locationY,
      angle: (i * 30 * Math.PI) / 180,
      distance: 35 + Math.random() * 55,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 5 + Math.random() * 5,
    }));

    setTouchSparks(newSparks);
    sparkAnim.setValue(0);
    Animated.timing(sparkAnim, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setTouchSparks([]);
    });
  };

  // ─── Outcome Banner Configuration by Mode ────────────────────────────────────
  let bannerOutcomeTitle = '';
  let bannerOutcomeSub = '';
  let bannerBadgeText = '';
  let trophyEmoji = '👑';
  let bannerGradient: string[] = ['#187842', '#0D4F2C', '#081C13'];

  if (mode === 'local') {
    if (isDraw) {
      bannerOutcomeTitle = 'HONORABLE DRAW 🤝';
      bannerOutcomeSub = gameState.winReason || 'Both players fought to a balanced standstill!';
      bannerBadgeText = '✦ 2-PLAYER LOCAL DRAW ✦';
      trophyEmoji = '🤝';
      bannerGradient = ['#2057B8', '#133575', '#08101C'];
    } else {
      bannerOutcomeTitle = `${(localWinnerName || 'PLAYER').toUpperCase()} WINS! 👑`;
      bannerOutcomeSub = gameState.winReason || `${localWinnerName} clinched the victory on the board!`;
      bannerBadgeText = '✦ PASS & PLAY CHAMPION ✦';
      trophyEmoji = '🏆';
      bannerGradient = ['#187842', '#0D4F2C', '#081C13'];
    }
  } else if (mode === 'computer') {
    if (isDraw) {
      bannerOutcomeTitle = 'DRAW MATCH 🤝';
      bannerOutcomeSub = gameState.winReason || 'Match against AI ended in a draw.';
      bannerBadgeText = '✦ STALEMATE WITH BOT ✦';
      trophyEmoji = '🤝';
      bannerGradient = ['#2057B8', '#133575', '#08101C'];
    } else if (isPlayerWin) {
      bannerOutcomeTitle = 'VICTORY! 👑';
      bannerOutcomeSub = gameState.winReason || `You defeated the ${difficulty.toUpperCase()} AI Bot!`;
      bannerBadgeText = '✦ BOT CHALLENGE CLEARED ✦';
      trophyEmoji = '👑';
      bannerGradient = ['#187842', '#0D4F2C', '#081C13'];
    } else {
      bannerOutcomeTitle = 'DEFEAT 🤖';
      bannerOutcomeSub = gameState.winReason || `AI Bot (${difficulty.toUpperCase()}) claimed the victory.`;
      bannerBadgeText = '✦ AI BOT WON ✦';
      trophyEmoji = '🤖';
      bannerGradient = ['#9E1F14', '#56140D', '#140605'];
    }
  } else {
    // Online multiplayer (random / private)
    if (isDraw) {
      bannerOutcomeTitle = 'DRAW MATCH 🤝';
      bannerOutcomeSub = gameState.winReason || 'Ranked 1v1 match ended in a draw.';
      bannerBadgeText = '✦ HONORABLE DRAW ✦';
      trophyEmoji = '🤝';
      bannerGradient = ['#2057B8', '#133575', '#08101C'];
    } else if (isPlayerWin) {
      bannerOutcomeTitle = 'VICTORY! 👑';
      bannerOutcomeSub = gameState.winReason || 'Outstanding play! 1v1 victory.';
      bannerBadgeText = '✦ RANKED MATCH VICTOR ✦';
      trophyEmoji = '👑';
      bannerGradient = ['#187842', '#0D4F2C', '#081C13'];
    } else {
      bannerOutcomeTitle = 'DEFEAT ⚔️';
      bannerOutcomeSub = gameState.winReason || 'Good match! Better luck next time.';
      bannerBadgeText = '✦ MATCH DEFEAT ✦';
      trophyEmoji = '⚔️';
      bannerGradient = ['#9E1F14', '#56140D', '#140605'];
    }
  }

  const trophyInterpolateY = trophyFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -11],
  });

  const trophyInterpolateRotate = trophyRotate.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '8deg', '0deg'],
  });

  const sunburstSpinClockwise = sunburstClockwise.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sunburstSpinCounter = sunburstCounter.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const glowScale = trophyGlowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.5],
  });

  const glowOpacity = trophyGlowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0.12],
  });

  const shockwaveScale1 = shockwave1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 2.6],
  });

  const shockwaveOpacity1 = shockwave1.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.75, 0],
  });

  const shockwaveScale2 = shockwave2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 2.8],
  });

  const shockwaveOpacity2 = shockwave2.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.6, 0],
  });

  const crownGleamTranslateX = crownGleamAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const shimmerTranslateX = rematchShimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width * 1.3],
  });

  const handlePressInRematch = () => {
    Animated.spring(rematchPressScale, {
      toValue: 0.94,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOutRematch = () => {
    Animated.spring(rematchPressScale, {
      toValue: 1.0,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleRematch = () => {
    if (mode === 'random' || mode === 'private') {
      navigation.navigate(ROUTES.CHESS_MODE);
      return;
    }
    navigation.replace(ROUTES.CHESS_GAME, {
      matchId: `rematch_${Date.now()}`,
      mode,
      difficulty,
      player1Name,
      player2Name,
      myColor,
      timeSeconds: route.params?.timeSeconds,
    });
  };

  const handleGoHome = () => {
    navigation.navigate(ROUTES.GAME_HUB);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#07100B' : '#F2F7F4' }]}>
      <StatusBar barStyle="light-content" />

      {/* ─── Hero Banner with Multi-Layer Sunburst, Floating Pieces & Crown ──── */}
      <TouchableWithoutFeedback onPress={handleBannerPress}>
        <Animated.View
          style={[
            styles.headerBannerWrap,
            {
              opacity: bannerOpacity,
              transform: [{ scale: bannerScale }],
            },
          ]}
        >
          <LinearGradient
            colors={bannerGradient}
            style={[styles.headerBanner, { paddingTop: Math.max(insets.top + 16, 44) }]}
          >
            {/* Outer Golden Sunburst Rays */}
            <Animated.View
              style={[
                styles.sunburstContainer,
                { transform: [{ rotate: sunburstSpinClockwise }] },
              ]}
              pointerEvents="none"
            >
              {Array.from({ length: 14 }).map((_, i) => (
                <View
                  key={`ray_outer_${i}`}
                  style={[
                    styles.sunburstRay,
                    {
                      transform: [{ rotate: `${i * (360 / 14)}deg` }],
                      backgroundColor: isPlayerWin || mode === 'local'
                        ? 'rgba(240, 198, 74, 0.09)'
                        : isDraw
                        ? 'rgba(74, 144, 226, 0.09)'
                        : 'rgba(230, 72, 58, 0.09)',
                    },
                  ]}
                />
              ))}
            </Animated.View>

            {/* Inner Emerald/Cyan Starburst Rays */}
            <Animated.View
              style={[
                styles.sunburstInnerContainer,
                { transform: [{ rotate: sunburstSpinCounter }] },
              ]}
              pointerEvents="none"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <View
                  key={`ray_inner_${i}`}
                  style={[
                    styles.sunburstInnerRay,
                    {
                      transform: [{ rotate: `${i * 45}deg` }],
                      backgroundColor: isPlayerWin || mode === 'local'
                        ? 'rgba(92, 242, 122, 0.08)'
                        : 'rgba(255, 255, 255, 0.07)',
                    },
                  ]}
                />
              ))}
            </Animated.View>

            {/* Shockwave Ripples */}
            <Animated.View
              style={[
                styles.shockwaveRing,
                {
                  borderColor: isPlayerWin || mode === 'local' ? '#F0C64A' : '#4A90E2',
                  opacity: shockwaveOpacity1,
                  transform: [{ scale: shockwaveScale1 }],
                },
              ]}
              pointerEvents="none"
            />
            <Animated.View
              style={[
                styles.shockwaveRing,
                {
                  borderColor: isPlayerWin || mode === 'local' ? '#5CF27A' : '#7AB8FF',
                  opacity: shockwaveOpacity2,
                  transform: [{ scale: shockwaveScale2 }],
                },
              ]}
              pointerEvents="none"
            />

            {/* Falling 3D Fluttering Confetti */}
            {(isPlayerWin || isDraw || mode === 'local') && (
              <View style={styles.particlesContainer} pointerEvents="none">
                {confettiPieces.map((p, idx) => {
                  const anim = confettiAnims[idx];
                  const translateY = anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [p.startY, p.endY],
                  });
                  const translateX = anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [p.startX, p.startX + p.driftX, p.startX - p.driftX * 0.6],
                  });
                  const opacity = anim.interpolate({
                    inputRange: [0, 0.1, 0.82, 1],
                    outputRange: [0, 1, 0.9, 0],
                  });
                  const rotateZ = anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${(idx % 2 === 0 ? 1 : -1) * 540}deg`],
                  });
                  const rotateX = anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${(idx % 3 === 0 ? 1 : -1) * 360}deg`],
                  });

                  return (
                    <Animated.View
                      key={`conf_${p.id}`}
                      style={[
                        styles.confettiPiece,
                        {
                          transform: [
                            { translateX },
                            { translateY },
                            { rotateZ },
                            { rotateX },
                            { scale: p.scale },
                          ],
                          opacity,
                        },
                      ]}
                    >
                      {p.shape === 'ribbon' ? (
                        <View style={[styles.ribbonShape, { backgroundColor: p.color }]} />
                      ) : p.shape === 'rect' ? (
                        <View style={[styles.rectShape, { backgroundColor: p.color }]} />
                      ) : p.shape === 'circle' ? (
                        <View style={[styles.circleShape, { backgroundColor: p.color }]} />
                      ) : p.shape === 'diamond' ? (
                        <View style={[styles.diamondShape, { backgroundColor: p.color }]} />
                      ) : p.shape === 'gem' ? (
                        <Text style={{ fontSize: 13, color: p.color }}>💎</Text>
                      ) : (
                        <Text style={{ fontSize: 13, color: p.color }}>⭐</Text>
                      )}
                    </Animated.View>
                  );
                })}
              </View>
            )}

            {/* Touch Sparks Fireworks Particles */}
            {touchSparks.map((spark) => {
              const sparkX = sparkAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [spark.x, spark.x + Math.cos(spark.angle) * spark.distance],
              });
              const sparkY = sparkAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [spark.y, spark.y + Math.sin(spark.angle) * spark.distance],
              });
              const sparkOpacity = sparkAnim.interpolate({
                inputRange: [0, 0.2, 1],
                outputRange: [1, 1, 0],
              });
              const sparkScale = sparkAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1.2, 1.0, 0.2],
              });

              return (
                <Animated.View
                  key={`spark_${spark.id}`}
                  style={[
                    styles.touchSparkItem,
                    {
                      width: spark.size,
                      height: spark.size,
                      borderRadius: spark.size / 2,
                      backgroundColor: spark.color,
                      transform: [{ translateX: sparkX }, { translateY: sparkY }, { scale: sparkScale }],
                      opacity: sparkOpacity,
                    },
                  ]}
                  pointerEvents="none"
                />
              );
            })}

            {/* Radiant Background Glow Halo */}
            <Animated.View
              style={[
                styles.trophyGlowRing,
                {
                  backgroundColor: isPlayerWin || mode === 'local' ? '#F0C64A' : isDraw ? '#4A90E2' : '#E6483A',
                  opacity: glowOpacity,
                  transform: [{ scale: glowScale }],
                },
              ]}
            />

            {/* Floating Royal Piece (Left) */}
            <Animated.View
              style={[
                styles.floatingPieceLeft,
                {
                  transform: [
                    {
                      translateY: pieceFloatLeft.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -8],
                      }),
                    },
                    { rotate: '-12deg' },
                  ],
                },
              ]}
              pointerEvents="none"
            >
              <Image
                source={CHESS_PIECE_IMAGES[p1Color].king}
                style={styles.floatingPieceImage}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Floating Royal Piece (Right) */}
            <Animated.View
              style={[
                styles.floatingPieceRight,
                {
                  transform: [
                    {
                      translateY: pieceFloatRight.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -9],
                      }),
                    },
                    { rotate: '14deg' },
                  ],
                },
              ]}
              pointerEvents="none"
            >
              <Image
                source={CHESS_PIECE_IMAGES[p2Color].king}
                style={styles.floatingPieceImage}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Floating Hero Trophy with Orbiting Sparkles */}
            <View style={styles.trophyHeroArea}>
              <Animated.Text
                style={[
                  styles.miniSparkle,
                  {
                    top: -14,
                    left: -18,
                    opacity: sparkle1,
                    transform: [
                      {
                        scale: sparkle1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.4, 1.4],
                        }),
                      },
                    ],
                  },
                ]}
              >
                ✨
              </Animated.Text>

              <Animated.Text
                style={[
                  styles.miniSparkle,
                  {
                    top: -10,
                    right: -20,
                    opacity: sparkle2,
                    transform: [
                      {
                        scale: sparkle2.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.4, 1.5],
                        }),
                      },
                    ],
                  },
                ]}
              >
                ⭐
              </Animated.Text>

              <Animated.Text
                style={[
                  styles.miniSparkle,
                  {
                    bottom: -2,
                    left: 32,
                    opacity: sparkle3,
                    transform: [
                      {
                        scale: sparkle3.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.4, 1.3],
                        }),
                      },
                    ],
                  },
                ]}
              >
                💎
              </Animated.Text>

              <Animated.Text
                style={[
                  styles.miniSparkle,
                  {
                    bottom: 12,
                    right: -14,
                    opacity: sparkle4,
                    transform: [
                      {
                        scale: sparkle4.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.4, 1.2],
                        }),
                      },
                    ],
                  },
                ]}
              >
                ✦
              </Animated.Text>

              <Animated.View
                style={[
                  styles.trophyWrap,
                  {
                    transform: [
                      { scale: trophyScale },
                      { translateY: trophyInterpolateY },
                      { rotate: trophyInterpolateRotate },
                    ],
                  },
                ]}
              >
                {/* Crown Glare Sweep */}
                <Animated.View
                  style={[
                    styles.crownGleamBar,
                    {
                      transform: [{ translateX: crownGleamTranslateX }, { rotate: '30deg' }],
                    },
                  ]}
                  pointerEvents="none"
                />

                <Text style={styles.trophyIcon}>{trophyEmoji}</Text>
              </Animated.View>
            </View>

            {/* Outcome Category Pill */}
            <View style={styles.outcomeBadge}>
              <Text style={styles.outcomeBadgeText}>{bannerBadgeText}</Text>
            </View>

            <Text style={styles.outcomeTitle}>{bannerOutcomeTitle}</Text>
            <Text style={styles.outcomeSub}>{bannerOutcomeSub}</Text>
          </LinearGradient>
        </Animated.View>
      </TouchableWithoutFeedback>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Head to Head 1v1 Arena Spotlight Card ─────────────────────────── */}
        <Animated.View
          style={[
            styles.headToHeadCard,
            {
              backgroundColor: isDark ? '#141E18' : '#FFFFFF',
              borderColor: isDark ? 'rgba(212,160,23,0.38)' : '#D0E5D8',
              opacity: headToHeadAnim,
              transform: [
                {
                  translateY: headToHeadAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [26, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Player 1 Slot */}
          <View style={styles.playerSlot}>
            <View style={styles.avatarWrap}>
              <LinearGradient
                colors={p1Won ? ['#F5D15D', '#D4A017', '#9E740C'] : ['#223D2F', '#14261D']}
                style={[
                  styles.slotAvatar,
                  p1Won && styles.winnerAvatarGlow,
                ]}
              >
                <Image
                  source={CHESS_PIECE_IMAGES[p1Color].king}
                  style={styles.avatarPieceIcon}
                  resizeMode="contain"
                />
              </LinearGradient>
              {p1Won && (
                <View style={styles.crownTag}>
                  <Text style={{ fontSize: 13 }}>👑</Text>
                </View>
              )}
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.slotPlayerName,
                { color: isDark ? '#FFF' : '#1A2318' },
              ]}
            >
              {player1Name}
            </Text>
            <Text
              style={[
                styles.slotPlayerSub,
                { color: isDark ? '#8EA397' : '#5C7A6A' },
              ]}
            >
              {mode === 'local'
                ? 'PLAYER 1 (WHITE ♔)'
                : `YOU (${p1Color.toUpperCase()} ${p1Color === 'white' ? '♔' : '♚'})`}
            </Text>
            <View
              style={[
                styles.slotResultPill,
                {
                  backgroundColor: p1Won
                    ? '#1F9D55'
                    : isDraw
                    ? '#2668D9'
                    : mode === 'local'
                    ? '#6B7280'
                    : '#E6483A',
                },
              ]}
            >
              <Text
                style={[
                  styles.slotResultText,
                  { color: '#FFF' },
                ]}
              >
                {p1Won ? 'VICTOR 🏆' : isDraw ? 'DRAW 🤝' : mode === 'local' ? 'RUNNER-UP' : 'DEFEAT ⚔️'}
              </Text>
            </View>
          </View>

          {/* Center VS Swords Badge */}
          <View style={styles.vsDividerCol}>
            <View style={[styles.vsBadgeCircle, { backgroundColor: isDark ? '#1C2820' : '#EDF6F1' }]}>
              <Text style={styles.vsEmoji}>⚔️</Text>
            </View>
            <Text style={[styles.vsText, { color: isDark ? '#D4A017' : '#9E740C' }]}>
              VS
            </Text>
          </View>

          {/* Player 2 Slot */}
          <View style={styles.playerSlot}>
            <View style={styles.avatarWrap}>
              <LinearGradient
                colors={p2Won ? ['#F5D15D', '#D4A017', '#9E740C'] : ['#1C3048', '#101D2D']}
                style={[
                  styles.slotAvatar,
                  p2Won && styles.winnerAvatarGlow,
                ]}
              >
                <Image
                  source={CHESS_PIECE_IMAGES[p2Color].king}
                  style={styles.avatarPieceIcon}
                  resizeMode="contain"
                />
              </LinearGradient>
              {p2Won && (
                <View style={styles.crownTag}>
                  <Text style={{ fontSize: 13 }}>👑</Text>
                </View>
              )}
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.slotPlayerName,
                { color: isDark ? '#FFF' : '#1A2318' },
              ]}
            >
              {mode === 'computer' ? `AI Bot (${difficulty.toUpperCase()})` : player2Name}
            </Text>
            <Text
              style={[
                styles.slotPlayerSub,
                { color: isDark ? '#8EA397' : '#5C7A6A' },
              ]}
            >
              {mode === 'computer'
                ? `ROBOT 🤖 (${p2Color.toUpperCase()} ${p2Color === 'white' ? '♔' : '♚'})`
                : mode === 'local'
                ? 'PLAYER 2 (BLACK ♚)'
                : `OPPONENT (${p2Color.toUpperCase()} ${p2Color === 'white' ? '♔' : '♚'})`}
            </Text>
            <View
              style={[
                styles.slotResultPill,
                {
                  backgroundColor: p2Won
                    ? '#1F9D55'
                    : isDraw
                    ? '#2668D9'
                    : mode === 'local'
                    ? '#6B7280'
                    : '#E6483A',
                },
              ]}
            >
              <Text
                style={[
                  styles.slotResultText,
                  { color: '#FFF' },
                ]}
              >
                {p2Won ? 'VICTOR 🏆' : isDraw ? 'DRAW 🤝' : mode === 'local' ? 'RUNNER-UP' : 'DEFEAT ⚔️'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ─── Match Rewards & Stats Card by Mode ─────────────────────────────── */}
        <Animated.View
          style={{
            opacity: rewardsCardAnim,
            transform: [
              {
                translateY: rewardsCardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          }}
        >
          <LinearGradient
            colors={isDark ? ['#202A22', '#121A14'] : ['#FFFFFF', '#EDF5F0']}
            style={[
              styles.rewardCard,
              { borderColor: isDark ? 'rgba(212,160,23,0.32)' : '#D0E5D8' },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.headerSparkle}>✨</Text>
              <Text style={[styles.cardHeader, { color: isDark ? '#F0C64A' : '#A6740C' }]}>
                {mode === 'local'
                  ? '👥 2-PLAYER PASS & PLAY STATS'
                  : mode === 'computer'
                  ? '🤖 AI BATTLE REWARDS & XP'
                  : 'MATCH REWARDS & RATING PROGRESS'}
              </Text>
              <Text style={styles.headerSparkle}>✨</Text>
            </View>

            {/* 3 Metric Tiles configured per mode */}
            <View style={styles.rewardsRow}>
              {/* Box 1 */}
              <View style={styles.rewardItem}>
                <LinearGradient colors={['#2A3C30', '#15241C']} style={styles.rewardIconWrap}>
                  <Text style={styles.rewardIcon}>
                    {mode === 'local' ? '👑' : mode === 'computer' ? '🎯' : '🏆'}
                  </Text>
                </LinearGradient>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.rewardVal,
                    {
                      color:
                        mode === 'local'
                          ? '#5CF27A'
                          : mode === 'computer'
                          ? '#F0C64A'
                          : displayedElo >= 0
                          ? '#5CF27A'
                          : '#E6483A',
                    },
                  ]}
                >
                  {mode === 'local'
                    ? localWinnerName || 'Draw'
                    : mode === 'computer'
                    ? difficulty.toUpperCase()
                    : displayedElo >= 0
                    ? `+${displayedElo} ELO`
                    : `${displayedElo} ELO`}
                </Text>
                <Text style={styles.rewardLabel}>
                  {mode === 'local' ? 'Match Winner' : mode === 'computer' ? 'AI Difficulty' : 'Rating Gain'}
                </Text>
              </View>

              <View style={styles.rewardDivider} />

              {/* Box 2 */}
              <View style={styles.rewardItem}>
                <LinearGradient colors={['#3C341E', '#241D0D']} style={styles.rewardIconWrap}>
                  <Text style={styles.rewardIcon}>{mode === 'local' ? '♟️' : '🪙'}</Text>
                </LinearGradient>
                <Text style={[styles.rewardVal, { color: '#F0C64A' }]}>
                  {mode === 'local' ? `${gameState.moveHistory?.length || 0}` : `+${displayedCoins}`}
                </Text>
                <Text style={styles.rewardLabel}>
                  {mode === 'local' ? 'Total Moves' : 'Coins Earned'}
                </Text>
              </View>

              <View style={styles.rewardDivider} />

              {/* Box 3 */}
              <View style={styles.rewardItem}>
                <LinearGradient colors={['#1E2C3C', '#0E1924']} style={styles.rewardIconWrap}>
                  <Text style={styles.rewardIcon}>{mode === 'local' ? '⚔️' : '⚡'}</Text>
                </LinearGradient>
                <Text style={[styles.rewardVal, { color: '#68B8FF' }]}>
                  {mode === 'local'
                    ? `${(gameState.capturedPieces?.white?.length || 0) + (gameState.capturedPieces?.black?.length || 0)}`
                    : `+${displayedXp} XP`}
                </Text>
                <Text style={styles.rewardLabel}>
                  {mode === 'local' ? 'Total Captures' : 'XP Earned'}
                </Text>
              </View>
            </View>

            {/* Bottom Progress Bar or Match Notice */}
            <View style={styles.xpProgressSection}>
              <View style={styles.xpProgressHeader}>
                <Text style={[styles.xpLevelTag, { color: isDark ? '#D4E2D8' : '#1A2318' }]}>
                  {mode === 'local' ? (
                    'Pass & Play Match · Great Game!'
                  ) : mode === 'computer' ? (
                    'Level 12 <Text style={{ color: \'#F0C64A\' }}>Bot Battle Mastery</Text>'
                  ) : (
                    'Level 12 <Text style={{ color: \'#F0C64A\' }}>Grandmaster Path</Text>'
                  )}
                </Text>
                <Text style={[styles.xpPercentText, { color: '#68B8FF' }]}>
                  {mode === 'local' ? 'Local 1v1' : '840 / 1,000 XP'}
                </Text>
              </View>

              <View style={styles.progressBarTrack}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: xpProgressBarAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '84%'],
                      }),
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#4A90E2', '#5CF27A', '#F0C64A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.progressBarGradient}
                  />
                </Animated.View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ─── Match Breakdown Summary Stats ─────────────────────────────────── */}
        <Animated.View
          style={[
            styles.breakdownCard,
            {
              backgroundColor: isDark ? '#111713' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E6EFEA',
              opacity: statsCardAnim,
              transform: [
                {
                  translateY: statsCardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [32, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.breakdownHeader, { color: isDark ? '#B4C5BB' : '#5C7A6A' }]}>
            📊 GAMEPLAY SUMMARY
          </Text>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryKey, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
              Game Mode
            </Text>
            <Text style={[styles.summaryVal, { color: isDark ? '#FFF' : '#1A2318' }]}>
              {mode === 'computer'
                ? `VS AI Bot (${difficulty.toUpperCase()})`
                : mode === 'local'
                ? 'Pass & Play (2P Local)'
                : '1v1 Online Match'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryKey, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
              Match Players
            </Text>
            <Text style={[styles.summaryVal, { color: isDark ? '#F0C64A' : '#1A2318' }]}>
              {mode === 'local'
                ? `${player1Name} vs ${player2Name}`
                : `${player1Name} vs ${mode === 'computer' ? `AI Bot (${difficulty})` : 'Opponent'}`}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryKey, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
              Total Moves
            </Text>
            <Text style={[styles.summaryVal, { color: isDark ? '#FFF' : '#1A2318' }]}>
              {gameState.moveHistory?.length || 0} moves played
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryKey, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
              Ending Condition
            </Text>
            <Text style={[styles.summaryVal, { color: '#5CF27A' }]}>
              {gameState.gameStatus?.toUpperCase() || 'CHECKMATE'}
            </Text>
          </View>

          <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.summaryKey, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
              Pieces Captured
            </Text>
            <Text style={[styles.summaryVal, { color: isDark ? '#FFF' : '#1A2318' }]}>
              {gameState.capturedPieces?.white?.length || 0} White ·{' '}
              {gameState.capturedPieces?.black?.length || 0} Black
            </Text>
          </View>
        </Animated.View>

        {/* ─── Animated Action Buttons with Glare Shimmer ─────────────────────── */}
        <Animated.View
          style={[
            styles.actionButtonsCol,
            {
              opacity: actionButtonsAnim,
              transform: [
                {
                  translateY: actionButtonsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [36, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Pulsing Rematch CTA Button with Shimmer Glare Sweep */}
          <Animated.View
            style={{
              transform: [
                { scale: rematchBtnPulse },
                { scale: rematchPressScale },
              ],
            }}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.rematchBtn}
              onPressIn={handlePressInRematch}
              onPressOut={handlePressOutRematch}
              onPress={handleRematch}
            >
              <LinearGradient
                colors={['#F5D15D', '#D4A017', '#8F6108']}
                style={styles.btnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Diagonal Shimmer Glare Sweep */}
                <Animated.View
                  style={[
                    styles.shimmerGlare,
                    { transform: [{ translateX: shimmerTranslateX }, { rotate: '25deg' }] },
                  ]}
                  pointerEvents="none"
                />

                <Text style={styles.rematchText}>
                  {mode === 'computer'
                    ? '🔄 Play Again vs AI'
                    : mode === 'local'
                    ? '🔄 Play Another Match'
                    : '🔄 Find Next Match'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Secondary Choose Mode / Setup Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.secondaryBtn,
              {
                backgroundColor: isDark ? '#16221A' : '#E8F3EC',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#C8DED0',
              },
            ]}
            onPress={() => navigation.navigate(ROUTES.CHESS_MODE)}
          >
            <Text style={[styles.secondaryText, { color: isDark ? '#F1F4F7' : '#1A2318' }]}>
              {mode === 'computer'
                ? '⚙️ Change AI Level / Mode'
                : mode === 'local'
                ? '👥 Setup Players / Mode'
                : '🎮 Choose Another Mode'}
            </Text>
          </TouchableOpacity>

          {/* Back to Game Hub */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.secondaryBtn,
              {
                backgroundColor: isDark ? '#141A16' : '#F5F5F5',
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E0E0E0',
              },
            ]}
            onPress={handleGoHome}
          >
            <Text style={[styles.secondaryText, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
              🏠 Back to Main Hub
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBannerWrap: {
    overflow: 'hidden',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerBanner: {
    alignItems: 'center',
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
  },
  sunburstContainer: {
    position: 'absolute',
    top: -65,
    width: width * 1.6,
    height: width * 1.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunburstRay: {
    position: 'absolute',
    width: 26,
    height: '100%',
    borderRadius: 13,
  },
  sunburstInnerContainer: {
    position: 'absolute',
    top: -45,
    width: width * 1.2,
    height: width * 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunburstInnerRay: {
    position: 'absolute',
    width: 18,
    height: '100%',
    borderRadius: 9,
  },
  shockwaveRing: {
    position: 'absolute',
    top: 56,
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2.5,
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiPiece: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonShape: {
    width: 13,
    height: 6,
    borderRadius: 2,
  },
  rectShape: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  circleShape: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  diamondShape: {
    width: 8,
    height: 8,
    transform: [{ rotate: '45deg' }],
  },
  touchSparkItem: {
    position: 'absolute',
  },
  trophyGlowRing: {
    position: 'absolute',
    top: 56,
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  floatingPieceLeft: {
    position: 'absolute',
    left: 20,
    top: 48,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.85,
  },
  floatingPieceRight: {
    position: 'absolute',
    right: 20,
    top: 48,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.85,
  },
  floatingPieceImage: {
    width: 42,
    height: 42,
  },
  trophyHeroArea: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  miniSparkle: {
    position: 'absolute',
    fontSize: 16,
  },
  trophyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  crownGleamBar: {
    position: 'absolute',
    width: 25,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  trophyIcon: {
    fontSize: 60,
  },
  outcomeBadge: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    paddingHorizontal: 14,
    paddingVertical: 3.5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    marginBottom: 6,
  },
  outcomeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#F0C64A',
    letterSpacing: 1.2,
  },
  outcomeTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  outcomeSub: {
    fontSize: 13,
    color: '#E0EDE4',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  content: {
    padding: 16,
  },
  headToHeadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    marginTop: -20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  playerSlot: {
    flex: 1,
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 6,
  },
  slotAvatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPieceIcon: {
    width: 38,
    height: 38,
  },
  winnerAvatarGlow: {
    shadowColor: '#F0C64A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  crownTag: {
    position: 'absolute',
    top: -9,
    right: -7,
    backgroundColor: '#141A16',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1.5,
    borderColor: '#F0C64A',
  },
  slotPlayerName: {
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 2,
    textAlign: 'center',
  },
  slotPlayerSub: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 5,
    textAlign: 'center',
  },
  slotResultPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  slotResultText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  vsDividerCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  vsBadgeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  vsEmoji: {
    fontSize: 15,
  },
  vsText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  rewardCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    gap: 6,
  },
  cardHeader: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  headerSparkle: {
    fontSize: 12,
  },
  rewardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  rewardItem: {
    alignItems: 'center',
  },
  rewardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  rewardIcon: {
    fontSize: 22,
  },
  rewardVal: {
    fontSize: 17,
    fontWeight: '900',
  },
  rewardLabel: {
    fontSize: 10,
    color: '#7A9485',
    fontWeight: '700',
    marginTop: 2,
  },
  rewardDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  xpProgressSection: {
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
  },
  xpProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  xpLevelTag: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  xpPercentText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarGradient: {
    flex: 1,
    height: '100%',
  },
  breakdownCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  breakdownHeader: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  summaryKey: {
    fontSize: 13,
  },
  summaryVal: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  actionButtonsCol: {
    gap: 12,
  },
  rematchBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  btnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  shimmerGlare: {
    position: 'absolute',
    top: -20,
    width: 60,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  rematchText: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#241402',
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  secondaryText: {
    fontSize: 14.5,
    fontWeight: '800',
  },
});

export default ChessResultScreen;
