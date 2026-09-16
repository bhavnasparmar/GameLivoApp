import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
  Image,
} from 'react-native';
import { IMAGES } from '../../../assets/images';

export interface AnimatedLogoProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
  minScale?: number;
  maxScale?: number;
  pulseDuration?: number;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({
  size = 110,
  style,
  minScale = 0.94,
  maxScale = 1.08,
  pulseDuration = 1600,
}) => {
  // Entrance fade animation
  const entranceOpacity = useRef(new Animated.Value(0)).current;

  // Continuous looping size increase & decrease animation
  const scaleAnim = useRef(new Animated.Value(minScale)).current;

  useEffect(() => {
    // 1. Entrance Fade In
    Animated.timing(entranceOpacity, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // 2. Continuous Size Increase & Decrease (Pulse Transition)
    const scaleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: maxScale,
          duration: pulseDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: minScale,
          duration: pulseDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    scaleLoop.start();

    return () => {
      scaleLoop.stop();
    };
  }, [entranceOpacity, scaleAnim, minScale, maxScale, pulseDuration]);

  return (
    <Animated.View
      style={[
        styles.logoContainer,
        {
          width: size,
          height: size,
          opacity: entranceOpacity,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      <Image
        source={IMAGES.logoWithoutBg}
        style={styles.logoImage}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
});

export default AnimatedLogo;
