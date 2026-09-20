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
import { LudoPlayerColor } from '../../../../gameEngine/ludo/ludoTypes';
import { LUDO_COLOR_THEMES } from '../../../../gameEngine/ludo/ludoConstants';

interface LudoTokenViewProps {
  color: LudoPlayerColor;
  size?: number;
  isSelectable?: boolean;
  onPress?: () => void;
  stackCount?: number;
  isFinished?: boolean;
}

// 3D Pawn Color Palettes with Realistic Gloss Shading
const TOKEN_3D_PALETTES: Record<
  LudoPlayerColor,
  {
    headGradient: string[];
    waistGradient: string[];
    baseGradient: string[];
    shadowColor: string;
    rimHighlight: string;
  }
> = {
  red: {
    headGradient: ['#FF8A80', '#E53935', '#C62828', '#8E0000'],
    waistGradient: ['#FFCDD2', '#E53935', '#B71C1C'],
    baseGradient: ['#FF8A80', '#E53935', '#C62828', '#5F0909'],
    shadowColor: 'rgba(142, 0, 0, 0.6)',
    rimHighlight: 'rgba(255, 205, 210, 0.85)',
  },
  yellow: {
    headGradient: ['#FFF9C4', '#FBC02D', '#F57F17', '#E65100'],
    waistGradient: ['#FFFDE7', '#FBC02D', '#F57F17'],
    baseGradient: ['#FFF59D', '#FBC02D', '#F57F17', '#873600'],
    shadowColor: 'rgba(230, 81, 0, 0.6)',
    rimHighlight: 'rgba(255, 253, 231, 0.9)',
  },
  green: {
    headGradient: ['#A5D6A7', '#43A047', '#2E7D32', '#1B5E20'],
    waistGradient: ['#C8E6C9', '#43A047', '#1B5E20'],
    baseGradient: ['#A5D6A7', '#43A047', '#2E7D32', '#0D3813'],
    shadowColor: 'rgba(27, 94, 32, 0.6)',
    rimHighlight: 'rgba(200, 230, 201, 0.85)',
  },
  blue: {
    headGradient: ['#90CAF9', '#1E88E5', '#1565C0', '#0D47A1'],
    waistGradient: ['#BBDEFB', '#1E88E5', '#0D47A1'],
    baseGradient: ['#90CAF9', '#1E88E5', '#1565C0', '#062B66'],
    shadowColor: 'rgba(13, 71, 161, 0.6)',
    rimHighlight: 'rgba(187, 222, 251, 0.85)',
  },
  orange: {
    headGradient: ['#FFCC80', '#FB8C00', '#EF6C00', '#E65100'],
    waistGradient: ['#FFE0B2', '#FB8C00', '#E65100'],
    baseGradient: ['#FFCC80', '#FB8C00', '#EF6C00', '#7E2B00'],
    shadowColor: 'rgba(230, 81, 0, 0.6)',
    rimHighlight: 'rgba(255, 224, 178, 0.85)',
  },
  purple: {
    headGradient: ['#CE93D8', '#8E24AA', '#6A1B9A', '#4A148C'],
    waistGradient: ['#E1BEE7', '#8E24AA', '#4A148C'],
    baseGradient: ['#CE93D8', '#8E24AA', '#6A1B9A', '#2E0854'],
    shadowColor: 'rgba(74, 20, 140, 0.6)',
    rimHighlight: 'rgba(225, 190, 231, 0.85)',
  },
};

