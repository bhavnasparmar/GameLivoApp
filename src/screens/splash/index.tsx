import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import LottieView from 'lottie-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { ROUTES } from '../../navigation/routes';
import { useAppSelector } from '../../redux/hooks';
import { selectIsLoggedIn } from '../../redux/selectors/authSelectors';
import { useAuth } from '../../hooks/useAuth';
import { LOTTIE_ANIMATIONS } from '../../assets/lottie';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── 3D Miniature Background Dice Component ─────────────────────────────────
const MiniBgDice: React.FC<{
  size: number;
  style: any;
  rotateDeg?: string;
  opacity?: number;
}> = ({ size, style, rotateDeg = '15deg', opacity = 0.75 }) => {
  return (
    <View
      style={[
        styles.miniDiceContainer,
        {
          width: size,
          height: size,
          borderRadius: size * 0.22,
          transform: [{ rotate: rotateDeg }],
          opacity,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={['#FFFFFF', '#E6E9F0', '#B0B5C0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.miniDiceGradient}
      >
        <View style={styles.miniDicePipRow}>
          <View style={[styles.miniPip, { width: size * 0.18, height: size * 0.18 }]} />
          <View style={[styles.miniPip, { width: size * 0.18, height: size * 0.18 }]} />
        </View>
        <View style={[styles.miniPip, { width: size * 0.18, height: size * 0.18, alignSelf: 'center' }]} />
        <View style={styles.miniDicePipRow}>
          <View style={[styles.miniPip, { width: size * 0.18, height: size * 0.18 }]} />
          <View style={[styles.miniPip, { width: size * 0.18, height: size * 0.18 }]} />
        </View>
      </LinearGradient>
    </View>
  );
};

// ─── Golden 3D Star Icon ───────────────────────────────────────────────────
const Gold3DStar: React.FC<{ size: number; style?: any }> = ({ size, style }) => (
  <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
    <Text style={{ fontSize: size * 0.85, color: '#FFDF00', textShadowColor: '#FFA500', textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } }}>
      ★
    </Text>
  </View>
);

// ─── Main Splash Screen ────────────────────────────────────────────────────
const SplashScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const { checkAuth } = useAuth();

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAuraAnim = useRef(new Animated.Value(1)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const contentScaleAnim = useRef(new Animated.Value(0.92)).current;
  const ringRotateAnim = useRef(new Animated.Value(0)).current;
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  const loadingMessages = [
    'Loading Your Game World...',
    'Connecting to Arena...',
    'Preparing High Stakes Tables...',
    'Ready to Play & Win!',
  ];

  useEffect(() => {
    // 1. Entrance Fade & Scale
    Animated.parallel([
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(contentScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Dice Floating Bobbing Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -12,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 6,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Golden Aura Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAuraAnim, {
          toValue: 1.15,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAuraAnim, {
          toValue: 0.95,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 4. Foreground Ring Continuous Spin
    Animated.loop(
      Animated.timing(ringRotateAnim, {
        toValue: 1,
        duration: 4500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 5. Shimmer Sweep on Progress Bar
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 6. Progress Bar Fill (0 to 100% in 2.8 seconds)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();

    // 7. Dynamic Loading Text Cycling
    const textInterval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1 < loadingMessages.length ? prev + 1 : prev));
    }, 700);

    // 8. Navigate on Finish
    const navTimeout = setTimeout(async () => {
      clearInterval(textInterval);
      const isAuthValid = await checkAuth();
      if (isAuthValid || isLoggedIn) {
        navigation.replace(ROUTES.MAIN as 'Main');
      } else {
        navigation.replace(ROUTES.AUTH as 'Auth');
      }
    }, 3100);

    return () => {
      clearInterval(textInterval);
      clearTimeout(navTimeout);
    };
  }, [navigation, isLoggedIn, checkAuth]);

  const spinInterpolate = ringRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, SCREEN_WIDTH * 0.7],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ─── Background Cinematic Dark Gold Atmosphere ─── */}
      <LinearGradient
        colors={['#170D03', '#0D0702', '#060301', '#000000']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Warm Spotlight Cone */}
      <LinearGradient
        colors={['rgba(22, 100, 56, 0.22)', 'rgba(255, 166, 0, 0.08)', 'transparent']}
        style={styles.topSpotlight}
      />

      {/* Ambient Floating Poker Suits (Spade, Club, Diamond, Heart) */}
      <Text style={[styles.ambientSuit, { top: SCREEN_HEIGHT * 0.1, right: SCREEN_WIDTH * 0.18, fontSize: 38, transform: [{ rotate: '12deg' }] }]}>
        ♠
      </Text>
      <Text style={[styles.ambientSuit, { top: SCREEN_HEIGHT * 0.22, left: SCREEN_WIDTH * 0.1, fontSize: 32, transform: [{ rotate: '-15deg' }] }]}>
        ♣
      </Text>
      <Text style={[styles.ambientSuit, { top: SCREEN_HEIGHT * 0.38, left: SCREEN_WIDTH * 0.06, fontSize: 28, transform: [{ rotate: '25deg' }] }]}>
        ♦
      </Text>
      <Text style={[styles.ambientSuit, { top: SCREEN_HEIGHT * 0.37, right: SCREEN_WIDTH * 0.08, fontSize: 30, transform: [{ rotate: '-10deg' }] }]}>
        ♥
      </Text>

      {/* Floating 3D Gold Stars */}
      <Gold3DStar size={24} style={{ position: 'absolute', top: SCREEN_HEIGHT * 0.3, left: SCREEN_WIDTH * 0.12 }} />
      <Gold3DStar size={20} style={{ position: 'absolute', top: SCREEN_HEIGHT * 0.46, right: SCREEN_WIDTH * 0.13 }} />
      <Gold3DStar size={16} style={{ position: 'absolute', top: SCREEN_HEIGHT * 0.18, right: SCREEN_WIDTH * 0.38 }} />

      {/* Ambient Small Floating Background Dice */}
      <MiniBgDice
        size={46}
        style={{ position: 'absolute', top: SCREEN_HEIGHT * 0.11, left: SCREEN_WIDTH * 0.16 }}
        rotateDeg="25deg"
        opacity={0.82}
      />
      <MiniBgDice
        size={38}
        style={{ position: 'absolute', top: SCREEN_HEIGHT * 0.24, right: SCREEN_WIDTH * 0.12 }}
        rotateDeg="-30deg"
        opacity={0.7}
      />
      <MiniBgDice
        size={42}
        style={{ position: 'absolute', top: SCREEN_HEIGHT * 0.42, left: SCREEN_WIDTH * 0.08 }}
        rotateDeg="18deg"
        opacity={0.78}
      />

      {/* Bottom Floor Golden Glow Reflection */}
      <LinearGradient
        colors={['transparent', 'rgba(255, 179, 0, 0.08)', 'rgba(255, 150, 0, 0.15)', 'transparent']}
        style={styles.floorGlow}
      />

      {/* ─── Main Interactive Content ─── */}
      <Animated.View
        style={[
          styles.mainContent,
          {
            opacity: contentFadeAnim,
            transform: [{ scale: contentScaleAnim }],
          },
        ]}
      >
        {/* ─── Center Hero Dice Section ─── */}
        <View style={styles.heroSection}>
          {/* Pulsing Golden Aura Halo */}
          <Animated.View
            style={[
              styles.goldAuraHalo,
              {
                transform: [{ scale: pulseAuraAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(255, 215, 0, 0.45)', 'rgba(255, 140, 0, 0.2)', 'transparent']}
              style={styles.auraGradient}
            />
          </Animated.View>

          {/* Lottie Swirling Golden Energy Vortex */}
          <View style={styles.lottieWrapper} pointerEvents="none">
            <LottieView
              source={LOTTIE_ANIMATIONS.splashGoldenVortex}
              autoPlay
              loop
              style={styles.lottieView}
            />
          </View>

          {/* Animated Floating 3D Dice */}
          <Animated.View
            style={[
              styles.heroDiceContainer,
              {
                transform: [{ translateY: floatAnim }, { rotate: '-12deg' }],
              },
            ]}
          >
            {/* 3D Dice Perspective Box */}
            <View style={styles.dice3D}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC', '#E2E8F0', '#CBD5E1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.diceFace}
              >
                {/* Dice Specular Highlight Reflection */}
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.2)', 'transparent']}
                  style={styles.diceGlint}
                />

                {/* 5 Pips Configuration on Main Face with Golden Glowing Rim */}
                <View style={styles.pipRow}>
                  <View style={styles.heroPip} />
                  <View style={styles.heroPip} />
                </View>
                <View style={styles.heroPipCenter} />
                <View style={styles.pipRow}>
                  <View style={styles.heroPip} />
                  <View style={styles.heroPip} />
                </View>
              </LinearGradient>

              {/* Dice 3D Bottom/Right Shadow Edge */}
              <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'rgba(20,10,0,0.9)']}
                style={styles.dice3DBevel}
              />
            </View>
          </Animated.View>

          {/* Foreground Golden Swirling Orbit Trail Ring */}
          <Animated.View
            style={[
              styles.foregroundOrbitRing,
              {
                transform: [{ rotate: spinInterpolate }, { scaleX: 1.6 }, { scaleY: 0.65 }],
              },
            ]}
          />
        </View>

        {/* ─── Golden Crown & GameLivo Logo ─── */}
        <View style={styles.brandContainer}>
          {/* Royal 5-Point Crown */}
          <View style={styles.crownContainer}>
            <LinearGradient
              colors={['#FFF3A8', '#FFD700', '#FFA500', '#CC8400']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.crownPeakLeft}
            />
            <LinearGradient
              colors={['#FFF3A8', '#FFD700', '#FFA500', '#CC8400']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.crownPeakCenter}
            />
            <LinearGradient
              colors={['#FFF3A8', '#FFD700', '#FFA500', '#CC8400']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.crownPeakRight}
            />
            {/* Crown Base */}
            <View style={styles.crownBase} />
            {/* Crown Gem dots */}
            <View style={[styles.crownGem, { left: 1 }]} />
            <View style={[styles.crownGem, { left: 14 }]} />
            <View style={[styles.crownGem, { left: 27 }]} />
          </View>

          {/* 3D Embossed "GameLivo" Logo */}
          <View style={styles.logoRow}>
            {/* "Game" in Silver/Chrome 3D Metallic */}
            <Text style={styles.logoGameText}>Game</Text>

            {/* "Livo" in Radiant Glowing Gold */}
            <Text style={styles.logoLivoText}>Liv</Text>

            {/* Controller Icon inside the 'o' */}
            <View style={styles.controllerLetterO}>
              <Text style={styles.controllerLetterText}>o</Text>
              <View style={styles.controllerBadge}>
                <Text style={styles.controllerIconSymbol}>🎮</Text>
              </View>
            </View>
          </View>

          {/* Golden Curved Baseline Bar */}
          <View style={styles.goldenBaselineWrapper}>
            <LinearGradient
              colors={['transparent', '#FFD700', '#FFF3A8', '#FFD700', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.goldenBaseline}
            />
          </View>

          {/* Tagline: PLAY • CONNECT • WIN */}
          <View style={styles.taglineRow}>
            <Text style={styles.taglineWord}>PLAY</Text>
            <Text style={styles.taglineDot}>•</Text>
            <Text style={styles.taglineWord}>CONNECT</Text>
            <Text style={styles.taglineDot}>•</Text>
            <Text style={styles.taglineWord}>WIN</Text>
          </View>
        </View>

        {/* ─── Bottom Loading Progress Bar & Status ─── */}
        <View style={styles.loadingContainer}>
          {/* Progress Capsule Bar */}
          <View style={styles.progressBarWrapper}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]}>
              <LinearGradient
                colors={['#FFE259', '#FFA751', '#FF8008']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressGradient}
              >
                {/* Glowing Laser Scanline Shimmer */}
                <Animated.View
                  style={[
                    styles.shimmerBeam,
                    {
                      transform: [{ translateX: shimmerTranslate }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.8)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Dynamic Loading Subtitle */}
          <Text style={styles.loadingStatusText}>{loadingMessages[loadingTextIndex]}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSpotlight: {
    position: 'absolute',
    top: 0,
    // left: SCREEN_WIDTH * 0.1,
    // right: SCREEN_WIDTH * 0.1,
    height: SCREEN_HEIGHT * 0.55,
    borderBottomLeftRadius: SCREEN_WIDTH * 0.4,
    borderBottomRightRadius: SCREEN_WIDTH * 0.4,
    width: '100%'
  },
  ambientSuit: {
    position: 'absolute',
    color: '#8A6828',
    opacity: 0.35,
    textShadowColor: 'rgba(255, 215, 0, 0.25)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  miniDiceContainer: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  miniDiceGradient: {
    flex: 1,
    padding: 3,
    justifyContent: 'space-between',
  },
  miniDicePipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miniPip: {
    backgroundColor: '#1E293B',
    borderRadius: 99,
  },
  floorGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.28,
  },
  mainContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SCREEN_HEIGHT * 0.12,
    paddingBottom: SCREEN_HEIGHT * 0.08,
  },
  heroSection: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_WIDTH * 0.85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldAuraHalo: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.75,
    height: SCREEN_WIDTH * 0.75,
    borderRadius: SCREEN_WIDTH * 0.375,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraGradient: {
    width: '100%',
    height: '100%',
    borderRadius: SCREEN_WIDTH * 0.375,
  },
  lottieWrapper: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  lottieView: {
    width: '100%',
    height: '100%',
  },
  heroDiceContainer: {
    zIndex: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.65,
    shadowRadius: 20,
    elevation: 15,
  },
  dice3D: {
    width: SCREEN_WIDTH * 0.44,
    height: SCREEN_WIDTH * 0.44,
    borderRadius: SCREEN_WIDTH * 0.09,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFF3A8',
    overflow: 'hidden',
  },
  diceFace: {
    flex: 1,
    padding: SCREEN_WIDTH * 0.045,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diceGlint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    borderTopLeftRadius: SCREEN_WIDTH * 0.08,
    borderTopRightRadius: SCREEN_WIDTH * 0.08,
  },
  pipRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroPip: {
    width: SCREEN_WIDTH * 0.075,
    height: SCREEN_WIDTH * 0.075,
    borderRadius: SCREEN_WIDTH * 0.038,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  heroPipCenter: {
    width: SCREEN_WIDTH * 0.075,
    height: SCREEN_WIDTH * 0.075,
    borderRadius: SCREEN_WIDTH * 0.038,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  dice3DBevel: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '100%',
    height: 10,
  },
  foregroundOrbitRing: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.65,
    height: SCREEN_WIDTH * 0.65,
    borderRadius: SCREEN_WIDTH * 0.325,
    borderWidth: 3,
    borderColor: '#FFDF00',
    borderStyle: 'dashed',
    zIndex: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: -SCREEN_HEIGHT * 0.02,
  },
  crownContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 4,
    height: 24,
    width: 36,
  },
  crownPeakLeft: {
    width: 8,
    height: 16,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 2,
    transform: [{ rotate: '-20deg' }],
  },
  crownPeakCenter: {
    width: 10,
    height: 22,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    marginHorizontal: 1,
  },
  crownPeakRight: {
    width: 8,
    height: 16,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 4,
    transform: [{ rotate: '20deg' }],
  },
  crownBase: {
    position: 'absolute',
    bottom: 0,
    width: 34,
    height: 4,
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  crownGem: {
    position: 'absolute',
    bottom: 1,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGameText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#F1F5F9',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 6,
  },
  logoLivoText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFB800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 140, 0, 0.6)',
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 8,
  },
  controllerLetterO: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -2,
  },
  controllerLetterText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFB800',
    textShadowColor: 'rgba(255, 140, 0, 0.6)',
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 8,
  },
  controllerBadge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controllerIconSymbol: {
    fontSize: 14,
    color: '#000000',
    marginTop: 2,
  },
  goldenBaselineWrapper: {
    width: SCREEN_WIDTH * 0.7,
    height: 2,
    marginTop: 4,
    marginBottom: 8,
  },
  goldenBaseline: {
    flex: 1,
    borderRadius: 1,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taglineWord: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 3,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 0 },
  },
  taglineDot: {
    fontSize: 12,
    color: '#FFA500',
    marginHorizontal: 10,
  },
  loadingContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.12,
  },
  progressBarWrapper: {
    width: '100%',
    height: 7,
    backgroundColor: 'rgba(40, 25, 5, 0.8)',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
    borderRadius: 99,
  },
  shimmerBeam: {
    width: 60,
    height: '100%',
  },
  shimmerGradient: {
    width: '100%',
    height: '100%',
  },
  loadingStatusText: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '500',
    marginTop: 12,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
});

export default SplashScreen;
