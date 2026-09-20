import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface LudoActionVFXProps {
  actionText: string;
  actionType?: 'roll' | 'move' | 'capture' | 'home' | 'bonus' | 'penalty_three_sixes';
}

export const LudoActionVFX: React.FC<LudoActionVFXProps> = ({
  actionText,
  actionType,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (actionText) {
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1200),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [actionText]);

  if (!actionText) return null;

  const getGradientColors = (): [string, string] => {
    switch (actionType) {
      case 'capture':
        return ['#E74C3C', '#922B21'];
      case 'home':
        return ['#F1C40F', '#D4AC0D'];
      case 'bonus':
        return ['#2ECC71', '#1E8449'];
      case 'penalty_three_sixes':
        return ['#C0392B', '#781515'];
      default:
        return ['#3498DB', '#1F618D'];
    }
  };

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.vfxContainer,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.vfxBanner}
      >
        <Text style={styles.vfxText}>{actionText}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  vfxContainer: {
    position: 'absolute',
    top: '42%',
    alignSelf: 'center',
    zIndex: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 15,
  },
  vfxBanner: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  vfxText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

export default LudoActionVFX;
