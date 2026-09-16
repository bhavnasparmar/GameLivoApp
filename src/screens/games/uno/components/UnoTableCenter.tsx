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
  const pulseDrawAnim = useRef(new Animated.Value(1)).current;
  const cardLandAnim = useRef(new Animated.Value(1)).current;

  // Impact bounce when a new top card lands
  useEffect(() => {
    cardLandAnim.setValue(1.15);
    Animated.spring(cardLandAnim, {
      toValue: 1,
      friction: 4,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [topCard.id, topCard.color, topCard.value]);

  // Turn direction continuous rotation loop
  useEffect(() => {
    const toValue = direction === 1 ? 1 : -1;
    const anim = Animated.loop(
      Animated.timing(rotationAnim, {
        toValue,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [direction]);

  // Pulse draw deck when it's player's turn to draw
  useEffect(() => {
    if (isMyTurn && !isDrawPhase) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseDrawAnim, {
            toValue: 1.05,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseDrawAnim, {
            toValue: 1.0,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseDrawAnim.setValue(1);
    }
  }, [isMyTurn, isDrawPhase]);

  const spinInterpolation = rotationAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-360deg', '0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Central Curved Turn Direction Orbit Arrows */}
      <Animated.View
        style={[
          styles.orbitArrowsContainer,
          { transform: [{ rotate: spinInterpolation }] },
        ]}
      >
        <View style={styles.topArrowWrap}>
          <Text style={styles.curvedArrowGlyph}>⤹</Text>
        </View>
        <View style={styles.bottomArrowWrap}>
          <Text style={styles.curvedArrowGlyph}>⤸</Text>
        </View>
      </Animated.View>

      {/* Piles Row: Draw Deck & Discard Pile */}
      <View style={styles.pilesRow}>
        {/* ─── 1. DRAW DECK ─── */}
        <View style={styles.pileColumn}>
          <Animated.View
            style={[
              styles.deckStackWrapper,
              { transform: [{ scale: pulseDrawAnim }] },
            ]}
          >
            {/* 3D Physical White Edge Stack Layers */}
            <View style={[styles.deckStackLayer, styles.deckLayer3]} />
            <View style={[styles.deckStackLayer, styles.deckLayer2]} />
            <View style={[styles.deckStackLayer, styles.deckLayer1]} />

            <TouchableOpacity
              activeOpacity={0.82}
              onPress={onDrawCard}
              disabled={!isMyTurn || isDrawPhase || disabled}
              style={[
                styles.drawDeckTouchable,
                isMyTurn && !isDrawPhase && styles.drawDeckPlayableGlow,
              ]}
            >
              <UnoCardView isBack size="center" />
            </TouchableOpacity>
          </Animated.View>

          {/* Draw Label */}
          <Text style={styles.pileLabelText}>Draw ({deckCount})</Text>
        </View>

        {/* ─── 2. DISCARD PILE ─── */}
        <View style={styles.pileColumn}>
          <View style={styles.discardStackWrapper}>
            <View style={[styles.discardStackLayer, styles.discardLayer2]} />
            <View style={[styles.discardStackLayer, styles.discardLayer1]} />

            <Animated.View
              style={[
                styles.discardCardWrapper,
                { transform: [{ scale: cardLandAnim }] },
              ]}
            >
              <UnoCardView card={topCard} size="center" isPlayable={false} />
            </Animated.View>
          </View>

          {/* Discard Label */}
          <Text style={styles.pileLabelText}>Discard</Text>
        </View>
      </View>

      {/* Pass Turn Button */}
      {canPass && isMyTurn && (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.passTurnBtn}
          onPress={onPassTurn}
        >
          <LinearGradient
            colors={['#E67E22', '#D35400']}
            style={styles.passBtnGradient}
          >
            <Text style={styles.passBtnText}>PASS ⏩</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 110,
    width: '100%',
  },
  orbitArrowsContainer: {
    position: 'absolute',
    width: 160,
    height: 120,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
    pointerEvents: 'none',
  },
  topArrowWrap: {
    transform: [{ rotate: '0deg' }],
  },
  bottomArrowWrap: {
    transform: [{ rotate: '180deg' }],
  },
  curvedArrowGlyph: {
    fontSize: 22,
    color: 'rgba(254, 225, 64, 0.4)',
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pilesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 12,
    zIndex: 5,
  },
  pileColumn: {
    alignItems: 'center',
  },
  deckStackWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 6,
  },
  deckStackLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BDC3C7',
  },
  deckLayer1: {
    top: 2,
    left: 0,
    backgroundColor: '#FAFAFA',
  },
  deckLayer2: {
    top: 4,
    left: 0,
    backgroundColor: '#F0F0F0',
  },
  deckLayer3: {
    top: 6,
    left: 0,
    backgroundColor: '#E4E7EB',
  },
  drawDeckTouchable: {
    borderRadius: 8,
  },
  drawDeckPlayableGlow: {
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
  discardStackWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 6,
  },
  discardStackLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  discardLayer1: {
    top: 2,
    left: -1,
    transform: [{ rotate: '-2deg' }],
  },
  discardLayer2: {
    top: 4,
    left: 1,
    transform: [{ rotate: '2deg' }],
  },
  discardCardWrapper: {
    zIndex: 10,
  },
  pileLabelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D8CBC4',
    marginTop: 4,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  passTurnBtn: {
    marginTop: 6,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#E67E22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 12,
  },
  passBtnGradient: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  passBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

export default UnoTableCenter;
