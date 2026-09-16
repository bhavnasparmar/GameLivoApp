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

export type UnoCardSize = 'mini' | 'tiny' | 'small' | 'medium' | 'large' | 'hand' | 'center';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Proportional scale ratio based on standard 390px mobile screen
const scaleFactor = Math.min(1.2, Math.max(0.85, SCREEN_WIDTH / 390));

interface UnoCardViewProps {
  card?: UnoCard;
  isBack?: boolean;
  size?: UnoCardSize;
  isPlayable?: boolean;
  isSelected?: boolean;
  customWidth?: number;
  customHeight?: number;
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
}

const BASE_WIDTHS: Record<UnoCardSize, number> = {
  mini: Math.round(18 * scaleFactor),
  tiny: Math.round(28 * scaleFactor),
  small: Math.round(38 * scaleFactor),
  medium: Math.round(48 * scaleFactor),
  center: Math.round(54 * scaleFactor),
  hand: Math.round(72 * scaleFactor),
  large: Math.round(88 * scaleFactor),
};

const getResponsiveConfig = (size: UnoCardSize, customW?: number, customH?: number) => {
  const width = customW || BASE_WIDTHS[size];
  const height = customH || Math.round(width * 1.5);
  const radius = Math.max(3, Math.round(width * 0.14));
  const borderW = Math.max(1, Math.round(width * 0.03));
  const ovalW = Math.round(width * 0.58);
  const ovalH = Math.round(height * 0.64);
  const fontMain = Math.round(width * 0.46);
  const fontCorner = Math.max(5, Math.round(width * 0.18));

  return {
    width,
    height,
    radius,
    borderW,
    ovalW,
    ovalH,
    fontMain,
    fontCorner,
  };
};

