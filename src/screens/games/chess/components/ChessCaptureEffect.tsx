import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface ChessCaptureEffectProps {
  squareSize: number;
  onComplete?: () => void;
}

const NUM_PARTICLES = 8;

export const ChessCaptureEffect: React.FC<ChessCaptureEffectProps> = React.memo(
  ({ squareSize, onComplete }) => {
    // Shockwave ring animation
    const ringScale = useRef(new Animated.Value(0.2)).current;
    const ringOpacity = useRef(new Animated.Value(1)).current;

    // Second outer shockwave ring
    const ring2Scale = useRef(new Animated.Value(0.1)).current;
    const ring2Opacity = useRef(new Animated.Value(0.8)).current;

    // Center impact burst flash
    const flashScale = useRef(new Animated.Value(0.3)).current;
    const flashOpacity = useRef(new Animated.Value(1)).current;
    const flashRotate = useRef(new Animated.Value(0)).current;

    // 8 radial kinetic sparks
    const particleProgress = useRef(new Animated.Value(0)).current;
    const particleOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      // 1. Shockwave rings expansion & fade
      const ringAnim = Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 2.1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]);

      const ring2Anim = Animated.sequence([
        Animated.delay(40),
        Animated.parallel([
          Animated.timing(ring2Scale, {
            toValue: 2.5,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ring2Opacity, {
            toValue: 0,
            duration: 420,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]);

      // 2. Central impact star flash
      const flashAnim = Animated.parallel([
        Animated.sequence([
          Animated.timing(flashScale, {
            toValue: 1.4,
            duration: 90,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(flashScale, {
            toValue: 0.1,
            duration: 200,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(flashRotate, {
          toValue: 1,
          duration: 290,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 290,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]);

      // 3. Kinetic particle spark explosion
      const particleAnim = Animated.parallel([
        Animated.timing(particleProgress, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(120),
          Animated.timing(particleOpacity, {
            toValue: 0,
            duration: 240,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]);

      Animated.parallel([ringAnim, ring2Anim, flashAnim, particleAnim]).start(() => {
        if (onComplete) {
          onComplete();
        }
      });
    }, [
      ringScale,
      ringOpacity,
      ring2Scale,
      ring2Opacity,
      flashScale,
      flashOpacity,
      flashRotate,
      particleProgress,
      particleOpacity,
      onComplete,
    ]);

    const spinInterpolate = flashRotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '90deg'],
    });

    const sparkColors = [
      '#FFD700', // Gold
      '#FF4500', // Orange Red
      '#FFA500', // Orange
      '#FF6347', // Tomato
      '#FFE066', // Bright Yellow
      '#FF3366', // Crimson Pink
      '#FF9F43', // Amber
      '#FF5252', // Red
    ];

    const burstRadius = squareSize * 0.65;

    return (
      <View pointerEvents="none" style={styles.container}>
        {/* Outer Crimson Shockwave Ring */}
        <Animated.View
          style={[
            styles.shockwaveRing,
            {
              width: squareSize * 0.85,
              height: squareSize * 0.85,
              borderRadius: (squareSize * 0.85) / 2,
              borderColor: '#FF4444',
              borderWidth: 3,
              transform: [{ scale: ringScale }],
              opacity: ringOpacity,
            },
          ]}
        />

        {/* Secondary Golden Shockwave Ring */}
        <Animated.View
          style={[
            styles.shockwaveRing,
            {
              width: squareSize * 0.7,
              height: squareSize * 0.7,
              borderRadius: (squareSize * 0.7) / 2,
              borderColor: '#FFD700',
              borderWidth: 2,
              transform: [{ scale: ring2Scale }],
              opacity: ring2Opacity,
            },
          ]}
        />

        {/* Central Impact Star Flash */}
        <Animated.View
          style={[
            styles.impactFlash,
            {
              width: squareSize * 0.7,
              height: squareSize * 0.7,
              transform: [{ scale: flashScale }, { rotate: spinInterpolate }],
              opacity: flashOpacity,
            },
          ]}
        >
          {/* Vertical Beam */}
          <View style={[styles.flashBeam, { width: 4, height: squareSize * 0.7 }]} />
          {/* Horizontal Beam */}
          <View style={[styles.flashBeam, { width: squareSize * 0.7, height: 4 }]} />
          {/* Center Glow Core */}
          <View
            style={[
              styles.flashCore,
              {
                width: squareSize * 0.35,
                height: squareSize * 0.35,
                borderRadius: (squareSize * 0.35) / 2,
              },
            ]}
          />
        </Animated.View>

        {/* 8 Radial Exploding Sparks */}
        {Array.from({ length: NUM_PARTICLES }).map((_, index) => {
          const angle = (index * (2 * Math.PI)) / NUM_PARTICLES;
          const targetX = Math.cos(angle) * burstRadius;
          const targetY = Math.sin(angle) * burstRadius;
          const color = sparkColors[index % sparkColors.length];
          const particleSize = index % 2 === 0 ? 6 : 4;

          const transX = particleProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, targetX],
          });

          const transY = particleProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, targetY],
          });

          const particleScale = particleProgress.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [0.3, 1.4, 0.4],
          });

          return (
            <Animated.View
              key={`spark_${index}`}
              style={[
                styles.particle,
                {
                  width: particleSize,
                  height: particleSize,
                  borderRadius: particleSize / 2,
                  backgroundColor: color,
                  shadowColor: color,
                  transform: [
                    { translateX: transX },
                    { translateY: transY },
                    { scale: particleScale },
                  ],
                  opacity: particleOpacity,
                },
              ]}
            />
          );
        })}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 35,
  },
  shockwaveRing: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  impactFlash: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashBeam: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  flashCore: {
    position: 'absolute',
    backgroundColor: '#FFE600',
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  particle: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default ChessCaptureEffect;
