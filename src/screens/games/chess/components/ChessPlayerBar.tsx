import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
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
  isMe?: boolean;
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
    isMe = false,
  }) => {
    const isWhite = color === 'white';
    const pulseAnim = useRef(new Animated.Value(0)).current;

    // Smooth continuous breathing pulse for active player
    useEffect(() => {
      let animation: Animated.CompositeAnimation | null = null;
      if (isCurrentTurn) {
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 900,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 0,
              duration: 900,
              easing: Easing.inOut(Easing.quad),
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

    // Turn badge text
    const turnBadgeLabel = isCurrentTurn
      ? statusText || (isMe ? 'YOUR TURN' : "OPPONENT'S TURN")
      : '';

    return (
      <View
        style={[
          styles.container,
          {
            opacity: isCurrentTurn ? 1 : 0.65,
            borderColor: isCurrentTurn
              ? isLowTime
                ? '#EF4444'
                : '#10B981'
              : isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : '#E2E8F0',
          },
          isCurrentTurn && (isDark ? styles.activeGlowDark : styles.activeGlowLight),
        ]}
      >
        {/* Active Player Rich Gradient Background */}
        {isCurrentTurn ? (
          <LinearGradient
            colors={
              isDark
                ? isLowTime
                  ? ['#3B1212', '#1C0808']
                  : ['#0E3824', '#061D13']
                : isLowTime
                ? ['#FEE2E2', '#FEF2F2']
                : ['#DCFCE7', '#F0FDF4']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: isDark ? '#0F1714' : '#FFFFFF' },
            ]}
          />
        )}

        {/* Pulsing Left Accent Glow Bar */}
        {isCurrentTurn && (
          <Animated.View
            style={[
              styles.activeIndicatorBar,
              {
                backgroundColor: isLowTime ? '#EF4444' : '#10B981',
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.75, 1],
                }),
                transform: [
                  {
                    scaleY: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1.05],
                    }),
                  },
                ],
              },
            ]}
          />
        )}

        {/* Left: Avatar & Player Details */}
        <View style={styles.playerInfoRow}>
          <View style={styles.avatarWrap}>
            {/* Animated Radar Pulse Rings around Avatar on Active Turn */}
            {isCurrentTurn && (
              <>
                <Animated.View
                  style={[
                    styles.avatarHaloOuter,
                    {
                      borderColor: isLowTime ? '#EF4444' : '#10B981',
                      opacity: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.6, 0.1],
                      }),
                      transform: [
                        {
                          scale: pulseAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1.02, 1.25],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.avatarHaloInner,
                    {
                      borderColor: isLowTime ? '#EF4444' : '#34D399',
                      opacity: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 0.9],
                      }),
                    },
                  ]}
                />
              </>
            )}

            <LinearGradient
              colors={
                isWhite
                  ? ['#F59E0B', '#D97706', '#92400E']
                  : ['#475569', '#1E293B', '#0F172A']
              }
              style={[
                styles.avatar,
                isCurrentTurn && {
                  borderColor: isLowTime ? '#EF4444' : '#10B981',
                  borderWidth: 2,
                },
              ]}
            >
              <Text style={styles.avatarText}>{avatarText}</Text>
            </LinearGradient>

            {/* King Piece Badge */}
            <View
              style={[
                styles.colorBadge,
                {
                  backgroundColor: isWhite ? '#FFFFFF' : '#1E293B',
                  borderColor: isDark ? '#0A2016' : '#FFFFFF',
                },
              ]}
            >
              <FastImage
                source={CHESS_PIECE_IMAGES[color].king}
                style={styles.kingBadgeImg as any}
                resizeMode={FastImage.resizeMode.contain}
              />
            </View>
          </View>

          {/* Name & Captured Pieces Block */}
          <View style={styles.nameBlock}>
            <View style={styles.nameHeaderRow}>
              <Text
                style={[
                  styles.playerName,
                  {
                    color: isCurrentTurn
                      ? isDark
                        ? '#FFFFFF'
                        : '#064E3B'
                      : isDark
                      ? '#94A3B8'
                      : '#334155',
                    fontWeight: isCurrentTurn ? '800' : '600',
                  },
                ]}
                numberOfLines={1}
              >
                {name}
              </Text>
              <View
                style={[
                  styles.ratingBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(245, 158, 11, 0.18)'
                      : 'rgba(245, 158, 11, 0.12)',
                    borderColor: isDark
                      ? 'rgba(245, 158, 11, 0.45)'
                      : 'rgba(245, 158, 11, 0.3)',
                  },
                ]}
              >
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

        {/* Right: Modern Clock & Prominent Active Turn Badge */}
        <View style={styles.rightCol}>
          {/* Active / Inactive Timer Pill */}
          <View
            style={[
              styles.timerPill,
              isCurrentTurn
                ? isLowTime
                  ? styles.timerPillLowTime
                  : isDark
                  ? styles.timerPillActiveDark
                  : styles.timerPillActiveLight
                : isDark
                ? styles.timerPillInactiveDark
                : styles.timerPillInactiveLight,
            ]}
          >
            <Text style={styles.timerIcon}>{isLowTime ? '🔥' : '⏱️'}</Text>
            <Text
              style={[
                styles.timerText,
                isCurrentTurn
                  ? isLowTime
                    ? styles.timerTextLowTime
                    : isDark
                    ? styles.timerTextActiveDark
                    : styles.timerTextActiveLight
                  : isDark
                  ? styles.timerTextInactiveDark
                  : styles.timerTextInactiveLight,
              ]}
            >
              {formatTime(timeLeftSeconds)}
            </Text>
          </View>

          {/* High Visibility Turn Status Badge */}
          <Animated.View
            style={[
              styles.turnBadgeContainer,
              {
                opacity: isCurrentTurn ? 1 : 0,
                transform: [
                  {
                    scale: isCurrentTurn
                      ? pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.05],
                        })
                      : 1,
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={
                isLowTime
                  ? ['#EF4444', '#DC2626']
                  : isMe
                  ? ['#10B981', '#059669']
                  : ['#3B82F6', '#2563EB']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.turnBadgeGradient}
            >
              {/* Radar Dot */}
              <View style={styles.turnDotRadarWrap}>
                <Animated.View
                  style={[
                    styles.turnDotRadarOuter,
                    {
                      opacity: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.7, 0],
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
                <View style={styles.turnDotRadarInner} />
              </View>
              <Text style={styles.turnBadgeText}>{turnBadgeLabel}</Text>
            </LinearGradient>
          </Animated.View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 64,
    borderWidth: 1.5,
    borderRadius: 16,
    marginHorizontal: 14,
    marginVertical: 4,
    overflow: 'hidden',
  },
  activeGlowDark: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  activeGlowLight: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  activeIndicatorBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 4.5,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 10,
  },
  playerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    paddingLeft: 4,
    zIndex: 5,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHaloOuter: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    left: -4,
    right: -4,
    borderRadius: 18,
    borderWidth: 2,
  },
  avatarHaloInner: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    left: -2,
    right: -2,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  colorBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    zIndex: 6,
  },
  kingBadgeImg: {
    width: 12,
    height: 12,
  },
  nameBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    fontSize: 14.5,
    maxWidth: 120,
    letterSpacing: 0.2,
  },
  ratingBadge: {
    paddingHorizontal: 5.5,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 0.8,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  capturedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 1.5,
  },
  capturedPieceImg: {
    width: 15,
    height: 15,
  },
  advantageBadge: {
    backgroundColor: '#10B981',
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
    justifyContent: 'center',
    zIndex: 5,
    gap: 4,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 14,
    borderWidth: 1.2,
    gap: 4,
  },
  timerPillActiveDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  timerPillActiveLight: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  timerPillInactiveDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  timerPillInactiveLight: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  timerPillLowTime: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#EF4444',
  },
  timerIcon: {
    fontSize: 11.5,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  timerTextActiveDark: {
    color: '#34D399',
  },
  timerTextActiveLight: {
    color: '#065F46',
  },
  timerTextInactiveDark: {
    color: '#64748B',
  },
  timerTextInactiveLight: {
    color: '#64748B',
  },
  timerTextLowTime: {
    color: '#EF4444',
  },
  turnBadgeContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  turnBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    gap: 4,
  },
  turnDotRadarWrap: {
    position: 'relative',
    width: 6,
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnDotRadarOuter: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  turnDotRadarInner: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    backgroundColor: '#FFFFFF',
  },
  turnBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
});

export default ChessPlayerBar;
