import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import { ChessColor, ChessPiece } from '../../../../gameEngine/chess/chessTypes';
import { CHESS_PIECE_IMAGES } from '../../../../gameEngine/chess/chessConstants';

interface ChessPlayerBarProps {
  name: string;
  avatarText: string;
  rating?: number;
  level?: number;
  color: ChessColor;
  isCurrentTurn: boolean;
  timeLeftSeconds: number;
  capturedPieces: ChessPiece[];
  materialAdvantage?: number;
  isDark?: boolean;
  statusText?: string;
}

export const ChessPlayerBar: React.FC<ChessPlayerBarProps> = React.memo(
  ({
    name,
    avatarText,
    rating = 1200,
    level = 1,
    color,
    isCurrentTurn,
    timeLeftSeconds,
    capturedPieces,
    materialAdvantage = 0,
    isDark = true,
    statusText,
  }) => {
    const isWhite = color === 'white';
    const pulseAnim = useRef(new Animated.Value(0)).current;

    // Continuous smooth turn pulse animation when it is active turn
    useEffect(() => {
      let animation: Animated.CompositeAnimation | null = null;
      if (isCurrentTurn) {
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 900,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 0,
              duration: 900,
              useNativeDriver: true,
            }),
          ]),
        );
        animation.start();
      } else {
        pulseAnim.setValue(0);
      }

      return () => {
        animation?.stop();
      };
    }, [isCurrentTurn, pulseAnim]);

    const formatTime = (secs: number) => {
      if (secs <= 0) return '00:00';
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isLowTime = timeLeftSeconds > 0 && timeLeftSeconds <= 30;

    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isCurrentTurn
              ? isDark
                ? '#16241B'
                : '#EAF7EE'
              : isDark
              ? '#0D1410'
              : '#F7FBF8',
            borderColor: isCurrentTurn
              ? '#22C55E'
              : isDark
              ? 'rgba(255,255,255,0.06)'
              : '#E0E8E2',
          },
          isCurrentTurn && styles.activeBarGlow,
        ]}
      >
        {/* Animated breathing glow border on active turn */}
        {isCurrentTurn && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activeGlowOverlay,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.35, 0.9],
                }),
              },
            ]}
          />
        )}

        {/* Left: Avatar & Info */}
        <View style={styles.playerInfoRow}>
          <View style={styles.avatarWrap}>
            {/* Animated Radar Pulse Ring on Avatar */}
            {isCurrentTurn && (
              <Animated.View
                style={[
                  styles.avatarPulseRing,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 0.85],
                    }),
                    transform: [
                      {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.14],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}
            <LinearGradient
              colors={
                isWhite
                  ? ['#F0C64A', '#D4A017', '#9C6C0C']
                  : ['#4A5260', '#252B35', '#14181F']
              }
              style={[
                styles.avatar,
                isCurrentTurn && styles.activeAvatarGlow,
              ]}
            >
              <Text style={styles.avatarText}>{avatarText}</Text>
            </LinearGradient>
            <View
              style={[
                styles.colorBadge,
                { backgroundColor: isWhite ? '#FFFFFF' : '#1C1F24' },
              ]}
            >
              <FastImage
                source={CHESS_PIECE_IMAGES[color].king}
                style={styles.kingBadgeImg as any}
                resizeMode={FastImage.resizeMode.contain}
              />
            </View>
          </View>

          <View style={styles.nameBlock}>
            <View style={styles.nameHeaderRow}>
              <Text
                style={[
                  styles.playerName,
                  {
                    color: isCurrentTurn
                      ? isDark
                        ? '#FFFFFF'
                        : '#0B291A'
                      : isDark
                      ? '#869A8E'
                      : '#6B7F74',
                    fontWeight: isCurrentTurn ? '800' : '600',
                  },
                ]}
                numberOfLines={1}
              >
                {name}
              </Text>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>{rating}</Text>
              </View>
            </View>

            {/* Captured Pieces Mini Ribbon */}
            <View style={styles.capturedRow}>
              {capturedPieces.slice(-6).map((p, idx) => {
                const img = CHESS_PIECE_IMAGES[p.color]?.[p.type];
                return img ? (
                  <FastImage
                    key={`cap_${p.id}_${idx}`}
                    source={img}
                    style={styles.capturedPieceImg as any}
                    resizeMode={FastImage.resizeMode.contain}
                  />
                ) : null;
              })}
              {materialAdvantage > 0 && (
                <View style={styles.advantageBadge}>
                  <Text style={styles.advantageText}>+{materialAdvantage}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Right: Clock & Status */}
        <View style={styles.rightCol}>
          <View
            style={[
              styles.timerPill,
              isCurrentTurn
                ? isLowTime
                  ? styles.timerPillLowTime
                  : styles.timerPillActive
                : styles.timerPillInactive,
            ]}
          >
            <Text style={styles.timerIcon}>{isLowTime ? '⚠️' : '⏱️'}</Text>
            <Text
              style={[
                styles.timerText,
                isCurrentTurn
                  ? isLowTime
                    ? styles.timerTextLowTime
                    : styles.timerTextActive
                  : styles.timerTextInactive,
              ]}
            >
              {formatTime(timeLeftSeconds)}
            </Text>
          </View>
          <View
            style={[
              styles.turnBadge,
              {
                backgroundColor: isCurrentTurn
                  ? 'rgba(34, 197, 94, 0.18)'
                  : 'transparent',
                borderColor: isCurrentTurn
                  ? 'rgba(34, 197, 94, 0.35)'
                  : 'transparent',
              },
            ]}
          >
            {isCurrentTurn && (
              <View style={styles.dotPulseWrap}>
                <Animated.View
                  style={[
                    styles.turnDotRadar,
                    {
                      opacity: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.7, 0.1],
                      }),
                      transform: [
                        {
                          scale: pulseAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 2.2],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <View style={styles.turnDotActive} />
              </View>
            )}
            <Text
              style={[
                styles.statusSub,
                {
                  color: isCurrentTurn
                    ? '#22C55E'
                    : isDark
                    ? '#5C7A6A'
                    : '#8A9E92',
                  opacity: statusText ? 1 : isCurrentTurn ? 1 : 0,
                  fontWeight: isCurrentTurn ? '800' : '600',
                },
              ]}
            >
              {statusText || (isCurrentTurn ? 'TURN' : '')}
            </Text>
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 60,
    borderRadius: 14,
    borderWidth: 1.5,
    marginHorizontal: 14,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  activeBarGlow: {
    borderColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 8,
  },
  activeGlowOverlay: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    left: -2,
    right: -2,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  playerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 10,
  },
  avatarPulseRing: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    left: -4,
    right: -4,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  activeAvatarGlow: {
    borderColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  colorBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#141A16',
  },
  kingBadgeImg: {
    width: 13,
    height: 13,
  },
  capturedPieceImg: {
    width: 16,
    height: 16,
    marginHorizontal: 0.5,
  },
  nameBlock: {
    flex: 1,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    fontSize: 14,
    maxWidth: 110,
  },
  ratingBadge: {
    backgroundColor: 'rgba(212, 160, 23, 0.18)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 0.8,
    borderColor: 'rgba(212, 160, 23, 0.4)',
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F0C64A',
  },
  capturedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 2,
  },
  capturedGlyph: {
    fontSize: 13,
    lineHeight: 15,
  },
  advantageBadge: {
    backgroundColor: '#1F9D55',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 3,
  },
  advantageText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 5,
  },
  timerPillActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    borderColor: '#22C55E',
  },
  timerPillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  timerPillLowTime: {
    backgroundColor: 'rgba(230, 72, 58, 0.25)',
    borderColor: '#E6483A',
  },
  timerIcon: {
    fontSize: 12,
  },
  timerText: {
    fontSize: 14.5,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timerTextActive: {
    color: '#22C55E',
  },
  timerTextInactive: {
    color: '#869A8E',
  },
  timerTextLowTime: {
    color: '#FF6A5C',
  },
  turnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginTop: 2,
    gap: 4,
    borderWidth: 0.8,
  },
  dotPulseWrap: {
    position: 'relative',
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnDotRadar: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  turnDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  statusSub: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
});

export default ChessPlayerBar;
