import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { UnoActiveColor, UnoCard } from '../../../../gameEngine/uno/unoTypes';
import {
  UNO_COLOR_THEMES,
  UNO_VALUE_GLYPHS,
  UNO_WILD_THEME,
} from '../../../../gameEngine/uno/unoConstants';

export type UnoCardSize = 'tiny' | 'small' | 'medium' | 'large' | 'hand' | 'center';

interface UnoCardViewProps {
  card?: UnoCard;
  isBack?: boolean;
  size?: UnoCardSize;
  isPlayable?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
}

const SIZE_CONFIGS: Record<
  UnoCardSize,
  { width: number; height: number; radius: number; fontMain: number; fontCorner: number; ovalW: number; ovalH: number }
> = {
  tiny: { width: 32, height: 48, radius: 4, fontMain: 14, fontCorner: 8, ovalW: 24, ovalH: 38 },
  small: { width: 44, height: 66, radius: 6, fontMain: 18, fontCorner: 9, ovalW: 34, ovalH: 52 },
  medium: { width: 56, height: 84, radius: 8, fontMain: 24, fontCorner: 11, ovalW: 44, ovalH: 68 },
  hand: { width: 68, height: 104, radius: 10, fontMain: 30, fontCorner: 13, ovalW: 54, ovalH: 84 },
  center: { width: 86, height: 130, radius: 12, fontMain: 38, fontCorner: 16, ovalW: 68, ovalH: 106 },
  large: { width: 96, height: 146, radius: 14, fontMain: 44, fontCorner: 18, ovalW: 76, ovalH: 120 },
};

