import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  LudoGameState,
  LudoPlayer,
  LudoToken,
  LudoPlayerColor,
} from '../../../../gameEngine/ludo/ludoTypes';
import {
  LUDO_COLOR_THEMES,
  LUDO_6P_COLORS,
  LUDO_6P_SAFE_CELLS,
  LUDO_6P_START_INDICES,
} from '../../../../gameEngine/ludo/ludoConstants';
import LudoTokenView from './LudoTokenView';

const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 24, 380);
const CENTER_OFFSET = BOARD_SIZE / 2;

interface LudoBoard6PProps {
  gameState: LudoGameState;
  selectableTokenIds: string[];
  onSelectToken: (tokenId: string) => void;
  activeColor: LudoPlayerColor;
}

export const LudoBoard6P: React.FC<LudoBoard6PProps> = ({
  gameState,
  selectableTokenIds,
  onSelectToken,
  activeColor,
}) => {
  // 6 Arm angles (degrees) for the 6 colors:
  // Red (90° / bottom), Purple (150° / bottom-left), Orange (210° / top-left),
  // Green (270° / top), Yellow (330° / top-right), Blue (30° / bottom-right)
  const ARM_CONFIG: Record<LudoPlayerColor, { angle: number; basePos: { x: number; y: number } }> = {
    red: { angle: 90, basePos: { x: 0.5, y: 0.85 } },
    purple: { angle: 150, basePos: { x: 0.16, y: 0.68 } },
    orange: { angle: 210, basePos: { x: 0.16, y: 0.32 } },
    green: { angle: 270, basePos: { x: 0.5, y: 0.15 } },
    yellow: { angle: 330, basePos: { x: 0.84, y: 0.32 } },
    blue: { angle: 30, basePos: { x: 0.84, y: 0.68 } },
  };

  const renderHomeYard6P = (color: LudoPlayerColor) => {
    const theme = LUDO_COLOR_THEMES[color];
    const player = gameState.players.find((p) => p.color === color);
    const homeTokens = player?.tokens.filter((t) => t.status === 'home') || [];
    const config = ARM_CONFIG[color];

    const posX = config.basePos.x * BOARD_SIZE - 40;
    const posY = config.basePos.y * BOARD_SIZE - 40;

    return (
      <View
        key={`yard_${color}`}
        style={[
          styles.yardBox6P,
          {
            left: posX,
            top: posY,
            backgroundColor: theme.primary,
            borderColor: theme.dark,
          },
        ]}
      >
        <View style={styles.yardInnerBox6P}>
          <View style={styles.yardSlotsRow6P}>
            {[0, 1, 2, 3].map((slotIdx) => {
              const token = homeTokens.find((t) => t.tokenIndex === slotIdx);
              const isSelectable = token ? selectableTokenIds.includes(token.id) : false;

              return (
                <View
                  key={slotIdx}
                  style={[
                    styles.slotCircle6P,
                    { backgroundColor: theme.light, borderColor: theme.dark },
                  ]}
                >
                  {token ? (
                    <LudoTokenView
                      color={color}
                      size={17}
                      isSelectable={isSelectable}
                      onPress={isSelectable ? () => onSelectToken(token.id) : undefined}
                    />
                  ) : (
                    <View style={[styles.emptyDot6P, { backgroundColor: theme.primary }]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  // Render 6 Home Track Corridors
  const renderHomeCorridors = () => {
    return LUDO_6P_COLORS.map((color) => {
      const theme = LUDO_COLOR_THEMES[color];
      const player = gameState.players.find((p) => p.color === color);
      const corridorTokens = player?.tokens.filter((t) => t.status === 'active' && t.stepCount >= 72) || [];
      const config = ARM_CONFIG[color];
      const rad = (config.angle * Math.PI) / 180;

      // 5 cells along the corridor from radius 45px to 110px
      return (
        <React.Fragment key={`corridor_${color}`}>
          {[0, 1, 2, 3, 4].map((stepIdx) => {
            const dist = 38 + stepIdx * 16;
            const cx = CENTER_OFFSET + Math.cos(rad) * dist - 10;
            const cy = CENTER_OFFSET + Math.sin(rad) * dist - 10;
            const stepNum = 72 + stepIdx;
            const tokenOnCell = corridorTokens.find((t) => t.stepCount === stepNum);
            const isSelectable = tokenOnCell ? selectableTokenIds.includes(tokenOnCell.id) : false;

            return (
              <View
                key={`corr_${color}_${stepIdx}`}
                style={[
                  styles.corridorCell6P,
                  {
                    left: cx,
                    top: cy,
                    backgroundColor: theme.primary,
                    borderColor: '#FFFFFF',
                  },
                ]}
              >
                {tokenOnCell ? (
                  <LudoTokenView
                    color={color}
                    size={18}
                    isSelectable={isSelectable}
                    onPress={isSelectable ? () => onSelectToken(tokenOnCell.id) : undefined}
                  />
                ) : (
                  <Text style={styles.corridorArrow}>▲</Text>
                )}
              </View>
            );
          })}
        </React.Fragment>
      );
    });
  };

  // Render Active Track Perimeter Cells for 6-Player board
  const renderPerimeterTrack = () => {
    // 72 total steps distributed evenly around circle (radius = 135px)
    const activeTokens = gameState.players.flatMap((p) =>
      p.tokens.filter((t) => t.status === 'active' && t.stepCount < 72),
    );

    return Array.from({ length: 72 }, (_, stepIdx) => {
      // Angle for stepIdx (starts at bottom Red arm)
      const angleDeg = 90 + (stepIdx * 360) / 72;
      const rad = (angleDeg * Math.PI) / 180;
      const radius = 136;
      const cx = CENTER_OFFSET + Math.cos(rad) * radius - 9;
      const cy = CENTER_OFFSET + Math.sin(rad) * radius - 9;

      const isSafe = LUDO_6P_SAFE_CELLS.includes(stepIdx);
      const isStart = Object.values(LUDO_6P_START_INDICES).includes(stepIdx);

      // Find token on this track cell
      const matchingTokens = activeTokens.filter((tok) => {
        const startIdx = LUDO_6P_START_INDICES[tok.color] || 0;
        return (startIdx + tok.stepCount) % 72 === stepIdx;
      });

      return (
        <View
          key={`track_${stepIdx}`}
          style={[
            styles.trackCell6P,
            {
              left: cx,
              top: cy,
              backgroundColor: isStart ? '#F8F9F9' : '#FFFFFF',
              borderColor: isSafe ? '#F1C40F' : '#BDC3C7',
            },
          ]}
        >
          {matchingTokens.length > 0 ? (
            <LudoTokenView
              color={matchingTokens[0].color}
              size={18}
              isSelectable={selectableTokenIds.includes(matchingTokens[0].id)}
              onPress={
                selectableTokenIds.includes(matchingTokens[0].id)
                  ? () => onSelectToken(matchingTokens[0].id)
                  : undefined
              }
              stackCount={matchingTokens.length}
            />
          ) : isSafe ? (
            <Text style={styles.starText6P}>★</Text>
          ) : null}
        </View>
      );
    });
  };

  // Center Finished Hub
  const finishedTokens = gameState.players.flatMap((p) =>
    p.tokens.filter((t) => t.status === 'finished'),
  );

  return (
    <View style={styles.shadowWrap}>
      <View style={[styles.board6PContainer, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
        {/* Background Hex Pattern */}
        <LinearGradient
          colors={['#1E272E', '#2C3E50', '#17202A']}
          style={styles.bgGradient}
        />

        {/* 6 Home Yards */}
        {LUDO_6P_COLORS.map((color) => renderHomeYard6P(color))}

        {/* 6 Home Corridors */}
        {renderHomeCorridors()}

        {/* 72 Perimeter Track Nodes */}
        {renderPerimeterTrack()}

        {/* Center Star Trophy Hub */}
        <View
          style={[
            styles.centerHub6P,
            {
              left: CENTER_OFFSET - 32,
              top: CENTER_OFFSET - 32,
            },
          ]}
        >
          <LinearGradient
            colors={['#F1C40F', '#D4AC0D', '#B7950B']}
            style={styles.centerHubGrad}
          >
            {finishedTokens.length > 0 ? (
              <View style={styles.centerFinishedWrap}>
                {finishedTokens.slice(0, 6).map((tok) => (
                  <LudoTokenView
                    key={tok.id}
                    color={tok.color}
                    size={14}
                    isFinished={true}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.centerTrophyEmoji}>🏆</Text>
            )}
          </LinearGradient>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 12,
  },
  board6PContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#34495E',
    position: 'relative',
    backgroundColor: '#1E272E',
  },
  bgGradient: {
    ...StyleSheet.absoluteFill,
  },
  yardBox6P: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 16,
    padding: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  yardInnerBox6P: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yardSlotsRow6P: {
    width: '90%',
    height: '90%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignContent: 'space-around',
  },
  slotCircle6P: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDot6P: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.5,
  },
  corridorCell6P: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  corridorArrow: {
    fontSize: 9,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  trackCell6P: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  starText6P: {
    fontSize: 10,
    color: '#F1C40F',
    fontWeight: '900',
  },
  centerHub6P: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  centerHubGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTrophyEmoji: {
    fontSize: 24,
  },
  centerFinishedWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
  },
});

export default LudoBoard6P;
