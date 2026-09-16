import React, { useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface UnoShoutButtonProps {
  onPress: () => void;
  hasCalledUno: boolean;
  disabled?: boolean;
}

export const UnoShoutButton: React.FC<UnoShoutButtonProps> = ({
  onPress,
  hasCalledUno,
  disabled = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAura = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!hasCalledUno && !disabled) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      scaleAnim.setValue(1);
    }
  }, [hasCalledUno, disabled]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={hasCalledUno || disabled}
        style={[
          styles.touchable,
          hasCalledUno && styles.calledTouchable,
        ]}
      >
        <LinearGradient
          colors={
            hasCalledUno
              ? ['#2ECC71', '#1B8A4C']
              : ['#FF4757', '#FF6B81', '#E74C3C']
          }
          style={styles.gradient}
        >
          <Text style={styles.unoText}>
            {hasCalledUno ? '✓ UNO!' : 'UNO! 🔥'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 8,
  },
  touchable: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  calledTouchable: {
    borderColor: '#2ECC71',
    opacity: 0.9,
  },
  gradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 84,
  },
  unoText: {
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default UnoShoutButton;
