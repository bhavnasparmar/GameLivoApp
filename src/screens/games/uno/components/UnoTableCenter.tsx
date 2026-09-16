import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { UnoActiveColor, UnoCard } from '../../../../gameEngine/uno/unoTypes';
import { UNO_COLOR_THEMES } from '../../../../gameEngine/uno/unoConstants';
import UnoCardView from './UnoCardView';

interface UnoTableCenterProps {
  topCard: UnoCard;
  activeColor: UnoActiveColor;
  deckCount: number;
  direction: 1 | -1;
  isMyTurn: boolean;
  isDrawPhase: boolean;
  canPass: boolean;
  onDrawCard: () => void;
  onPassTurn: () => void;
  disabled?: boolean;
}

export const UnoTableCenter: React.FC<UnoTableCenterProps> = ({
  topCard,
  activeColor,
  deckCount,
  direction,
  isMyTurn,
  isDrawPhase,
  canPass,
  onDrawCard,
  onPassTurn,
  disabled = false,
}) => {
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const pulseAuraAnim = useRef(new Animated.Value(1)).current;

  // Orbit rotation animation
  useEffect(() => {
    let anim: Animated.CompositeAnimation;
    if (direction === 1) {
      anim = Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 12000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
    } else {
      anim = Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: -1,
          duration: 12000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
    }
    anim.start();
    return () => anim.stop();
  }, [direction]);

  // Active color aura pulse
  useEffect(() => {
    const aura = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAuraAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAuraAnim, {
          toValue: 1.0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    aura.start();
    return () => aura.stop();
  }, [activeColor]);

  const spinInterpolation = rotationAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-360deg', '0deg', '360deg'],
  });

  const activeTheme = UNO_COLOR_THEMES[activeColor] || UNO_COLOR_THEMES.red;

  return (
    <View style={styles.container}>
      {/* Dynamic Active Color Orbit Aura */}
      <Animated.View
        style={[
          styles.orbitAura,
          {
            borderColor: activeTheme.border,
            shadowColor: activeTheme.glow,
            transform: [{ scale: pulseAuraAnim }],
          },
        ]}
      />

      {/* Rotating Direction Arrows Ring */}
      <Animated.View
        style={[
          styles.orbitArrowsRing,
          { transform: [{ rotate: spinInterpolation }] },
        ]}
      >
        <Text style={[styles.orbitArrowText, { color: activeTheme.border }]}>▲</Text>
        <Text style={[styles.orbitArrowText, { color: activeTheme.border }]}>▼</Text>
      </Animated.View>

      {/* Center Table Content: Draw Deck & Discard Pile */}
      <View style={styles.pilesRow}>
        {/* Draw Deck with 3D depth */}
        <View style={styles.deckContainer}>
          {/* Faux stack layers */}
          <View style={[styles.deckStackLayer, styles.deckLayer3]} />
          <View style={[styles.deckStackLayer, styles.deckLayer2]} />
          <View style={[styles.deckStackLayer, styles.deckLayer1]} />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onDrawCard}
            disabled={!isMyTurn || isDrawPhase || disabled}
            style={[
              styles.deckTopCard,
              isMyTurn && !isDrawPhase && styles.deckTouchableGlow,
            ]}
          >
            <UnoCardView isBack size="center" />
            <View style={styles.deckCountBadge}>
              <Text style={styles.deckCountText}>{deckCount}</Text>
            </View>
          </TouchableOpacity>

          {isMyTurn && !isDrawPhase && (
            <View style={styles.drawPromptBubble}>
              <Text style={styles.drawPromptText}>TAP TO DRAW</Text>
            </View>
          )}
        </View>

        {/* Center Discard Pile */}
        <View style={styles.discardContainer}>
          {/* Faux previous card with slight angle */}
          <View style={[styles.underneathCard, { transform: [{ rotate: '-12deg' }] }]}>
            <LinearGradient
              colors={['#333', '#111']}
              style={styles.underneathCardInner}
            />
          </View>
          <View style={[styles.underneathCard, { transform: [{ rotate: '8deg' }] }]}>
            <LinearGradient
              colors={['#444', '#222']}
              style={styles.underneathCardInner}
            />
          </View>

          {/* Current Top Card */}
          <View style={styles.topCardWrapper}>
            <UnoCardView card={topCard} size="center" />
          </View>

          {/* Active Color Indicator Capsule */}
          <View
            style={[
              styles.activeColorCapsule,
              { backgroundColor: activeTheme.primary, borderColor: activeTheme.border },
            ]}
          >
            <Text style={styles.activeColorText}>
              COLOR: {activeColor.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Pass Turn Action (Visible only when player just drew a card) */}
      {isMyTurn && isDrawPhase && (
        <View style={styles.drawPhaseActionsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.passBtn}
            onPress={onPassTurn}
            disabled={disabled}
          >
            <LinearGradient
              colors={['#E67E22', '#D35400']}
              style={styles.passBtnGradient}
            >
              <Text style={styles.passBtnText}>PASS TURN ⏩</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  orbitAura: {
    position: 'absolute',
    width: 250,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  orbitArrowsRing: {
    position: 'absolute',
    width: 260,
    height: 190,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  orbitArrowText: {
    fontSize: 16,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  pilesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    zIndex: 10,
  },
  deckContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckStackLayer: {
    position: 'absolute',
    width: 86,
    height: 130,
    borderRadius: 12,
    backgroundColor: '#0B0F12',
    borderWidth: 1,
    borderColor: '#34495E',
  },
  deckLayer3: {
    top: 6,
    left: 6,
  },
  deckLayer2: {
    top: 4,
    left: 4,
  },
  deckLayer1: {
    top: 2,
    left: 2,
  },
  deckTopCard: {
    zIndex: 5,
  },
  deckTouchableGlow: {
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },
  deckCountBadge: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1C40F',
  },
  deckCountText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F1C40F',
  },
  drawPromptBubble: {
    position: 'absolute',
    top: -24,
    backgroundColor: '#2ECC71',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  drawPromptText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0A2E16',
    letterSpacing: 0.5,
  },
  discardContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  underneathCard: {
    position: 'absolute',
    width: 86,
    height: 130,
    borderRadius: 12,
  },
  underneathCardInner: {
    flex: 1,
    borderRadius: 12,
  },
  topCardWrapper: {
    zIndex: 5,
  },
  activeColorCapsule: {
    position: 'absolute',
    bottom: -16,
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    zIndex: 15,
  },
  activeColorText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  drawPhaseActionsRow: {
    marginTop: 18,
    zIndex: 20,
  },
  passBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#E67E22',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  passBtnGradient: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default UnoTableCenter;