export const UnoCardView: React.FC<UnoCardViewProps> = ({
  card,
  isBack = false,
  size = 'hand',
  isPlayable = false,
  isSelected = false,
  customWidth,
  customHeight,
  onPress,
  disabled = false,
  style,
}) => {
  const cfg = getResponsiveConfig(size, customWidth, customHeight);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isPlayable) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 650,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 650,
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

  // Render Uno Card Back
  const renderCardBack = () => {
    return (
      <View
        style={[
          styles.cardOuterWhiteBorder,
          {
            width: cfg.width,
            height: cfg.height,
            borderRadius: cfg.radius,
            padding: cfg.borderW,
          },
        ]}
      >
        <LinearGradient
          colors={['#18191C', '#0A0B0D']}
          style={[styles.cardInnerBack, { borderRadius: Math.max(1, cfg.radius - 2) }]}
        >
          {/* Inner Yellow Accent Ring */}
          <View
            style={[
              styles.cardBackYellowRim,
              {
                width: cfg.ovalW,
                height: Math.round(cfg.ovalH * 0.78),
                borderRadius: Math.round(cfg.ovalW / 2),
                borderWidth: Math.max(1, Math.round(cfg.borderW * 0.9)),
              },
            ]}
          >
            {/* Tilted Red Oval */}
            <LinearGradient
              colors={['#E62429', '#B31419']}
              style={styles.cardBackRedOval}
            >
              <Text
                style={[
                  styles.cardBackUnoText,
                  {
                    fontSize: Math.round(cfg.fontMain * 0.7),
                    textShadowRadius: 1,
                  },
                ]}
              >
                UNO
              </Text>
            </LinearGradient>
          </View>
        </LinearGradient>
      </View>
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

  const renderCenterContent = () => {
    if (card.value === 'wild') {
      return (
        <View style={styles.wildWheelContainer}>
          <View style={[styles.wildQuadrant, { backgroundColor: '#E62429' }]} />
          <View style={[styles.wildQuadrant, { backgroundColor: '#F5B800' }]} />
          <View style={[styles.wildQuadrant, { backgroundColor: '#0072CE' }]} />
          <View style={[styles.wildQuadrant, { backgroundColor: '#00A651' }]} />
        </View>
      );
    }

    if (card.value === 'wild_draw4') {
      return (
        <View style={styles.wildDraw4Container}>
          <Text style={[styles.wildPlus4Text, { fontSize: Math.round(cfg.fontMain * 0.55) }]}>
            +4
          </Text>
          <View style={styles.fourTilesRow}>
            <View style={[styles.tileItem, { backgroundColor: '#E62429' }]} />
            <View style={[styles.tileItem, { backgroundColor: '#0072CE' }]} />
            <View style={[styles.tileItem, { backgroundColor: '#00A651' }]} />
            <View style={[styles.tileItem, { backgroundColor: '#F5B800' }]} />
          </View>
        </View>
      );
    }

    if (card.value === 'draw2') {
      return (
        <View style={styles.draw2Container}>
          <Text
            style={[
              styles.actionNumberText,
              { fontSize: Math.round(cfg.fontMain * 0.72), color: colorTheme.primary },
            ]}
          >
            +2
          </Text>
          <View style={styles.dualCardsIcon}>
            <View
              style={[
                styles.miniCardIcon,
                {
                  width: Math.max(7, Math.round(cfg.width * 0.13)),
                  height: Math.max(10, Math.round(cfg.height * 0.11)),
                  borderColor: colorTheme.primary,
                  transform: [{ rotate: '-12deg' }],
                },
              ]}
            />
            <View
              style={[
                styles.miniCardIcon,
                {
                  width: Math.max(7, Math.round(cfg.width * 0.13)),
                  height: Math.max(10, Math.round(cfg.height * 0.11)),
                  borderColor: colorTheme.primary,
                  marginLeft: -4,
                  transform: [{ rotate: '8deg' }],
                },
              ]}
            />
          </View>
        </View>
      );
    }

    if (card.value === 'reverse') {
      return (
        <View style={styles.reverseContainer}>
          <Text
            style={[
              styles.actionSymbolText,
              { fontSize: Math.round(cfg.fontMain * 0.75), color: colorTheme.primary },
            ]}
          >
            ⇄
          </Text>
        </View>
      );
    }

    if (card.value === 'skip') {
      return (
        <View style={styles.skipContainer}>
          <Text
            style={[
              styles.actionSymbolText,
              { fontSize: Math.round(cfg.fontMain * 0.75), color: colorTheme.primary },
            ]}
          >
            ⊘
          </Text>
        </View>
      );
    }

    return (
      <Text
        style={[
          styles.mainNumberText,
          {
            fontSize: cfg.fontMain,
            color: colorTheme.primary,
          },
        ]}
      >
        {displayGlyph}
      </Text>
    );
  };

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
      <View
        style={[
          styles.cardOuterWhiteBorder,
          {
            width: cfg.width,
            height: cfg.height,
            borderRadius: cfg.radius,
            padding: cfg.borderW,
            borderColor: isPlayable ? '#FFFFFF' : '#EAECEE',
            shadowColor: isPlayable ? '#FFFFFF' : colorTheme.glow,
            shadowOpacity: isPlayable ? 0.95 : 0.4,
            shadowRadius: isPlayable ? 10 : 4,
            elevation: isPlayable ? 8 : 3,
          },
        ]}
      >
        <LinearGradient
          colors={colorTheme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.cardFace,
            { borderRadius: Math.max(1, cfg.radius - 2) },
          ]}
        >
          {/* Top-Left Corner Index */}
          <View style={[styles.cornerIndex, styles.topLeftIndex]}>
            <Text
              style={[
                styles.cornerText,
                {
                  fontSize: cfg.fontCorner,
                  color: '#FFFFFF',
                },
              ]}
            >
              {displayGlyph}
            </Text>
          </View>

          {/* Center Tilted White Oval */}
          <View
            style={[
              styles.centerOval,
              {
                width: cfg.ovalW,
                height: cfg.ovalH,
                borderRadius: Math.round(cfg.ovalW / 2),
                backgroundColor: isWild ? '#12131A' : '#FFFFFF',
                borderWidth: isWild ? 1.2 : 0,
                borderColor: '#FFD700',
              },
            ]}
          >
            {renderCenterContent()}
          </View>

          {/* Bottom-Right Corner Index */}
          <View style={[styles.cornerIndex, styles.bottomRightIndex]}>
            <Text
              style={[
                styles.cornerText,
                {
                  fontSize: cfg.fontCorner,
                  color: '#FFFFFF',
                },
              ]}
            >
              {displayGlyph}
            </Text>
          </View>

          {/* Playable Border Highlight */}
          {isPlayable && (
            <View style={styles.playableInnerAura} pointerEvents="none" />
          )}
        </LinearGradient>
      </View>
    </Animated.View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        activeOpacity={0.82}
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
  cardOuterWhiteBorder: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowOffset: { width: 0, height: 3 },
  },
  cardFace: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cornerIndex: {
    position: 'absolute',
    zIndex: 4,
  },
  topLeftIndex: {
    top: 2,
    left: 3,
  },
  bottomRightIndex: {
    bottom: 2,
    right: 3,
    transform: [{ rotate: '180deg' }],
  },
  cornerText: {
    fontWeight: '900',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0.8, height: 0.8 },
    textShadowRadius: 1,
  },
  centerOval: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-28deg' }],
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  mainNumberText: {
    fontWeight: '900',
    fontStyle: 'italic',
    textAlign: 'center',
    transform: [{ rotate: '28deg' }],
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 0.8, height: 0.8 },
    textShadowRadius: 1,
  },
  actionSymbolText: {
    fontWeight: '900',
    textAlign: 'center',
    transform: [{ rotate: '28deg' }],
  },
  actionNumberText: {
    fontWeight: '900',
    fontStyle: 'italic',
    textAlign: 'center',
    transform: [{ rotate: '28deg' }],
  },
  draw2Container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dualCardsIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -2,
    transform: [{ rotate: '28deg' }],
  },
  miniCardIcon: {
    borderRadius: 1.5,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  reverseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wildWheelContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    transform: [{ rotate: '28deg' }],
  },
  wildQuadrant: {
    width: '50%',
    height: '50%',
  },
  wildDraw4Container: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '28deg' }],
  },
  wildPlus4Text: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontStyle: 'italic',
    marginBottom: 1,
  },
  fourTilesRow: {
    flexDirection: 'row',
    gap: 1.5,
  },
  tileItem: {
    width: 5,
    height: 8,
    borderRadius: 1,
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
  },
  playableInnerAura: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1.8,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 6,
  },
  cardInnerBack: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardBackYellowRim: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-28deg' }],
    borderColor: '#F1C40F',
    overflow: 'hidden',
  },
  cardBackRedOval: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBackUnoText: {
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFD700',
    letterSpacing: 0.5,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
  },
});

export default UnoCardView;