export const LudoTokenView: React.FC<LudoTokenViewProps> = ({
  color,
  size = 24,
  isSelectable = false,
  onPress,
  stackCount = 1,
  isFinished = false,
}) => {
  const palette = TOKEN_3D_PALETTES[color] || TOKEN_3D_PALETTES.red;
  const theme = LUDO_COLOR_THEMES[color] || LUDO_COLOR_THEMES.red;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (isSelectable) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.15,
              duration: 380,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: -7,
              duration: 380,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
              toValue: 1.0,
              duration: 380,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.0,
              duration: 380,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 380,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0.5,
              duration: 380,
              useNativeDriver: true,
            }),
          ]),
        ]),
      );
      animLoop.start();
    } else {
      pulseAnim.setValue(1);
      bounceAnim.setValue(0);
      glowOpacity.setValue(0.6);
    }

    return () => {
      animLoop?.stop();
    };
  }, [isSelectable]);

  // Dimensional ratios for realistic 3D pawn piece matching uploaded reference
  const headDiam = size * 0.56;
  const baseDiam = size * 0.88;
  const collarWidth = size * 0.38;
  const totalHeight = size * 1.1;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!isSelectable && !onPress}
      style={[
        styles.touchable,
        {
          width: size + 8,
          height: totalHeight + 8,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.container,
          {
            width: size + 6,
            height: totalHeight + 4,
            transform: [{ scale: pulseAnim }, { translateY: bounceAnim }],
          },
        ]}
      >
        {/* Soft Ambient Contact Shadow Underneath */}
        <View
          style={[
            styles.contactShadow,
            {
              width: baseDiam * 0.96,
              height: baseDiam * 0.36,
              bottom: 0,
            },
          ]}
        />

        {/* Outer Halo Glow when token is selectable */}
        {isSelectable && (
          <Animated.View
            style={[
              styles.selectableGlowRing,
              {
                width: size + 10,
                height: size + 10,
                borderRadius: (size + 10) / 2,
                borderColor: '#FFFFFF',
                shadowColor: theme.primary,
                opacity: glowOpacity,
              },
            ]}
          />
        )}

        {/* 3D Sculpted Pawn Body */}
        <View
          style={[
            styles.pawnAssembly,
            {
              width: size + 2,
              height: totalHeight,
            },
          ]}
        >
          {/* Layer 1: Flared Pedestal Base */}
          <LinearGradient
            colors={palette.baseGradient}
            locations={[0, 0.35, 0.75, 1]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={[
              styles.pedestalBase,
              {
                width: baseDiam,
                height: size * 0.46,
                borderRadius: baseDiam / 2,
                bottom: 0,
              },
            ]}
          >
            {/* Specular Edge Bevel on Base */}
            <View
              style={[
                styles.pedestalHighlight,
                {
                  borderRadius: baseDiam / 2,
                  backgroundColor: palette.rimHighlight,
                },
              ]}
            />
          </LinearGradient>

          {/* Layer 2: Tapered Neck Collar */}
          <LinearGradient
            colors={palette.waistGradient}
            locations={[0, 0.4, 1]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={[
              styles.neckCollar,
              {
                width: collarWidth,
                height: size * 0.34,
                borderRadius: collarWidth / 2,
                bottom: size * 0.26,
              },
            ]}
          />

          {/* Layer 3: Spherical Head Dome */}
          <LinearGradient
            colors={palette.headGradient}
            locations={[0, 0.25, 0.7, 1]}
            start={{ x: 0.18, y: 0.12 }}
            end={{ x: 0.85, y: 0.9 }}
            style={[
              styles.headSphere,
              {
                width: headDiam,
                height: headDiam,
                borderRadius: headDiam / 2,
                top: 0,
              },
            ]}
          >
            {/* Primary Specular Glare Highlight */}
            <View
              style={[
                styles.specularSpot,
                {
                  width: headDiam * 0.34,
                  height: headDiam * 0.34,
                  borderRadius: (headDiam * 0.34) / 2,
                  top: headDiam * 0.1,
                  left: headDiam * 0.14,
                },
              ]}
            />

            {/* Secondary Micro Highlight */}
            <View
              style={[
                styles.microSpecular,
                {
                  top: headDiam * 0.15,
                  left: headDiam * 0.48,
                },
              ]}
            />

            {/* Finished Crown or Stack Count */}
            {isFinished ? (
              <Text style={[styles.crownText, { fontSize: headDiam * 0.65 }]}>👑</Text>
            ) : stackCount > 1 ? (
              <View style={styles.stackBadge}>
                <Text style={[styles.stackText, { fontSize: headDiam * 0.48 }]}>
                  {stackCount}
                </Text>
              </View>
            ) : null}
          </LinearGradient>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  contactShadow: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 20,
    alignSelf: 'center',
    zIndex: 1,
  },
  selectableGlowRing: {
    position: 'absolute',
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
    alignSelf: 'center',
    zIndex: 2,
  },
  pawnAssembly: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 3,
  },
  pedestalBase: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
    overflow: 'hidden',
  },
  pedestalHighlight: {
    position: 'absolute',
    top: 1,
    left: 2,
    right: 2,
    height: 3,
    opacity: 0.85,
  },
  neckCollar: {
    position: 'absolute',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  headSphere: {
    position: 'absolute',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.55,
    shadowRadius: 4,
    elevation: 7,
  },
  specularSpot: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    opacity: 0.92,
  },
  microSpecular: {
    position: 'absolute',
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#FFFFFF',
    opacity: 0.75,
  },
  crownText: {
    textAlign: 'center',
    lineHeight: 14,
  },
  stackBadge: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  stackText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});

export default LudoTokenView;
