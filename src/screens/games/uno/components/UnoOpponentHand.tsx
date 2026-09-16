import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { UnoPlayer } from '../../../../gameEngine/uno/unoTypes';
import UnoCardView from './UnoCardView';

interface UnoOpponentHandProps {
  player: UnoPlayer;
  isCurrentTurn: boolean;
  position?: 'top' | 'topRight' | 'right' | 'bottomRight' | 'bottomLeft' | 'left' | 'topLeft' | 'bottom';
  ringColor?: string;
  isMe?: boolean;
  timeLeft?: number;
  maxTime?: number;
  lastActionText?: string;
  onCatchUno?: (playerId: string) => void;
  canCatchUno?: boolean;
}

export const UnoOpponentHand: React.FC<UnoOpponentHandProps> = ({
  player,
  isCurrentTurn,
  position = 'top',
  ringColor = '#2ECC71',
  isMe = false,
  timeLeft = 15,
  maxTime = 15,
  lastActionText,
  onCatchUno,
  canCatchUno = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bubbleScaleAnim = useRef(new Animated.Value(0)).current;

  // Pulse avatar ring with high-intensity scale when it's this player's turn
  useEffect(() => {
    let anim: Animated.CompositeAnimation;
    if (isCurrentTurn) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.16,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
      );
      anim.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => anim?.stop();
  }, [isCurrentTurn]);

  // Action speech bubble animation
  useEffect(() => {
    if (lastActionText) {
      bubbleScaleAnim.setValue(0);
      Animated.spring(bubbleScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 45,
        useNativeDriver: true,
      }).start();
    }
  }, [lastActionText]);

  const cardsCount = player.hand ? player.hand.length : 0;
  const visualCardsCount = Math.min(4, Math.max(1, cardsCount));
  const dummyFanCards = Array.from({ length: visualCardsCount });

  return (
    <View style={[styles.seatContainer, isCurrentTurn && styles.activeSeatElevated]}>
      {/* Speech Action Bubble */}
      {lastActionText ? (
        <Animated.View
          style={[
            styles.speechBubbleContainer,
            { transform: [{ scale: bubbleScaleAnim }] },
          ]}
        >
          <LinearGradient
            colors={['#1E272E', '#0D1117']}
            style={styles.speechBubbleGradient}
          >
            <Text style={styles.speechBubbleText} numberOfLines={2}>
              {lastActionText}
            </Text>
          </LinearGradient>
        </Animated.View>
      ) : null}

      {/* Catch UNO Alert Button */}
      {canCatchUno && onCatchUno && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.catchUnoBtn}
          onPress={() => onCatchUno(player.id)}
        >
          <LinearGradient
            colors={['#E74C3C', '#C0392B']}
            style={styles.catchGradient}
          >
            <Text style={styles.catchText}>⚡ CATCH UNO!</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Host Crown */}
      {player.isHost && (
        <View style={styles.crownWrapper}>
          <Text style={styles.crownEmoji}>👑</Text>
        </View>
      )}

      {/* Active Turn Pulsing Glow Arrow (Pointing at active avatar) */}
      {isCurrentTurn && (
        <View style={styles.topTurnArrowWrap}>
          <Text style={styles.topTurnArrowGlyph}>▼</Text>
        </View>
      )}

      {/* Avatar Container with High-Intensity Glowing Ring */}
      <View style={styles.avatarGlowWrapper}>
        <Animated.View
          style={[
            styles.avatarRing,
            isCurrentTurn
              ? styles.activeAvatarRingGlow
              : {
                  borderColor: ringColor,
                  shadowColor: ringColor,
                  shadowOpacity: 0.45,
                  shadowRadius: 4,
                },
            { transform: [{ scale: isCurrentTurn ? pulseAnim : 1 }] },
          ]}
        >
          <LinearGradient
            colors={
              isCurrentTurn
                ? ['#2ECC71', '#1B8A4C']
                : ['#2D3436', '#1E272E']
            }
            style={styles.avatarInnerCircle}
          >
            {player.avatar && (player.avatar.startsWith('http') || player.avatar.startsWith('file:') || player.avatar.startsWith('data:')) ? (
              <Image source={{ uri: player.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarEmojiText}>{player.avatar || '👤'}</Text>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Card Count Circular Badge */}
        <View
          style={[
            styles.cardCountBadge,
            isCurrentTurn && styles.cardCountBadgeActive,
          ]}
        >
          <Text style={styles.cardCountText}>{cardsCount}</Text>
        </View>
      </View>

      {/* Player Name Pill (Highlights brightly on turn) */}
      <View
        style={[
          styles.namePill,
          isCurrentTurn && styles.namePillActive,
        ]}
      >
        <Text
          style={[
            styles.namePillText,
            isCurrentTurn && styles.namePillTextActive,
          ]}
          numberOfLines={1}
        >
          {player.name || (isMe ? 'You' : 'Player')}
        </Text>
      </View>

      {/* Turn Status Timer Badge */}
      {isCurrentTurn && (
        <View style={styles.activeTurnTimerBadge}>
          <Text style={styles.activeTurnTimerText}>
            {isMe ? `⏳ ${timeLeft}s` : player.isBot ? `🤖 ${timeLeft}s` : `⏳ ${timeLeft}s`}
          </Text>
        </View>
      )}

      {/* Mini Fanned Uno Cards */}
      {!isMe && cardsCount > 0 && (
        <View style={styles.miniCardFanRow}>
          {dummyFanCards.map((_, idx) => {
            const total = visualCardsCount;
            const mid = (total - 1) / 2;
            const offset = idx - mid;
            const rotation = offset * 8;
            const yOffset = Math.abs(offset) * 1.2;

            return (
              <View
                key={idx}
                style={[
                  styles.miniCardWrapper,
                  {
                    marginLeft: idx === 0 ? 0 : -10,
                    transform: [
                      { rotate: `${rotation}deg` },
                      { translateY: yOffset },
                    ],
                    zIndex: 10 + idx,
                  },
                ]}
              >
                <UnoCardView isBack size="mini" />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  seatContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minWidth: 54,
    zIndex: 10,
  },
  activeSeatElevated: {
    zIndex: 35,
  },
  crownWrapper: {
    marginBottom: -3,
    zIndex: 6,
  },
  crownEmoji: {
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  topTurnArrowWrap: {
    marginBottom: -2,
    zIndex: 8,
  },
  topTurnArrowGlyph: {
    fontSize: 13,
    color: '#2ECC71',
    fontWeight: '900',
    textShadowColor: 'rgba(46, 204, 113, 0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  avatarGlowWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    padding: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E272E',
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  activeAvatarRingGlow: {
    borderWidth: 3,
    borderColor: '#2ECC71',
    backgroundColor: '#2ECC71',
    shadowColor: '#2ECC71',
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 10,
  },
  avatarInnerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarEmojiText: {
    fontSize: 18,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  cardCountBadge: {
    position: 'absolute',
    bottom: -2,
    right: -3,
    backgroundColor: '#192A56',
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#718093',
    paddingHorizontal: 2,
    zIndex: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 4,
  },
  cardCountBadgeActive: {
    backgroundColor: '#E74C3C',
    borderColor: '#FFFFFF',
  },
  cardCountText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  namePill: {
    backgroundColor: 'rgba(15, 20, 25, 0.88)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginTop: 2,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    maxWidth: 62,
  },
  namePillActive: {
    backgroundColor: '#2ECC71',
    borderColor: '#FFFFFF',
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
  namePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F5F6FA',
    textAlign: 'center',
  },
  namePillTextActive: {
    color: '#062814',
    fontWeight: '900',
  },
  activeTurnTimerBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.25)',
    borderWidth: 1,
    borderColor: '#2ECC71',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop: 2,
    alignItems: 'center',
  },
  activeTurnTimerText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#2ECC71',
    letterSpacing: 0.3,
  },
  miniCardFanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    height: 26,
  },
  miniCardWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
  },
  speechBubbleContainer: {
    position: 'absolute',
    top: -24,
    zIndex: 25,
    alignItems: 'center',
  },
  speechBubbleGradient: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1C40F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  speechBubbleText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#F1C40F',
    textAlign: 'center',
  },
  catchUnoBtn: {
    position: 'absolute',
    top: -20,
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 30,
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 6,
  },
  catchGradient: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  catchText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default UnoOpponentHand;
