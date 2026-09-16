import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  StatusBar,
  Image,
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
import { IMAGES } from '../../assets/images';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Floating Star Particle ──────────────────────────────────────────────────
const FloatingStar: React.FC<{
  size: number;
  top: number;
  left?: number;
  right?: number;
  delay?: number;
}> = ({ size, top, left, right, delay = 0 }) => {
  const twinkleAnim = useRef(new Animated.Value(0.3)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const twinkle = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(twinkleAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(twinkleAnim, {
          toValue: 0.25,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const float = Animated.loop(
      Animated.sequence([
        Animated.delay(delay * 0.5),
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 6,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    twinkle.start();
    float.start();

    return () => {
      twinkle.stop();
      float.stop();
    };
  }, [delay, twinkleAnim, floatAnim]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.starParticle,
        {
          top,
          ...(left !== undefined ? { left } : {}),
          ...(right !== undefined ? { right } : {}),
          opacity: twinkleAnim,
          transform: [{ translateY: floatAnim }],
        },
      ]}
    >
      <Text style={{ fontSize: size, color: '#FFDF00', textShadowColor: '#FFA500', textShadowRadius: 8 }}>
        ✦
      </Text>
    </Animated.View>
  );
};

// ─── Ambient Poker Suit Symbol ───────────────────────────────────────────────
const AmbientSuit: React.FC<{
  symbol: string;
  top: number;
  left?: number;
  right?: number;
  size: number;
  rotate: string;
  opacity?: number;
}> = ({ symbol, top, left, right, size, rotate, opacity = 0.2 }) => (
  <Text
    pointerEvents="none"
    style={[
      styles.ambientSuitText,
      {
        top,
        ...(left !== undefined ? { left } : {}),
        ...(right !== undefined ? { right } : {}),
        fontSize: size,
        opacity,
        transform: [{ rotate }],
      },
    ]}
  >
    {symbol}
  </Text>
);

// ─── Main Animated Splash Screen ─────────────────────────────────────────────
const SplashScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const { checkAuth } = useAuth();

  const heroSize = Math.min(SCREEN_WIDTH * 0.88, 380);
  const shineDistance = heroSize * 0.85;

  // Animations
  const logoScaleAnim = useRef(new Animated.Value(0.6)).current;
  const logoFadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowPulseAnim = useRef(new Animated.Value(0.85)).current;
  const shineTranslateAnim = useRef(new Animated.Value(-shineDistance)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const shimmerTranslateAnim = useRef(new Animated.Value(-80)).current;
  const bottomFadeAnim = useRef(new Animated.Value(0)).current;
  const exitFadeAnim = useRef(new Animated.Value(1)).current;

  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  const loadingMessages = [
    'Connecting to Real-time Arena...',
    'Loading Chess, Ludo & Uno...',
    'Preparing High Stakes Tables...',
    'Welcome to GameLivo!',
  ];

  useEffect(() => {
    // 1. Entrance Spring for Hero Logo
    Animated.parallel([
      Animated.timing(logoFadeAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        friction: 5.5,
        tension: 42,
        useNativeDriver: true,
      }),
      Animated.timing(bottomFadeAnim, {
        toValue: 1,
        duration: 900,
        delay: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Continuous Hero Logo Floating Levitation
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -9,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 5,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();

    // 3. Golden Ambient Glow Pulsing Halo
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulseAnim, {
          toValue: 1.15,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulseAnim, {
          toValue: 0.85,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    // 4. Specular Glint Sweep across Logo (Slow & Dynamic Scaling)
    const shineLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(shineTranslateAnim, {
          toValue: shineDistance,
          duration: 2200, // Smooth & slow pace
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(shineTranslateAnim, {
          toValue: -shineDistance,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(1400),
      ])
    );
    shineLoop.start();

    // 5. Loading Bar Progress Fill
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2800,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: false,
    }).start();

    // 6. Progress Shimmer Light Beam
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerTranslateAnim, {
        toValue: SCREEN_WIDTH * 0.75,
        duration: 1300,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    shimmerLoop.start();

    // 7. Cycle Loading Text
    const textInterval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1 < loadingMessages.length ? prev + 1 : prev));
    }, 700);

    // Check session early in background during splash animations
    const checkAuthPromise = checkAuth();

    // 8. Navigation transition on complete
    const navTimer = setTimeout(async () => {
      clearInterval(textInterval);

      const isAuthValid = await checkAuthPromise;

      // Smooth exit fade
      Animated.timing(exitFadeAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        if (isAuthValid || isLoggedIn) {
          navigation.replace(ROUTES.MAIN as 'Main');
        } else {
          navigation.replace(ROUTES.AUTH as 'Auth');
        }
      });
    }, 3000);

    return () => {
      floatLoop.stop();
      glowLoop.stop();
      shineLoop.stop();
      shimmerLoop.stop();
      clearInterval(textInterval);
      clearTimeout(navTimer);
    };
  }, [navigation, isLoggedIn, checkAuth, shineDistance]);

  const shineScaleY = shineTranslateAnim.interpolate({
    inputRange: [
      -shineDistance,
      -shineDistance * 0.48,
      0,
      shineDistance * 0.48,
      shineDistance,
    ],
    outputRange: [0.08, 0.45, 1.15, 0.45, 0.08],
    extrapolate: 'clamp',
  });

  const shineScaleX = shineTranslateAnim.interpolate({
    inputRange: [
      -shineDistance,
      -shineDistance * 0.48,
      0,
      shineDistance * 0.48,
      shineDistance,
    ],
    outputRange: [0.35, 0.7, 1.1, 0.7, 0.35],
    extrapolate: 'clamp',
  });

  const shineOpacity = shineTranslateAnim.interpolate({
    inputRange: [
      -shineDistance,
      -shineDistance * 0.55,
      0,
      shineDistance * 0.55,
      shineDistance,
    ],
    outputRange: [0, 0.75, 1, 0.75, 0],
    extrapolate: 'clamp',
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: exitFadeAnim }]}>
      <StatusBar barStyle="light-content" />

      {/* ─── Luxury Emerald Casino Gradient Background ─── */}
      <LinearGradient
        colors={['#062F1E', '#032014', '#02160E', '#000C07']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Warm Spotlight Radial Cone */}
      <LinearGradient
        colors={['rgba(212, 168, 48, 0.28)', 'rgba(30, 130, 76, 0.15)', 'transparent']}
        style={styles.topSpotlight}
      />

      {/* Ambient Poker Suits & Casino Accents */}
      <AmbientSuit symbol="♠" top={SCREEN_HEIGHT * 0.1} right={SCREEN_WIDTH * 0.14} size={34} rotate="15deg" opacity={0.22} />
      <AmbientSuit symbol="♣" top={SCREEN_HEIGHT * 0.23} left={SCREEN_WIDTH * 0.08} size={28} rotate="-18deg" opacity={0.18} />
      <AmbientSuit symbol="♦" top={SCREEN_HEIGHT * 0.42} left={SCREEN_WIDTH * 0.07} size={26} rotate="22deg" opacity={0.25} />
      <AmbientSuit symbol="♥" top={SCREEN_HEIGHT * 0.39} right={SCREEN_WIDTH * 0.09} size={28} rotate="-12deg" opacity={0.22} />
      <AmbientSuit symbol="♠" top={SCREEN_HEIGHT * 0.65} left={SCREEN_WIDTH * 0.12} size={30} rotate="8deg" opacity={0.16} />
      <AmbientSuit symbol="♦" top={SCREEN_HEIGHT * 0.68} right={SCREEN_WIDTH * 0.11} size={26} rotate="-16deg" opacity={0.2} />

      {/* Floating Golden Twinkling Stars */}
      <FloatingStar size={26} top={SCREEN_HEIGHT * 0.14} left={SCREEN_WIDTH * 0.16} delay={0} />
      <FloatingStar size={20} top={SCREEN_HEIGHT * 0.28} right={SCREEN_WIDTH * 0.12} delay={500} />
      <FloatingStar size={18} top={SCREEN_HEIGHT * 0.46} left={SCREEN_WIDTH * 0.11} delay={900} />
      <FloatingStar size={24} top={SCREEN_HEIGHT * 0.18} right={SCREEN_WIDTH * 0.3} delay={300} />
      <FloatingStar size={20} top={SCREEN_HEIGHT * 0.52} right={SCREEN_WIDTH * 0.16} delay={700} />

      {/* Bottom Golden Warm Floor Reflection */}
      <LinearGradient
        colors={['transparent', 'rgba(212, 168, 48, 0.06)', 'rgba(255, 179, 0, 0.16)', 'transparent']}
        style={styles.floorGlow}
      />

      {/* ─── Main Content Container ─── */}
      <View style={styles.contentContainer}>
        {/* ─── Centerpiece Hero Area ─── */}
        <View style={styles.heroWrapper}>
          {/* Pulsing Golden Aura Radial Glow */}
          <Animated.View
            style={[
              styles.auraHalo,
              {
                transform: [{ scale: glowPulseAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(255, 215, 0, 0.55)', 'rgba(255, 165, 0, 0.22)', 'transparent']}
              style={styles.auraGradient}
            />
          </Animated.View>

          {/* Lottie Swirling Golden Energy Vortex */}
          <View style={styles.lottieContainer} pointerEvents="none">
            <LottieView
              source={LOTTIE_ANIMATIONS.splashGoldenVortex}
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
          </View>

          {/* Animated Hero Logo with Chess Knight, Dice, Ludo, Uno & 3D Title */}
          <Animated.View
            style={[
              styles.heroLogoContainer,
              {
                width: heroSize,
                height: heroSize,
                opacity: logoFadeAnim,
                transform: [
                  { scale: logoScaleAnim },
                  { translateY: floatAnim },
                ],
              },
            ]}
          >
            {/* The Main High-Res Transparent GameLivo Artwork */}
            <Image
              source={IMAGES.logoWithoutBg}
              style={styles.heroLogoImage}
              resizeMode="contain"
            />

            {/* Radiant Specular Glint Sweep Beam */}
            <View style={styles.glintClipWrapper} pointerEvents="none">
              <Animated.View
                style={[
                  styles.glintBeam,
                  {
                    opacity: shineOpacity,
                    transform: [
                      { translateX: shineTranslateAnim },
                      { rotate: '28deg' },
                      { scaleY: shineScaleY },
                      { scaleX: shineScaleX },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={[
                    'transparent',
                    'rgba(255, 215, 0, 0.03)',
                    'rgba(255, 235, 120, 0.10)',
                    'rgba(255, 255, 255, 0.22)',
                    'rgba(255, 220, 90, 0.10)',
                    'rgba(255, 180, 0, 0.03)',
                    'transparent',
                  ]}
                  locations={[0, 0.18, 0.38, 0.5, 0.62, 0.82, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.glintGradient}
                />
              </Animated.View>
            </View>
          </Animated.View>
        </View>

        {/* ─── Bottom Section: Tagline & Progress Bar ─── */}
        <Animated.View
          style={[
            styles.bottomSection,
            {
              opacity: bottomFadeAnim,
            },
          ]}
        >
          {/* Golden Gaming Platform Badge */}
          <View style={styles.taglinePillBadge}>
            <LinearGradient
              colors={['rgba(255, 215, 0, 0.18)', 'rgba(30, 80, 50, 0.45)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.taglinePillGradient}
            >
              <Text style={styles.taglinePillText}>LUDO • CHESS • UNO • CARDS</Text>
            </LinearGradient>
          </View>

          {/* Subtitle Play • Connect • Win */}
          <Text style={styles.subtitleMotto}>PLAY • CONNECT • WIN</Text>

          {/* Luxury Capsule Loading Bar */}
          <View style={styles.loadingBarContainer}>
            <View style={styles.loadingBarTrack}>
              <Animated.View style={[styles.loadingBarFill, { width: progressWidth }]}>
                <LinearGradient
                  colors={['#FFF176', '#FFB300', '#FF8F00', '#E65100']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loadingBarGradient}
                >
                  {/* Laser Scanline Shimmer */}
                  <Animated.View
                    style={[
                      styles.shimmerBeam,
                      {
                        transform: [{ translateX: shimmerTranslateAnim }],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.85)', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </LinearGradient>
              </Animated.View>
            </View>
          </View>

          {/* Dynamic Loading Status Text */}
          <Text style={styles.loadingStatusText}>
            {loadingMessages[loadingTextIndex]}
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02150D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSpotlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.55,
    borderBottomLeftRadius: SCREEN_WIDTH * 0.5,
    borderBottomRightRadius: SCREEN_WIDTH * 0.5,
  },
  ambientSuitText: {
    position: 'absolute',
    color: '#E5B842',
    textShadowColor: 'rgba(255, 215, 0, 0.4)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  starParticle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floorGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.3,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SCREEN_HEIGHT * 0.1,
    paddingBottom: SCREEN_HEIGHT * 0.07,
  },
  heroWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraHalo: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_WIDTH * 0.85,
    borderRadius: (SCREEN_WIDTH * 0.85) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraGradient: {
    width: '100%',
    height: '100%',
    borderRadius: (SCREEN_WIDTH * 0.85) / 2,
  },
  lottieContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.95,
    height: SCREEN_WIDTH * 0.95,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  heroLogoContainer: {
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 20,
  },
  heroLogoImage: {
    width: '100%',
    height: '100%',
  },
  glintClipWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: 24,
  },
  glintBeam: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 85,
    alignSelf: 'center',
  },
  glintGradient: {
    flex: 1,
    width: '100%',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.1,
  },
  taglinePillBadge: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.45)',
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  taglinePillGradient: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  taglinePillText: {
    color: '#FFF2A8',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitleMotto: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 3.5,
    marginBottom: 20,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  loadingBarContainer: {
    width: '100%',
    paddingHorizontal: 10,
  },
  loadingBarTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(3, 30, 18, 0.85)',
    borderRadius: 99,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 215, 0, 0.45)',
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  loadingBarFill: {
    height: '100%',
    borderRadius: 99,
    overflow: 'hidden',
  },
  loadingBarGradient: {
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
    fontSize: 12.5,
    color: '#D1FAE5',
    fontWeight: '600',
    marginTop: 12,
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowRadius: 5,
    textShadowOffset: { width: 0, height: 1 },
  },
});

export default SplashScreen;
