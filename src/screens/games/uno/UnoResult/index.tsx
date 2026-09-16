import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
  Share,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../theme';
import { ROUTES } from '../../../../navigation/routes';
import { UnoGameState, UnoPlayer } from '../../../../gameEngine/uno/unoTypes';
import { UnoRules } from '../../../../gameEngine/uno/unoRules';
import { soundService } from '../../../../services/sound/soundService';
import { vibrationService } from '../../../../services/vibration/vibrationService';
import { useAppSelector } from '../../../../redux/hooks';

const { width, height } = Dimensions.get('window');

// ─── Celebration Confetti Specs ─────────────────────────────────────────────
const CONFETTI_COUNT = 32;
const CONFETTI_SHAPES = ['ribbon', 'rect', 'star', 'circle', 'diamond', 'uno_card'];
const CONFETTI_COLORS = [
  '#E74C3C', // Uno Red
  '#F1C40F', // Uno Yellow
  '#2ECC71', // Uno Green
  '#3498DB', // Uno Blue
  '#9B59B6', // Purple Wild
  '#FFD700', // Gold
  '#FFFFFF', // White
  '#FF7675',
  '#55EFC4',
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

export const UnoResultScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark } = useTheme();

  const currentUserId = useAppSelector((state) => state.auth.userId) || 'player_me';
  const userProfile = useAppSelector((state) => state.user.profile);

  const gameState: UnoGameState = route.params?.gameState;
  const winnerId: string = route.params?.winnerId || gameState?.winnerId || '';
  const mode = route.params?.mode || gameState?.mode || 'computer';
  const difficulty = route.params?.difficulty || gameState?.difficulty || 'medium';
  const stake: number = route.params?.stake || 0;
  const prizePool: number = route.params?.prizePool || 0;

  const players: UnoPlayer[] = gameState?.players || [];
  const winner = players.find((p) => p.id === winnerId) || players[0];
  const isMeWinner = winner?.id === currentUserId || winner?.id === 'player_me' || winner?.id === 'p1';

  // Points & Rewards Calculation
  const pointsWon = gameState ? UnoRules.calculateWinnerPoints(players, winnerId) : 160;
  const targetCoins = isMeWinner
    ? (prizePool > 0 ? prizePool : mode === 'computer' ? 250 : 500)
    : (stake > 0 ? 0 : 50);
  const targetXp = isMeWinner ? 180 : 50;
  const targetRatingChange = isMeWinner ? 28 : -14;

  // Match Highlights Extraction from Discard Pile / State
  const discardPile = gameState?.discardPile || [];
  const wildsCount = discardPile.filter((c) => c.color === 'wild' || c.value === 'wild_draw4').length || 3;
  const actionCardsCount = discardPile.filter((c) => ['skip', 'reverse', 'draw2'].includes(c.value)).length || 5;
  const totalTurns = gameState?.turnNumber || 14;

  // ─── Animation References ───────────────────────────────────────────────────
  const bannerScale = useRef(new Animated.Value(0.75)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  // Sunburst Rotations
  const sunburstClockwise = useRef(new Animated.Value(0)).current;
  const sunburstCounter = useRef(new Animated.Value(0)).current;

  // Shockwave Impact Rings
  const shockwave1 = useRef(new Animated.Value(0)).current;
  const shockwave2 = useRef(new Animated.Value(0)).current;

  // Hero Trophy / Crest
  const trophyScale = useRef(new Animated.Value(0.1)).current;
  const trophyFloat = useRef(new Animated.Value(0)).current;
  const trophyGlow = useRef(new Animated.Value(0)).current;
  const gleamAnim = useRef(new Animated.Value(0)).current;

  // Sections Stagger Entrances
  const rewardsCardAnim = useRef(new Animated.Value(0)).current;
  const xpBarAnim = useRef(new Animated.Value(0)).current;
  const standingsAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;

  // Rematch CTA Glare Shimmer & Breathing Pulse
  const rematchBtnPulse = useRef(new Animated.Value(1)).current;
  const rematchShimmerAnim = useRef(new Animated.Value(0)).current;

  // Numbers ticker
  const [displayedCoins, setDisplayedCoins] = useState(0);
  const [displayedXp, setDisplayedXp] = useState(0);
  const [displayedRating, setDisplayedRating] = useState(0);

  // Interactive touch spark bursts state
  const [touchSparks, setTouchSparks] = useState<TouchSpark[]>([]);
  const sparkAnim = useRef(new Animated.Value(0)).current;

  // Confetti particles
  const confettiAnims = useRef(
    Array.from({ length: CONFETTI_COUNT }, () => ({
      y: new Animated.Value(0),
      x: new Animated.Value(0),
      rot: new Animated.Value(0),
      opacity: new Animated.Value(1),
    })),
  ).current;

  const confettiPieces = useRef<ConfettiPiece[]>(
    Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      shape: CONFETTI_SHAPES[i % CONFETTI_SHAPES.length],
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      startX: Math.random() * width,
      startY: -40 - Math.random() * 60,
      endY: height + 60,
      driftX: (Math.random() - 0.5) * 140,
      scale: 0.6 + Math.random() * 0.7,
      duration: 2500 + Math.random() * 1800,
      delay: Math.random() * 1000,
    })),
  ).current;

  // Play Victory / Defeat Sounds & Haptics
  useEffect(() => {
    if (isMeWinner) {
      soundService.play('game_win');
      vibrationService.vibrateSuccess();
    } else {
      soundService.play('game_lose');
      vibrationService.vibrateError();
    }
  }, [isMeWinner]);

  // Main Orchestration Animations
  useEffect(() => {
    // 1. Sunburst Continuous Rotation
    Animated.loop(
      Animated.timing(sunburstClockwise, {
        toValue: 1,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.timing(sunburstCounter, {
        toValue: 1,
        duration: 24000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // 2. Trophy Floating Bob
    Animated.loop(
      Animated.sequence([
        Animated.timing(trophyFloat, {
          toValue: -8,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(trophyFloat, {
          toValue: 4,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // 3. Trophy Glow Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(trophyGlow, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(trophyGlow, {
          toValue: 0.3,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // 4. Rematch Button Shimmer & Breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(rematchShimmerAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(rematchBtnPulse, {
          toValue: 1.03,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rematchBtnPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // 5. Hero Banner Pop & Shockwaves
    Animated.parallel([
      Animated.spring(bannerScale, {
        toValue: 1,
        friction: 5,
        tension: 45,
        useNativeDriver: true,
      }),
      Animated.timing(bannerOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(trophyScale, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(gleamAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Shockwave Rings
    Animated.stagger(250, [
      Animated.timing(shockwave1, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(shockwave2, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // 6. Staggered Section Entrances
    Animated.stagger(120, [
      Animated.spring(rewardsCardAnim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
      Animated.spring(xpBarAnim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
      Animated.spring(standingsAnim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
      Animated.spring(statsAnim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
      Animated.spring(actionsAnim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
    ]).start();

    // 7. Confetti Drop Animation
    if (isMeWinner) {
      confettiPieces.forEach((piece, index) => {
        const anim = confettiAnims[index];
        Animated.loop(
          Animated.sequence([
            Animated.delay(piece.delay),
            Animated.parallel([
              Animated.timing(anim.y, {
                toValue: piece.endY,
                duration: piece.duration,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              Animated.timing(anim.x, {
                toValue: piece.driftX,
                duration: piece.duration,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(anim.rot, {
                toValue: 1,
                duration: piece.duration,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(anim.y, { toValue: piece.startY, duration: 0, useNativeDriver: true }),
            Animated.timing(anim.x, { toValue: 0, duration: 0, useNativeDriver: true }),
            Animated.timing(anim.rot, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ).start();
      });
    }

    // 8. Numbers Count-Up Ticker
    const stepDuration = 30;
    const totalSteps = 25;
    let step = 0;

    const tickerTimer = setInterval(() => {
      step++;
      const progress = step / totalSteps;
      setDisplayedCoins(Math.round(targetCoins * progress));
      setDisplayedXp(Math.round(targetXp * progress));
      setDisplayedRating(Math.round(targetRatingChange * progress));

      if (step >= totalSteps) {
        clearInterval(tickerTimer);
        setDisplayedCoins(targetCoins);
        setDisplayedXp(targetXp);
        setDisplayedRating(targetRatingChange);
      }
    }, stepDuration);

    return () => clearInterval(tickerTimer);
  }, [
    isMeWinner,
    sunburstClockwise,
    sunburstCounter,
    trophyFloat,
    trophyGlow,
    bannerScale,
    bannerOpacity,
    trophyScale,
    gleamAnim,
    shockwave1,
    shockwave2,
    rewardsCardAnim,
    xpBarAnim,
    standingsAnim,
    statsAnim,
    actionsAnim,
    rematchBtnPulse,
    rematchShimmerAnim,
    confettiAnims,
    confettiPieces,
    targetCoins,
    targetXp,
    targetRatingChange,
  ]);

  // Interactive Touch Sparks on Screen Tap
  const handleScreenPress = useCallback(
    (e: any) => {
      const { locationX, locationY } = e.nativeEvent;
      const sparks: TouchSpark[] = Array.from({ length: 12 }, (_, i) => ({
        id: Date.now() + i,
        x: locationX,
        y: locationY,
        angle: (i * Math.PI * 2) / 12,
        distance: 40 + Math.random() * 50,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 5 + Math.random() * 5,
      }));

      setTouchSparks(sparks);
      sparkAnim.setValue(0);
      vibrationService.vibrateTap();

      Animated.timing(sparkAnim, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => setTouchSparks([]));
    },
    [sparkAnim],
  );

  const handleRematch = () => {
    soundService.play('button_tap');
    vibrationService.vibrateTap();
    navigation.replace(ROUTES.UNO_GAME, {
      matchId: `uno_${Date.now()}`,
      mode,
      difficulty,
      playerCount: players.length,
      stake,
      prizePool,
      players,
      player1Name: players[0]?.name,
      player2Name: players[1]?.name,
    });
  };

  const handleShareVictory = async () => {
    soundService.play('button_tap');
    try {
      await Share.share({
        message: `🔥 UNO CHAMPION! I just scored +${pointsWon} points in a ${players.length}-Player Uno match on GameLivo! 🏆🂡\nCan you beat my speed? Play now!`,
      });
    } catch (e) {}
  };

  const handleReturnHome = () => {
    soundService.play('button_tap');
    navigation.navigate(ROUTES.UNO_HOME);
  };

  const spinClockwise = sunburstClockwise.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinCounter = sunburstCounter.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const shimmerTranslateX = rematchShimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <TouchableWithoutFeedback onPress={handleScreenPress}>
      <View style={[styles.container, { backgroundColor: isDark ? '#060D09' : '#F0F7F2' }]}>
        <StatusBar barStyle="light-content" />

        {/* ─── Background Cinematic Sunburst & Aura ─── */}
        <LinearGradient
          colors={
            isMeWinner
              ? ['#143E2B', '#0A2016', '#040E0A']
              : ['#3A1210', '#200A09', '#0E0404']
          }
          style={StyleSheet.absoluteFill}
        />

        {/* Sunburst Rays (Clockwise & Counter) */}
        {isMeWinner && (
          <View style={styles.sunburstContainer} pointerEvents="none">
            <Animated.View style={[styles.sunburstWrap, { transform: [{ rotate: spinClockwise }] }]}>
              {Array.from({ length: 12 }).map((_, i) => (
                <View
                  key={`ray1_${i}`}
                  style={[
                    styles.sunburstRay,
                    {
                      transform: [{ rotate: `${i * 30}deg` }],
                      backgroundColor: i % 2 === 0 ? 'rgba(241, 196, 15, 0.07)' : 'rgba(231, 76, 60, 0.05)',
                    },
                  ]}
                />
              ))}
            </Animated.View>

            <Animated.View style={[styles.sunburstWrap, { transform: [{ rotate: spinCounter }] }]}>
              {Array.from({ length: 8 }).map((_, i) => (
                <View
                  key={`ray2_${i}`}
                  style={[
                    styles.sunburstRay,
                    {
                      transform: [{ rotate: `${i * 45}deg` }],
                      backgroundColor: 'rgba(46, 204, 113, 0.06)',
                    },
                  ]}
                />
              ))}
            </Animated.View>
          </View>
        )}

        {/* ─── Falling Confetti Physics ─── */}
        {isMeWinner && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {confettiPieces.map((piece, index) => {
              const anim = confettiAnims[index];
              const spinConfetti = anim.rot.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '720deg'],
              });

              return (
                <Animated.View
                  key={`confetti_${piece.id}`}
                  style={[
                    styles.confettiParticle,
                    {
                      left: piece.startX,
                      top: piece.startY,
                      backgroundColor: piece.color,
                      transform: [
                        { translateY: anim.y },
                        { translateX: anim.x },
                        { rotate: spinConfetti },
                        { scale: piece.scale },
                      ],
                    },
                    piece.shape === 'star' && styles.confettiStar,
                    piece.shape === 'circle' && styles.confettiCircle,
                    piece.shape === 'uno_card' && styles.confettiCard,
                  ]}
                >
                  {piece.shape === 'uno_card' && (
                    <Text style={styles.confettiCardGlyph}>🂡</Text>
                  )}
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* ─── Touch Sparks Overlay ─── */}
        {touchSparks.length > 0 && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {touchSparks.map((spark) => {
              const moveX = sparkAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [spark.x, spark.x + Math.cos(spark.angle) * spark.distance],
              });
              const moveY = sparkAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [spark.y, spark.y + Math.sin(spark.angle) * spark.distance],
              });
              const sparkScale = sparkAnim.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [1, 1.4, 0],
              });
              const sparkOpacity = sparkAnim.interpolate({
                inputRange: [0, 0.8, 1],
                outputRange: [1, 0.9, 0],
              });

              return (
                <Animated.View
                  key={`spark_${spark.id}`}
                  style={[
                    styles.touchSparkDot,
                    {
                      width: spark.size,
                      height: spark.size,
                      borderRadius: spark.size / 2,
                      backgroundColor: spark.color,
                      transform: [{ translateX: moveX }, { translateY: moveY }, { scale: sparkScale }],
                      opacity: sparkOpacity,
                    },
                  ]}
                />
              );
            })}
          </View>
        )}

        {/* ─── Main Scrollable Content ─── */}
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── 1. HERO CELEBRATION CARD ─── */}
          <Animated.View
            style={[
              styles.heroContainer,
              {
                opacity: bannerOpacity,
                transform: [{ scale: bannerScale }],
              },
            ]}
          >
            {/* Shockwave Rings on Impact */}
            {isMeWinner && (
              <>
                <Animated.View
                  style={[
                    styles.shockwaveRing,
                    {
                      borderColor: '#F1C40F',
                      transform: [
                        {
                          scale: shockwave1.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 2.4],
                          }),
                        },
                      ],
                      opacity: shockwave1.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.9, 0.3, 0],
                      }),
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.shockwaveRing,
                    {
                      borderColor: '#2ECC71',
                      transform: [
                        {
                          scale: shockwave2.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 2.4],
                          }),
                        },
                      ],
                      opacity: shockwave2.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.9, 0.3, 0],
                      }),
                    },
                  ]}
                />
              </>
            )}

            {/* Glowing Hero Trophy & Uno Crest */}
            <Animated.View
              style={[
                styles.trophyWrapper,
                {
                  transform: [{ scale: trophyScale }, { translateY: trophyFloat }],
                },
              ]}
            >
              {/* Glow Halo */}
              <Animated.View
                style={[
                  styles.trophyGlowHalo,
                  {
                    backgroundColor: isMeWinner ? '#F1C40F' : '#E74C3C',
                    opacity: trophyGlow,
                  },
                ]}
              />

              <LinearGradient
                colors={
                  isMeWinner
                    ? ['#F1C40F', '#F39C12', '#D35400']
                    : ['#E74C3C', '#C0392B', '#781515']
                }
                style={styles.trophyDisc}
              >
                <Text style={styles.trophyGlyph}>{isMeWinner ? '🏆' : '🥈'}</Text>
                {isMeWinner && (
                  <View style={styles.crownTag}>
                    <Text style={styles.crownTagText}>#1 UNO</Text>
                  </View>
                )}
              </LinearGradient>
            </Animated.View>

            {/* Winner Title Headline */}
            <Text style={styles.winnerHeadline}>
              {isMeWinner ? 'VICTORY!' : 'MATCH FINISHED'}
            </Text>

            <Text style={styles.winnerSubHeadline}>
              {isMeWinner ? 'YOU ARE THE UNO CHAMPION' : `${winner?.name || 'Opponent'} Won the Match`}
            </Text>

            {/* Total Points Pill */}
            <View style={styles.pointsPill}>
              <Text style={styles.pointsPillText}>
                🎯 +{pointsWon} Points Scored from Rival Hands
              </Text>
            </View>
          </Animated.View>

          {/* ─── 2. REWARDS & STATS TICKER CARD ─── */}
          <Animated.View
            style={[
              styles.rewardsCard,
              {
                opacity: rewardsCardAnim,
                transform: [
                  {
                    translateY: rewardsCardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.03)']}
              style={styles.rewardsGradient}
            >
              {/* Coins Ticker */}
              <View style={styles.rewardStatItem}>
                <View style={styles.rewardIconWrap}>
                  <Text style={styles.rewardIcon}>🪙</Text>
                </View>
                <Text style={styles.rewardNumber}>
                  {displayedCoins > 0 ? `+${displayedCoins.toLocaleString()}` : displayedCoins}
                </Text>
                <Text style={styles.rewardLabel}>COINS</Text>
              </View>

              <View style={styles.rewardDivider} />

              {/* XP Ticker */}
              <View style={styles.rewardStatItem}>
                <View style={[styles.rewardIconWrap, { backgroundColor: 'rgba(52, 152, 219, 0.2)' }]}>
                  <Text style={styles.rewardIcon}>⚡</Text>
                </View>
                <Text style={[styles.rewardNumber, { color: '#54A0FF' }]}>
                  +{displayedXp}
                </Text>
                <Text style={styles.rewardLabel}>XP GAINED</Text>
              </View>

              <View style={styles.rewardDivider} />

              {/* Rating ELO Ticker */}
              <View style={styles.rewardStatItem}>
                <View style={[styles.rewardIconWrap, { backgroundColor: 'rgba(46, 204, 113, 0.2)' }]}>
                  <Text style={styles.rewardIcon}>🏆</Text>
                </View>
                <Text
                  style={[
                    styles.rewardNumber,
                    { color: displayedRating >= 0 ? '#2ECC71' : '#E74C3C' },
                  ]}
                >
                  {displayedRating >= 0 ? `+${displayedRating}` : displayedRating}
                </Text>
                <Text style={styles.rewardLabel}>RATING</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ─── 3. LEVEL UP PROGRESSION BAR ─── */}
          <Animated.View
            style={[
              styles.xpSection,
              {
                opacity: xpBarAnim,
                transform: [
                  {
                    translateY: xpBarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [25, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.xpHeaderRow}>
              <Text style={styles.xpLevelText}>LEVEL {userProfile?.level || 12}</Text>
              <Text style={styles.xpPointsText}>780 / 1,000 XP</Text>
            </View>
            <View style={styles.xpTrack}>
              <LinearGradient
                colors={['#2ECC71', '#55EFC4']}
                style={[styles.xpFill, { width: '78%' }]}
              />
            </View>
          </Animated.View>

          {/* ─── 4. PLAYERS STANDINGS PODIUM BREAKDOWN ─── */}
          <Animated.View
            style={[
              styles.sectionWrapper,
              {
                opacity: standingsAnim,
                transform: [
                  {
                    translateY: standingsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [25, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>TABLE STANDINGS</Text>
              <Text style={styles.sectionSub}>{players.length}-Player Arena</Text>
            </View>

            <View style={styles.standingsList}>
              {players.map((player, idx) => {
                const isPlayerWinner = player.id === winnerId;
                const penaltyScore = UnoRules.calculateHandScore(player.hand);
                const isMe = player.id === currentUserId || player.id === 'player_me' || player.id === 'p1';

                return (
                  <View
                    key={player.id}
                    style={[
                      styles.playerRowCard,
                      {
                        backgroundColor: isDark ? 'rgba(16, 28, 20, 0.85)' : '#FFFFFF',
                        borderColor: isPlayerWinner
                          ? '#2ECC71'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : '#E0ECE4',
                      },
                      isPlayerWinner && styles.winnerRowGlow,
                    ]}
                  >
                    <View style={styles.playerRowLeft}>
                      {/* Rank Badge */}
                      <View
                        style={[
                          styles.rankBadge,
                          idx === 0 && { backgroundColor: '#F1C40F' },
                          idx === 1 && { backgroundColor: '#BDC3C7' },
                          idx === 2 && { backgroundColor: '#E67E22' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.rankBadgeText,
                            idx < 3 && { color: '#1A2318' },
                          ]}
                        >
                          {idx === 0 ? '👑' : `#${idx + 1}`}
                        </Text>
                      </View>

                      {/* Avatar */}
                      <Text style={styles.playerAvatar}>
                        {player.avatar || (player.isBot ? '🤖' : '👩🏻')}
                      </Text>

                      <View>
                        <View style={styles.nameRow}>
                          <Text style={[styles.playerName, { color: isDark ? '#FFF' : '#1A2318' }]}>
                            {player.name}
                          </Text>
                          {isMe && (
                            <View style={styles.youPill}>
                              <Text style={styles.youPillText}>YOU</Text>
                            </View>
                          )}
                          {isPlayerWinner && (
                            <View style={styles.winnerTag}>
                              <Text style={styles.winnerTagText}>WINNER</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.cardsLeftSub, { color: isDark ? '#8CA093' : '#5C7A6A' }]}>
                          {isPlayerWinner ? '0 cards (Cleared hand!)' : `${player.hand.length} cards remaining`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.playerRowRight}>
                      <Text
                        style={[
                          styles.scoreText,
                          { color: isPlayerWinner ? '#2ECC71' : '#E74C3C' },
                        ]}
                      >
                        {isPlayerWinner ? `+${pointsWon} pts` : `-${penaltyScore} pts`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>

          {/* ─── 5. MATCH HIGHLIGHTS & ACTION CARDS ─── */}
          <Animated.View
            style={[
              styles.sectionWrapper,
              {
                opacity: statsAnim,
                transform: [
                  {
                    translateY: statsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [25, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>MATCH HIGHLIGHTS</Text>
            </View>

            <View style={styles.statsGrid}>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: isDark ? 'rgba(16, 28, 20, 0.85)' : '#FFFFFF' },
                ]}
              >
                <Text style={styles.statCardIcon}>🎴</Text>
                <Text style={styles.statCardNumber}>{totalTurns}</Text>
                <Text style={styles.statCardLabel}>TURNS PLAYED</Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: isDark ? 'rgba(16, 28, 20, 0.85)' : '#FFFFFF' },
                ]}
              >
                <Text style={styles.statCardIcon}>💥</Text>
                <Text style={styles.statCardNumber}>{wildsCount}</Text>
                <Text style={styles.statCardLabel}>WILDS PLAYED</Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: isDark ? 'rgba(16, 28, 20, 0.85)' : '#FFFFFF' },
                ]}
              >
                <Text style={styles.statCardIcon}>⇄</Text>
                <Text style={styles.statCardNumber}>{actionCardsCount}</Text>
                <Text style={styles.statCardLabel}>ACTION CARDS</Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: isDark ? 'rgba(16, 28, 20, 0.85)' : '#FFFFFF' },
                ]}
              >
                <Text style={styles.statCardIcon}>🔥</Text>
                <Text style={styles.statCardNumber}>100%</Text>
                <Text style={styles.statCardLabel}>UNO CALLED</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* ─── 6. BOTTOM FLOATING ACTIONS BAR ─── */}
        <Animated.View
          style={[
            styles.bottomBar,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              opacity: actionsAnim,
            },
          ]}
        >
          {/* Primary Action Button: Rematch */}
          <Animated.View style={{ transform: [{ scale: rematchBtnPulse }] }}>
            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.primaryRematchBtn}
              onPress={handleRematch}
            >
              <LinearGradient
                colors={['#F1C40F', '#F39C12', '#D35400']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryBtnText}>⚡ PLAY AGAIN (REMATCH)</Text>

                {/* Shimmer Light Beam */}
                <Animated.View
                  style={[
                    styles.shimmerBeam,
                    { transform: [{ translateX: shimmerTranslateX }] },
                  ]}
                />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Secondary Actions Row */}
          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.secondaryBtn}
              onPress={handleShareVictory}
            >
              <Text style={styles.secondaryBtnText}>↗ Share Victory</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.secondaryBtn}
              onPress={handleReturnHome}
            >
              <Text style={styles.secondaryBtnText}>← Uno Hub</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sunburstContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sunburstWrap: {
    position: 'absolute',
    width: width * 2,
    height: width * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunburstRay: {
    position: 'absolute',
    width: 65,
    height: width * 2,
    borderRadius: 30,
  },
  confettiParticle: {
    position: 'absolute',
    width: 9,
    height: 14,
    borderRadius: 2,
  },
  confettiStar: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  confettiCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confettiCard: {
    width: 16,
    height: 22,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiCardGlyph: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  touchSparkDot: {
    position: 'absolute',
  },
  content: {
    paddingHorizontal: 16,
  },
  heroContainer: {
    alignItems: 'center',
    marginVertical: 14,
    position: 'relative',
  },
  shockwaveRing: {
    position: 'absolute',
    top: 0,
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
  },
  trophyWrapper: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  trophyGlowHalo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    filter: 'blur(20px)',
  },
  trophyDisc: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#F1C40F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  trophyGlyph: {
    fontSize: 48,
  },
  crownTag: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#1A2318',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  crownTagText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 0.8,
  },
  winnerHeadline: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  winnerSubHeadline: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F1C40F',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  pointsPill: {
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  pointsPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E8F8F0',
  },
  rewardsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 16,
  },
  rewardsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  rewardStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  rewardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(241, 196, 15, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  rewardIcon: {
    fontSize: 16,
  },
  rewardNumber: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFD700',
  },
  rewardLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8CA093',
    marginTop: 2,
    letterSpacing: 0.6,
  },
  rewardDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  xpSection: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  xpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  xpLevelText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#2ECC71',
    letterSpacing: 0.5,
  },
  xpPointsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A0B2A6',
  },
  xpTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionWrapper: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#E74C3C',
    letterSpacing: 0.8,
  },
  sectionSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7A9182',
  },
  standingsList: {
    gap: 8,
  },
  playerRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  winnerRowGlow: {
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  playerRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#A0B2A6',
  },
  playerAvatar: {
    fontSize: 24,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  youPill: {
    backgroundColor: 'rgba(52, 152, 219, 0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  youPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#3498DB',
  },
  winnerTag: {
    backgroundColor: 'rgba(46, 204, 113, 0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  winnerTagText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#2ECC71',
  },
  cardsLeftSub: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  playerRowRight: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 13.5,
    fontWeight: '900',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statCardIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  statCardNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statCardLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#7A9182',
    marginTop: 2,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'rgba(6, 13, 9, 0.95)',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  primaryRematchBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#F1C40F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  primaryBtnText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#1A1204',
    letterSpacing: 0.8,
  },
  shimmerBeam: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    transform: [{ skewX: '-20deg' }],
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#A0B2A6',
  },
});

export default UnoResultScreen;
