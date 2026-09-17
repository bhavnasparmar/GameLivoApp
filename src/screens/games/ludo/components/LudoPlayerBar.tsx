import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { LudoPlayer, LudoPlayerColor } from '../../../../gameEngine/ludo/ludoTypes';
import { LUDO_COLOR_THEMES } from '../../../../gameEngine/ludo/ludoConstants';

interface LudoPlayerBarProps {
  player: LudoPlayer;
  isCurrentTurn: boolean;
  timeLeft: number;
  maxTime?: number;
  isCompact?: boolean;
}

export const LudoPlayerBar: React.FC<LudoPlayerBarProps> = ({
  player,
  isCurrentTurn,
  timeLeft,
  maxTime = 15,
  isCompact = false,
}) => {
  const theme = LUDO_COLOR_THEMES[player.color] || LUDO_COLOR_THEMES.red;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (isCurrentTurn) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => loop?.stop();
  }, [isCurrentTurn]);

  const finishedCount = player.tokens.filter((t) => t.status === 'finished').length;
  const activeCount = player.tokens.filter((t) => t.status === 'active').length;

  const timePercent = Math.max(0, Math.min(1, timeLeft / maxTime));
  const timerColor =
    timePercent > 0.5 ? '#2ECC71' : timePercent > 0.25 ? '#F39C12' : '#E74C3C';

  return (
    <Animated.View
      style={[
        styles.container,
        isCompact && styles.compactContainer,
        isCurrentTurn && [
          styles.activeContainer,
          { borderColor: theme.primary, shadowColor: theme.primary },
        ],
        { transform: [{ scale: isCurrentTurn ? pulseAnim : 1 }] },
      ]}
    >
      <LinearGradient
        colors={
          isCurrentTurn
            ? [theme.dark, '#1C2833']
            : ['#212F3D', '#17202A']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, isCompact && styles.compactGradient]}
      >
        {/* Left: Avatar with Color Ring */}
        <View style={styles.avatarWrap}>
          <View
            style={[
              styles.avatarRing,
              { borderColor: theme.primary, backgroundColor: theme.light },
            ]}
          >
            <Text style={styles.avatarEmoji}>{player.avatar || '👤'}</Text>
          </View>
          {player.isBot && (
            <View style={styles.botBadge}>
              <Text style={styles.botText}>BOT</Text>
            </View>
          )}
        </View>

        {/* Center: Info */}
        <View style={styles.infoWrap}>
          <View style={styles.nameRow}>
            <Text style={styles.playerName} numberOfLines={1}>
              {player.name}
            </Text>
            {player.isHost && (
              <View style={styles.hostBadge}>
                <Text style={styles.hostText}>HOST</Text>
              </View>
            )}
          </View>

          {/* Tokens Progress / Rank */}
          {player.isFinished ? (
            <View style={styles.finishedBadge}>
              <Text style={styles.finishedText}>
                Rank #{player.rank || 1} 👑
              </Text>
            </View>
          ) : (
            <View style={styles.progressRow}>
              <View style={styles.tokenPills}>
                {[0, 1, 2, 3].map((idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.progressDot,
                      idx < finishedCount
                        ? { backgroundColor: '#F1C40F', borderColor: '#FFFFFF' }
                        : idx < finishedCount + activeCount
                        ? { backgroundColor: theme.primary, borderColor: theme.light }
                        : { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'transparent' },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.progressText}>
                {finishedCount}/4 Home
              </Text>
            </View>
          )}
        </View>

        {/* Right: Turn Timer or Rating */}
        {isCurrentTurn ? (
          <View style={[styles.timerBadge, { borderColor: timerColor }]}>
            <Text style={[styles.timerSec, { color: timerColor }]}>
              {timeLeft}s
            </Text>
          </View>
        ) : (
          <View style={styles.ratingWrap}>
            <Text style={styles.ratingText}>⭐ {player.rating || 1400}</Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 4,
  },
  compactContainer: {
    marginVertical: 2,
  },
  activeContainer: {
    borderWidth: 2,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  compactGradient: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 8,
  },
  avatarRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  botBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#7F8C8D',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  botText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  infoWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 6,
    maxWidth: 120,
  },
  hostBadge: {
    backgroundColor: '#F39C12',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  hostText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000000',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  tokenPills: {
    flexDirection: 'row',
    marginRight: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 0.8,
    marginRight: 3,
  },
  progressText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },
  finishedBadge: {
    backgroundColor: 'rgba(241, 196, 15, 0.25)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  finishedText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F1C40F',
  },
  timerBadge: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  timerSec: {
    fontSize: 13,
    fontWeight: '900',
  },
  ratingWrap: {
    paddingHorizontal: 6,
  },
  ratingText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
  },
});

export default LudoPlayerBar;
