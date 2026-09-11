import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ChessColor, ChessPiece } from '../../../../gameEngine/chess/chessTypes';
import { CHESS_GLYPHS } from '../../../../gameEngine/chess/chessConstants';

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
            backgroundColor: isDark ? '#141A16' : '#FFFFFF',
            borderColor: isCurrentTurn
              ? '#D4A017'
              : isDark
              ? 'rgba(255,255,255,0.08)'
              : '#E2EBE5',
          },
          isCurrentTurn && styles.activeBarGlow,
        ]}
      >
        {/* Left: Avatar & Info */}
        <View style={styles.playerInfoRow}>
          <View style={styles.avatarWrap}>
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
              <Text style={{ fontSize: 10 }}>{isWhite ? '♔' : '♚'}</Text>
            </View>
          </View>

          <View style={styles.nameBlock}>
            <View style={styles.nameHeaderRow}>
              <Text
                style={[
                  styles.playerName,
                  { color: isDark ? '#F1F4F7' : '#1A2318' },
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
              {capturedPieces.slice(-6).map((p, idx) => (
                <Text
                  key={`cap_${p.id}_${idx}`}
                  style={[
                    styles.capturedGlyph,
                    { color: p.color === 'white' ? '#EEE4C8' : '#687280' },
                  ]}
                >
                  {CHESS_GLYPHS[p.color][p.type]}
                </Text>
              ))}
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
          {statusText ? (
            <Text
              style={[
                styles.statusSub,
                { color: isCurrentTurn ? '#5CF27A' : '#7A9485' },
              ]}
            >
              {statusText}
            </Text>
          ) : isCurrentTurn ? (
            <Text style={[styles.statusSub, { color: '#5CF27A' }]}>● Turn</Text>
          ) : null}
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
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1.5,
    marginHorizontal: 14,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  activeBarGlow: {
    borderColor: '#D4A017',
    shadowColor: '#D4A017',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
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
    borderColor: '#F0C64A',
    shadowColor: '#F0C64A',
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
    fontWeight: '700',
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
    paddingVertical: 5,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 5,
  },
  timerPillActive: {
    backgroundColor: 'rgba(212, 160, 23, 0.2)',
    borderColor: '#F0C64A',
  },
  timerPillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timerPillLowTime: {
    backgroundColor: 'rgba(230, 72, 58, 0.25)',
    borderColor: '#E6483A',
  },
  timerIcon: {
    fontSize: 12,
  },
  timerText: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timerTextActive: {
    color: '#F0C64A',
  },
  timerTextInactive: {
    color: '#96A1AD',
  },
  timerTextLowTime: {
    color: '#FF6A5C',
  },
  statusSub: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});

export default ChessPlayerBar;
