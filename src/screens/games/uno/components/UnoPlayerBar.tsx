import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { UnoPlayer } from '../../../../gameEngine/uno/unoTypes';
import UnoShoutButton from './UnoShoutButton';

interface UnoPlayerBarProps {
  player: UnoPlayer;
  isMyTurn: boolean;
  timeLeft: number;
  maxTime?: number;
  onShoutUno: () => void;
  canShoutUno: boolean;
}

export const UnoPlayerBar: React.FC<UnoPlayerBarProps> = ({
  player,
  isMyTurn,
  timeLeft,
  maxTime = 15,
  onShoutUno,
  canShoutUno,
}) => {
  const timeFraction = Math.max(0, Math.min(1, timeLeft / maxTime));
  const isTimeCritical = timeLeft <= 5;

  return (
    <View style={styles.container}>
      {/* Left: Avatar & Name */}
      <View style={styles.leftProfile}>
        <View
          style={[
            styles.avatarGlowWrap,
            isMyTurn && styles.myTurnGlow,
          ]}
        >
          <LinearGradient
            colors={isMyTurn ? ['#2ECC71', '#1B8A4C'] : ['#2C3E50', '#1A252F']}
            style={styles.avatarCircle}
          >
            <Text style={styles.avatarEmoji}>{player.avatar || '👤'}</Text>
          </LinearGradient>
        </View>

        <View style={styles.infoBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.playerName} numberOfLines={1}>
              {player.name}
            </Text>
            <View style={styles.youTag}>
              <Text style={styles.youTagText}>YOU</Text>
            </View>
          </View>

          {/* Turn timer status or card count */}
          {isMyTurn ? (
            <View style={styles.timerRow}>
              <View style={styles.timerTrack}>
                <View
                  style={[
                    styles.timerFill,
                    {
                      width: `${timeFraction * 100}%`,
                      backgroundColor: isTimeCritical ? '#E74C3C' : '#2ECC71',
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.timerText,
                  { color: isTimeCritical ? '#FF4D4D' : '#2ECC71' },
                ]}
              >
                {timeLeft}s
              </Text>
            </View>
          ) : (
            <Text style={styles.waitingText}>Waiting for turn...</Text>
          )}
        </View>
      </View>

      {/* Right: UNO Shout Button */}
      {(canShoutUno || player.hand.length <= 2) && (
        <View style={styles.rightAction}>
          <UnoShoutButton
            onPress={onShoutUno}
            hasCalledUno={player.hasCalledUno}
            disabled={!canShoutUno && player.hasCalledUno}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(10, 18, 14, 0.95)',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  leftProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarGlowWrap: {
    padding: 2,
    borderRadius: 22,
  },
  myTurnGlow: {
    backgroundColor: '#2ECC71',
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  infoBlock: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    maxWidth: 130,
  },
  youTag: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  youTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#2ECC71',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  timerTrack: {
    flex: 1,
    maxWidth: 100,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: 3,
  },
  timerText: {
    fontSize: 11,
    fontWeight: '800',
  },
  waitingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7A9182',
    marginTop: 2,
  },
  rightAction: {
    marginLeft: 10,
  },
});

export default UnoPlayerBar;
