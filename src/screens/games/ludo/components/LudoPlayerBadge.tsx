import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { LudoPlayer, LudoPlayerColor } from '../../../../gameEngine/ludo/ludoTypes';
import { LUDO_COLOR_THEMES } from '../../../../gameEngine/ludo/ludoConstants';
import { soundService } from '../../../../services/sound/soundService';
import { vibrationService } from '../../../../services/vibration/vibrationService';

const { width } = Dimensions.get('window');
const BADGE_WIDTH = (width - 32) / 2;

interface LudoPlayerBadgeProps {
  player?: LudoPlayer;
  isCurrentTurn: boolean;
  canRoll: boolean;
  isRolling: boolean;
  currentDiceValue: number | null;
  timeLeft: number;
  onRollDice?: () => void;
  isMyTurn?: boolean;
  placeholderText?: string;
  badgeColor?: LudoPlayerColor;
  containerWidth?: number | string;
  containerStyle?: any;
}

// Styled Illustrated Avatars matching the uploaded reference image
const renderPlayerAvatar = (color: LudoPlayerColor) => {
  switch (color) {
    case 'red':
      return (
        <View style={avatarStyles.avatarContainer}>
          {/* Boy with Dark Hair & Red Shirt */}
          <View style={[avatarStyles.headBase, { backgroundColor: '#FAD7A0' }]}>
            <View style={[avatarStyles.hairDark, { top: -2, height: 16 }]} />
            <View style={avatarStyles.faceEyes}>
              <View style={avatarStyles.eyeDot} />
              <View style={avatarStyles.eyeDot} />
            </View>
            <View style={avatarStyles.smileMouth} />
          </View>
          <View style={[avatarStyles.shirtBody, { backgroundColor: '#E74C3C' }]} />
        </View>
      );
    case 'yellow':
      return (
        <View style={avatarStyles.avatarContainer}>
          {/* Girl with Long Brown Hair & Yellow Shirt */}
          <View style={[avatarStyles.longHairBack, { backgroundColor: '#5D4037' }]} />
          <View style={[avatarStyles.headBase, { backgroundColor: '#FAD7A0' }]}>
            <View style={[avatarStyles.hairBrownBangs, { backgroundColor: '#5D4037' }]} />
            <View style={avatarStyles.faceEyes}>
              <View style={avatarStyles.eyeDot} />
              <View style={avatarStyles.eyeDot} />
            </View>
            <View style={avatarStyles.smileMouth} />
          </View>
          <View style={[avatarStyles.shirtBody, { backgroundColor: '#F1C40F' }]} />
        </View>
      );
    case 'green':
      return (
        <View style={avatarStyles.avatarContainer}>
          {/* Boy with Brown Hair & Green Hoodie */}
          <View style={[avatarStyles.headBase, { backgroundColor: '#FAD7A0' }]}>
            <View style={[avatarStyles.hairBrownShort, { backgroundColor: '#6E2C00' }]} />
            <View style={avatarStyles.faceEyes}>
              <View style={avatarStyles.eyeDot} />
              <View style={avatarStyles.eyeDot} />
            </View>
            <View style={avatarStyles.smileMouth} />
          </View>
          <View style={[avatarStyles.shirtBody, { backgroundColor: '#2ECC71' }]} />
        </View>
      );
    case 'blue':
      return (
        <View style={avatarStyles.avatarContainer}>
          {/* Girl with Dark Hair & Blue Shirt */}
          <View style={[avatarStyles.longHairBack, { backgroundColor: '#212F3D' }]} />
          <View style={[avatarStyles.headBase, { backgroundColor: '#FAD7A0' }]}>
            <View style={[avatarStyles.hairDarkBangs, { backgroundColor: '#212F3D' }]} />
            <View style={avatarStyles.faceEyes}>
              <View style={avatarStyles.eyeDot} />
              <View style={avatarStyles.eyeDot} />
            </View>
            <View style={avatarStyles.smileMouth} />
          </View>
          <View style={[avatarStyles.shirtBody, { backgroundColor: '#0288D1' }]} />
        </View>
      );
    case 'purple':
      return (
        <View style={avatarStyles.avatarContainer}>
          {/* Girl with Purple Band & Shirt */}
          <View style={[avatarStyles.longHairBack, { backgroundColor: '#4A148C' }]} />
          <View style={[avatarStyles.headBase, { backgroundColor: '#FAD7A0' }]}>
            <View style={[avatarStyles.hairDarkBangs, { backgroundColor: '#4A148C' }]} />
            <View style={avatarStyles.faceEyes}>
              <View style={avatarStyles.eyeDot} />
              <View style={avatarStyles.eyeDot} />
            </View>
            <View style={avatarStyles.smileMouth} />
          </View>
          <View style={[avatarStyles.shirtBody, { backgroundColor: '#8E24AA' }]} />
        </View>
      );
    case 'orange':
    default:
      return (
        <View style={avatarStyles.avatarContainer}>
          {/* Boy with Orange Cap & Shirt */}
          <View style={[avatarStyles.headBase, { backgroundColor: '#FAD7A0' }]}>
            <View style={[avatarStyles.hairBrownShort, { backgroundColor: '#E65100' }]} />
            <View style={avatarStyles.faceEyes}>
              <View style={avatarStyles.eyeDot} />
              <View style={avatarStyles.eyeDot} />
            </View>
            <View style={avatarStyles.smileMouth} />
          </View>
          <View style={[avatarStyles.shirtBody, { backgroundColor: '#FB8C00' }]} />
        </View>
      );
  }
};

