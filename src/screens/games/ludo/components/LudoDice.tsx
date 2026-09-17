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
import { soundService } from '../../../../services/sound/soundService';
import { vibrationService } from '../../../../services/vibration/vibrationService';

interface LudoDiceProps {
  value: number | null;
  isRolling: boolean;
  canRoll: boolean;
  color: LudoPlayerColor;
  onRoll: () => void;
  disabled?: boolean;
  playerName?: string;
}

export const LudoDice: React.FC<LudoDiceProps> = ({
  value,
  isRolling,
  canRoll,
  color,
  onRoll,
  disabled = false,
  playerName,
}) => {
  const colorTheme = LUDO_COLOR_THEMES[color] || LUDO_COLOR_THEMES.red;

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.4)).current;

  // Pulse animation when it is time to roll
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    if (canRoll && !isRolling && !disabled) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 550,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 550,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoop.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      pulseLoop?.stop();
    };
  }, [canRoll, isRolling, disabled]);

  // Dice roll spin and bounce physics
  useEffect(() => {
    if (isRolling) {
      soundService.play('dice_roll');
      vibrationService.vibrateTap();

      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 650,
          easing: Easing.bezier(0.17, 0.67, 0.83, 0.67),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.25,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        rotateAnim.setValue(0);
      });
    }
  }, [isRolling]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  const renderDots = (diceNum: number) => {
    const pips: React.ReactNode[] = [];
    const pipColor = '#1B1F23';

    const pipMap: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };

    const activePips = pipMap[diceNum] || [4];

    for (let i = 0; i < 9; i++) {
      const isFilled = activePips.includes(i);
      pips.push(
        <View key={i} style={styles.pipCell}>
          {isFilled ? (
            <View
              style={[
                styles.pip,
                diceNum === 6 ? { backgroundColor: colorTheme.primary } : { backgroundColor: pipColor },
              ]}
            />
          ) : null}
        </View>,
      );
    }

    return pips;
  };

  const handlePress = () => {
    if (canRoll && !isRolling && !disabled) {
      onRoll();
    }
  };

  const displayValue = value && value >= 1 && value <= 6 ? value : 6;

  return (
    <View style={styles.wrapper}>
      {/* Outer Glow Ring */}
      {canRoll && !disabled && (
        <Animated.View
          style={[
            styles.glowRing,
            {
              borderColor: colorTheme.primary,
              shadowColor: colorTheme.primary,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        disabled={!canRoll || isRolling || disabled}
      >
        <Animated.View
          style={[
            styles.diceContainer,
            {
              borderColor: canRoll ? colorTheme.primary : 'rgba(255,255,255,0.15)',
              transform: [{ scale: scaleAnim }, { rotate: spin }],
            },
          ]}
        >
          {/* Glass Top Gradient */}
          <LinearGradient
            colors={
              disabled
                ? ['#2C3E50', '#1A252F']
                : ['#FFFFFF', '#F2F4F7', '#DFE4EA']
            }
            style={styles.diceFace}
          >
            {isRolling ? (
              <Text style={styles.rollingText}>🎲</Text>
            ) : (
              <View style={styles.pipsGrid}>{renderDots(displayValue)}</View>
            )}
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* Helper Label */}
      <View style={styles.labelContainer}>
        <Text
          style={[
            styles.statusLabel,
            { color: canRoll && !disabled ? colorTheme.primary : '#8899A6' },
          ]}
        >
          {canRoll && !disabled ? 'TAP TO ROLL' : playerName ? `${playerName}` : ''}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 84,
    height: 84,
  },
  glowRing: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 18,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  diceContainer: {
    width: 58,
    height: 58,
    borderRadius: 14,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    backgroundColor: '#FFFFFF',
  },
  diceFace: {
    flex: 1,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rollingText: {
    fontSize: 28,
  },
  pipsGrid: {
    width: 44,
    height: 44,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  pipCell: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },
  labelContainer: {
    position: 'absolute',
    bottom: -18,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default LudoDice;
