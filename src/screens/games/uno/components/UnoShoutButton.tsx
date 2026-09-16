import React, { useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  View,
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

  useEffect(() => {
    if (!hasCalledUno && !disabled) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.06,
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
        style={styles.touchable}
      >
        <LinearGradient
          colors={
            hasCalledUno
              ? ['#2ECC71', '#27AE60']
              : ['#FF3B30', '#E02424', '#B91C1C']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradientPill}
        >
          {/* Top subtle highlight reflection */}
          <View style={styles.topGlossHighlight} />
          
          <Text style={styles.unoText}>
            {hasCalledUno ? '✓ UNO!' : 'UNO!'}
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
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  touchable: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  gradientPill: {
    paddingHorizontal: 38,
    paddingVertical: 12,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    position: 'relative',
  },
  topGlossHighlight: {
    position: 'absolute',
    top: 2,
    left: '15%',
    right: '15%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 4,
  },
  unoText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
});

export default UnoShoutButton;