const avatarStyles = StyleSheet.create({
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#FDEDEC',
    position: 'relative',
  },
  longHairBack: {
    position: 'absolute',
    top: 4,
    width: 32,
    height: 34,
    borderRadius: 16,
  },
  headBase: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
    top: -2,
    zIndex: 2,
  },
  hairDark: {
    position: 'absolute',
    width: 26,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    backgroundColor: '#1C2833',
  },
  hairBrownBangs: {
    position: 'absolute',
    top: -2,
    width: 26,
    height: 12,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
  },
  hairBrownShort: {
    position: 'absolute',
    top: -2,
    width: 26,
    height: 14,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
  },
  hairDarkBangs: {
    position: 'absolute',
    top: -2,
    width: 26,
    height: 12,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
  },
  faceEyes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 12,
    marginTop: 10,
  },
  eyeDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#1C2833',
  },
  smileMouth: {
    width: 6,
    height: 3,
    borderBottomWidth: 1.5,
    borderBottomColor: '#C0392B',
    borderRadius: 3,
    marginTop: 2,
  },
  shirtBody: {
    position: 'absolute',
    bottom: -2,
    width: 32,
    height: 14,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    zIndex: 1,
  },
});

export const LudoPlayerBadge: React.FC<LudoPlayerBadgeProps> = ({
  player,
  isCurrentTurn,
  canRoll,
  isRolling,
  currentDiceValue,
  timeLeft,
  onRollDice,
  isMyTurn = false,
  placeholderText = 'Player',
  badgeColor = 'red',
  containerWidth,
  containerStyle,
}) => {
  if (!player) return null;

  const colorKey = player?.color || badgeColor;
  const theme = LUDO_COLOR_THEMES[colorKey] || LUDO_COLOR_THEMES.red;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const diceRotateAnim = useRef(new Animated.Value(0)).current;
  const diceScaleAnim = useRef(new Animated.Value(1)).current;

  // Pulse when active turn
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    if (isCurrentTurn) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 450,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 450,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => pulseLoop?.stop();
  }, [isCurrentTurn]);

  // Dice roll animation
  useEffect(() => {
    if (isRolling && isCurrentTurn) {
      soundService.play('dice_roll');
      vibrationService.vibrateTap();

      Animated.parallel([
        Animated.timing(diceRotateAnim, {
          toValue: 1,
          duration: 550,
          easing: Easing.bezier(0.17, 0.67, 0.83, 0.67),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(diceScaleAnim, {
            toValue: 1.25,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(diceScaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        diceRotateAnim.setValue(0);
      });
    }
  }, [isRolling, isCurrentTurn]);

  const spin = diceRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  const displayDiceVal = isCurrentTurn && currentDiceValue ? currentDiceValue : 6;
  const finishedTokensCount = player?.tokens.filter((t) => t.status === 'finished').length || 0;

  const renderDicePips = (num: number) => {
    const pipMap: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };
    const active = pipMap[num] || [4];

    return Array.from({ length: 9 }).map((_, i) => (
      <View key={i} style={styles.pipCell}>
        {active.includes(i) ? (
          <View style={styles.pip} />
        ) : null}
      </View>
    ));
  };

  const canInteract = Boolean(isCurrentTurn && canRoll && isMyTurn && !isRolling);

  const handlePressToRoll = () => {
    if (canInteract) {
      onRollDice?.();
    }
  };

  // Badge gradient colors matching the image
  const getBadgeColors = (): [string, string] => {
    switch (colorKey) {
      case 'red':
        return ['#E53935', '#C62828'];
      case 'green':
        return ['#00A859', '#1B5E20'];
      case 'yellow':
        return ['#FFC107', '#F57F17'];
      case 'blue':
        return ['#0288D1', '#0D47A1'];
      case 'purple':
        return ['#8E24AA', '#4A148C'];
      case 'orange':
        return ['#FB8C00', '#E65100'];
      default:
        return [theme.primary, theme.dark];
    }
  };

  return (
    <Animated.View
      style={[
        styles.badgeOuterContainer,
        {
          width: containerWidth || BADGE_WIDTH,
          borderColor: isCurrentTurn ? '#FFFFFF' : 'rgba(0,0,0,0.4)',
          transform: [{ scale: isCurrentTurn ? pulseAnim : 1 }],
        },
        containerStyle,
      ]}
    >
      <TouchableOpacity
        activeOpacity={canInteract ? 0.75 : 1}
        disabled={!canInteract}
        onPress={handlePressToRoll}
        style={styles.fullBadgeTouchable}
      >
        <LinearGradient
          colors={getBadgeColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badgeGradient}
        >
          {/* Left: Avatar Circle with White Border */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatarWhiteRing}>
              {renderPlayerAvatar(colorKey)}
            </View>
          </View>

          {/* Center: Info & 4 Status Dots */}
          <View style={styles.infoCol}>
            <Text style={styles.playerName} numberOfLines={1}>
              {player ? player.name : placeholderText}
            </Text>

            {/* 4 Status Circles matching image */}
            <View style={styles.tokenDotsRow}>
              {[0, 1, 2, 3].map((dotIdx) => {
                const isFilled = dotIdx < finishedTokensCount;
                return (
                  <View
                    key={dotIdx}
                    style={[
                      styles.tokenDot,
                      {
                        borderColor: '#FFFFFF',
                        backgroundColor: isFilled ? '#FFFFFF' : 'rgba(255,255,255,0.25)',
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>

          {/* Right: 3D Rounded White Dice matching image */}
          <View style={styles.diceWrap}>
            <Animated.View
              style={[
                styles.dice3DBox,
                canInteract && styles.activeDiceGlow,
                {
                  transform: [{ scale: diceScaleAnim }, { rotate: spin }],
                },
              ]}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F8F9FA', '#E2E8F0']}
                start={{ x: 0.1, y: 0.1 }}
                end={{ x: 0.9, y: 0.9 }}
                style={styles.diceFaceGradient}
              >
                {isRolling ? (
                  <Text style={styles.diceRollingText}>🎲</Text>
                ) : (
                  <View style={styles.pipsGrid}>{renderDicePips(displayDiceVal)}</View>
                )}
              </LinearGradient>
            </Animated.View>

            {/* Turn timer badge when it's player's turn */}
            {isCurrentTurn && (
              <View style={styles.timerPill}>
                <Text style={styles.timerText}>{timeLeft}s</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badgeOuterContainer: {
    height: 66,
    borderRadius: 22,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  fullBadgeTouchable: {
    flex: 1,
  },
  badgeGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  avatarWrap: {
    marginRight: 6,
  },
  avatarWhiteRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 2,
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 4,
  },
  tokenDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    marginRight: 4,
  },
  diceWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: 4,
  },
  dice3DBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 4,
    elevation: 6,
    backgroundColor: '#FFFFFF',
  },
  activeDiceGlow: {
    borderColor: '#FFF',
    borderWidth: 2,
    shadowColor: '#F1C40F',
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  diceFaceGradient: {
    flex: 1,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceRollingText: {
    fontSize: 22,
  },
  pipsGrid: {
    width: 32,
    height: 32,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  pipCell: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E293B',
  },
  timerPill: {
    position: 'absolute',
    top: -6,
    right: -4,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#F1C40F',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
    zIndex: 10,
  },
  timerText: {
    color: '#F1C40F',
    fontSize: 9,
    fontWeight: '900',
  },
});

export default LudoPlayerBadge;
