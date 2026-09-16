import React, { useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface UnoActionVFXOverlayProps {
  actionText?: string;
  visible: boolean;
}

export const UnoActionVFXOverlay: React.FC<UnoActionVFXOverlayProps> = ({
  actionText,
  visible,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && actionText) {
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, actionText]);

  if (!visible || !actionText) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.overlay,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(15, 23, 19, 0.95)', 'rgba(5, 10, 8, 0.98)']}
        style={styles.bannerContainer}
      >
        <Text style={styles.actionBannerText}>{actionText}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: '32%',
    alignSelf: 'center',
    zIndex: 100,
    shadowColor: '#F1C40F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 12,
  },
  bannerContainer: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F1C40F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBannerText: {
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
  },
});

export default UnoActionVFXOverlay;