export const UnoCardView: React.FC<UnoCardViewProps> = ({
  card,
  isBack = false,
  size = 'hand',
  isPlayable = false,
  isSelected = false,
  onPress,
  disabled = false,
  style,
}) => {
  const cfg = SIZE_CONFIGS[size];
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isPlayable) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlayable]);

  const renderCardBack = () => {
    return (
      <LinearGradient
        colors={['#1E272E', '#0A0E11']}
        style={[
          styles.cardContainer,
          {
            width: cfg.width,
            height: cfg.height,
            borderRadius: cfg.radius,
            borderColor: '#F1C40F',
            borderWidth: Math.max(1, cfg.radius / 6),
          },
        ]}
      >
        {/* Inner black card base with yellow/red badge */}
        <View style={styles.cardBackInner}>
          <LinearGradient
            colors={['#E63946', '#B30B00']}
            style={[
              styles.cardBackOval,
              { width: cfg.ovalW, height: cfg.ovalH * 0.75, borderRadius: cfg.ovalW / 2 },
            ]}
          >
            <Text
              style={[
                styles.cardBackUnoText,
                { fontSize: cfg.fontMain * 0.75, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
              ]}
            >
              UNO
            </Text>
          </LinearGradient>
        </View>
      </LinearGradient>
    );
  };

  if (isBack || !card) {
    return (
      <View style={[styles.wrapper, style]}>
        {renderCardBack()}
      </View>
    );
  }

  const isWild = card.color === 'wild';
  const colorTheme = isWild
    ? UNO_WILD_THEME
    : UNO_COLOR_THEMES[card.color as UnoActiveColor] || UNO_COLOR_THEMES.red;

  const displayGlyph = UNO_VALUE_GLYPHS[card.value] || card.value;
  const isAction = ['skip', 'reverse', 'draw2', 'wild', 'wild_draw4'].includes(card.value);

  const cardContent = (
    <Animated.View
      style={[
        {
          transform: [
            { scale: pulseAnim },
            { translateY: isSelected ? -14 : 0 },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={colorTheme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.cardContainer,
          {
            width: cfg.width,
            height: cfg.height,
            borderRadius: cfg.radius,
            borderColor: isPlayable ? '#FFFFFF' : colorTheme.border,
            borderWidth: isPlayable ? 2.2 : 1.2,
            shadowColor: isPlayable ? '#FFFFFF' : colorTheme.glow,
            shadowOpacity: isPlayable ? 0.9 : 0.45,
            shadowRadius: isPlayable ? 10 : 4,
            elevation: isPlayable ? 8 : 3,
          },
        ]}
      >
        {/* Top-Left Mini Index */}
        <View style={styles.topLeftIndex}>
          <Text
            style={[
              styles.cornerText,
              { fontSize: cfg.fontCorner, color: colorTheme.text },
            ]}
          >
            {displayGlyph}
          </Text>
        </View>

        {/* Center Oval with Value/Action */}
        <View
          style={[
            styles.centerOval,
            {
              width: cfg.ovalW,
              height: cfg.ovalH,
              borderRadius: cfg.ovalW / 2,
              backgroundColor: isWild ? '#12171A' : '#FFFFFF',
              borderColor: isWild ? '#FFCC00' : 'rgba(255,255,255,0.85)',
              borderWidth: isWild ? 1.5 : 1,
            },
          ]}
        >
          {isWild ? (
            /* 4-Color Wild Center Pie */
            <View style={styles.wildPieContainer}>
              <View style={[styles.wildQuadrant, { backgroundColor: '#E63946' }]} />
              <View style={[styles.wildQuadrant, { backgroundColor: '#1D70B8' }]} />
              <View style={[styles.wildQuadrant, { backgroundColor: '#2A9D8F' }]} />
              <View style={[styles.wildQuadrant, { backgroundColor: '#F4A261' }]} />
              <View style={styles.wildCenterBadge}>
                <Text
                  style={[
                    styles.wildSymbolText,
                    { fontSize: cfg.fontMain * 0.7, color: '#FFFFFF' },
                  ]}
                >
                  {card.value === 'wild_draw4' ? '+4' : '★'}
                </Text>
              </View>
            </View>
          ) : (
            /* Standard Bold Value */
            <Text
              style={[
                styles.mainSymbolText,
                {
                  fontSize: isAction ? cfg.fontMain * 0.85 : cfg.fontMain,
                  color: colorTheme.primary,
                },
              ]}
            >
              {displayGlyph}
            </Text>
          )}
        </View>

        {/* Bottom-Right Mini Index (Inverted) */}
        <View style={styles.bottomRightIndex}>
          <Text
            style={[
              styles.cornerText,
              { fontSize: cfg.fontCorner, color: colorTheme.text },
            ]}
          >
            {displayGlyph}
          </Text>
        </View>

        {/* Playable Aura Shine */}
        {isPlayable && (
          <View style={styles.playableGlowRing} pointerEvents="none" />
        )}
      </LinearGradient>
    </Animated.View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.wrapper, style]}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.wrapper, style]}>{cardContent}</View>;
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
  },
  topLeftIndex: {
    position: 'absolute',
    top: 3,
    left: 5,
    zIndex: 2,
  },
  bottomRightIndex: {
    position: 'absolute',
    bottom: 3,
    right: 5,
    transform: [{ rotate: '180deg' }],
    zIndex: 2,
  },
  cornerText: {
    fontWeight: '900',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  centerOval: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-25deg' }],
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  mainSymbolText: {
    fontWeight: '900',
    fontStyle: 'italic',
    textAlign: 'center',
    transform: [{ rotate: '25deg' }],
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  wildPieContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wildQuadrant: {
    width: '50%',
    height: '50%',
  },
  wildCenterBadge: {
    position: 'absolute',
    width: '65%',
    height: '65%',
    borderRadius: 100,
    backgroundColor: '#12171A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
    transform: [{ rotate: '25deg' }],
  },
  wildSymbolText: {
    fontWeight: '900',
    fontStyle: 'italic',
  },
  playableGlowRing: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
  },
  cardBackInner: {
    width: '92%',
    height: '92%',
    borderRadius: 6,
    backgroundColor: '#0F1316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBackOval: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-30deg' }],
    borderWidth: 1.5,
    borderColor: '#F1C40F',
  },
  cardBackUnoText: {
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#F1C40F',
    letterSpacing: 1,
    transform: [{ rotate: '30deg' }],
  },
});

export default UnoCardView;
