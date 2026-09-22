import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import {
  LudoGameState,
  LudoPlayer,
  LudoToken,
  LudoPlayerColor,
} from '../../../../gameEngine/ludo/ludoTypes';
import {
  LUDO_COLOR_THEMES,
  LUDO_5P_COLORS,
  LUDO_5P_SAFE_CELLS,
  LUDO_5P_START_INDICES,
} from '../../../../gameEngine/ludo/ludoConstants';
import LudoTokenView from './LudoTokenView';
import { soundService } from '../../../../services/sound/soundService';
import { vibrationService } from '../../../../services/vibration/vibrationService';

const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 24, 380);
const CENTER = BOARD_SIZE / 2;

interface LudoBoard5PProps {
  gameState: LudoGameState;
  selectableTokenIds: string[];
  onSelectToken: (tokenId: string) => void;
  activeColor: LudoPlayerColor;
}

export const LudoBoard5P: React.FC<LudoBoard5PProps> = ({
  gameState,
  selectableTokenIds,
  onSelectToken,
  activeColor,
}) => {
  // 5 Arm angles (degrees) for the 5 colors in clockwise order:
  // Red (234° / Top-Left), Green (306° / Top-Right), Yellow (18° / Bottom-Right),
  // Blue (90° / Bottom-Center), Purple (162° / Bottom-Left)
  const ARM_CONFIG: Record<
    LudoPlayerColor,
    { angle: number; basePos: { x: number; y: number }; arrow: string }
  > = {
    red: { angle: 234, basePos: { x: 0.22, y: 0.22 }, arrow: '↘' },
    green: { angle: 306, basePos: { x: 0.78, y: 0.22 }, arrow: '↙' },
    yellow: { angle: 18, basePos: { x: 0.84, y: 0.62 }, arrow: '⬅' },
    blue: { angle: 90, basePos: { x: 0.5, y: 0.84 }, arrow: '⬆' },
    purple: { angle: 162, basePos: { x: 0.16, y: 0.62 }, arrow: '➡' },
    orange: { angle: 234, basePos: { x: 0.22, y: 0.22 }, arrow: '↘' },
  };

  // Helper to render Yard Box (4 tokens) for a color
  const renderHomeYard5P = (color: LudoPlayerColor) => {
    const theme = LUDO_COLOR_THEMES[color] || LUDO_COLOR_THEMES.red;
    const player = gameState.players.find((p) => p.color === color);
    const isYardActive = Boolean(player);
    const homeTokens = player?.tokens.filter((t) => t.status === 'home') || [];
    const config = ARM_CONFIG[color] || ARM_CONFIG.red;

    const posX = config.basePos.x * BOARD_SIZE - 38;
    const posY = config.basePos.y * BOARD_SIZE - 38;

    return (
      <View
        key={`yard_${color}`}
        style={[
          styles.yardBox5P,
          {
            left: posX,
            top: posY,
            backgroundColor: theme.primary,
            borderColor: theme.dark,
            opacity: isYardActive ? 1 : 0.4,
          },
        ]}
      >
        <View style={[styles.yardInnerBox5P, { borderColor: theme.dark }]}>
          <View style={styles.yardSlotsGrid5P}>
            {[0, 1, 2, 3].map((slotIdx) => {
              const token = homeTokens.find((t) => t.tokenIndex === slotIdx);
              const isSelectable = token ? selectableTokenIds.includes(token.id) : false;

              return (
                <View
                  key={slotIdx}
                  style={[
                    styles.slotCircle5P,
                    { backgroundColor: theme.light, borderColor: theme.primary },
                  ]}
                >
                  {token ? (
                    <LudoTokenView
                      color={color}
                      size={20}
                      isSelectable={isSelectable}
                      onPress={isSelectable ? () => onSelectToken(token.id) : undefined}
                    />
                  ) : (
                    <View style={[styles.emptyDot5P, { backgroundColor: theme.primary }]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  // Render 5 Home Corridors (5 cells each) leading from perimeter to center
  const renderHomeCorridors = () => {
    return LUDO_5P_COLORS.map((color) => {
      const theme = LUDO_COLOR_THEMES[color] || LUDO_COLOR_THEMES.red;
      const player = gameState.players.find((p) => p.color === color);
      const corridorTokens =
        player?.tokens.filter((t) => t.status === 'active' && t.stepCount >= 59) || [];
      const config = ARM_CONFIG[color] || ARM_CONFIG.red;
      const rad = (config.angle * Math.PI) / 180;

      return (
        <React.Fragment key={`corridor_${color}`}>
          {[0, 1, 2, 3, 4].map((stepIdx) => {
            const dist = 36 + stepIdx * 17;
            const cx = CENTER + Math.cos(rad) * dist - 11;
            const cy = CENTER + Math.sin(rad) * dist - 11;
            const stepNum = 59 + stepIdx;
            const tokensOnCell = corridorTokens.filter((t) => t.stepCount === stepNum);
            const tokenOnCell = tokensOnCell[0];
            const isSelectable = tokenOnCell ? selectableTokenIds.includes(tokenOnCell.id) : false;

            return (
              <View
                key={`corr_${color}_${stepIdx}`}
                style={[
                  styles.corridorCell5P,
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
                    size={20}
                    isSelectable={isSelectable}
                    onPress={isSelectable ? () => onSelectToken(tokenOnCell.id) : undefined}
                    stackCount={tokensOnCell.length}
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

  // Render 60 Outer Perimeter Track Cells
  const renderTrackCells = () => {
    const TOTAL_TRACK_CELLS = 60;
    const trackRadius = BOARD_SIZE * 0.44;

    return Array.from({ length: TOTAL_TRACK_CELLS }).map((_, trackIdx) => {
      // Angle for this cell along the 360° circle
      const angleDeg = (trackIdx * 360) / TOTAL_TRACK_CELLS - 90;
      const rad = (angleDeg * Math.PI) / 180;
      const cx = CENTER + Math.cos(rad) * trackRadius - 10;
      const cy = CENTER + Math.sin(rad) * trackRadius - 10;

      // Find which color this start cell belongs to
      let startColor: LudoPlayerColor | null = null;
      for (const [c, startIdx] of Object.entries(LUDO_5P_START_INDICES)) {
        if (startIdx === trackIdx && LUDO_5P_COLORS.includes(c as LudoPlayerColor)) {
          startColor = c as LudoPlayerColor;
          break;
        }
      }

      const isSafe = LUDO_5P_SAFE_CELLS.includes(trackIdx);
      const startTheme = startColor ? LUDO_COLOR_THEMES[startColor] : null;

      // Find any tokens occupying this perimeter cell
      const activeTokensOnCell: Array<{ token: LudoToken; player: LudoPlayer }> = [];
      for (const player of gameState.players) {
        for (const token of player.tokens) {
          if (token.status === 'active' && token.stepCount < 59) {
            const startIdx = LUDO_5P_START_INDICES[player.color] || 0;
            const currentTrackIdx = (startIdx + token.stepCount) % TOTAL_TRACK_CELLS;
            if (currentTrackIdx === trackIdx) {
              activeTokensOnCell.push({ token, player });
            }
          }
        }
      }

      const cellBgColor = startTheme ? startTheme.primary : '#FFFFFF';
      const cellBorderColor = isSafe ? '#F59E0B' : '#94A3B8';

      return (
        <View
          key={`track_${trackIdx}`}
          style={[
            styles.trackCell5P,
            {
              left: cx,
              top: cy,
              backgroundColor: cellBgColor,
              borderColor: cellBorderColor,
              borderWidth: isSafe ? 1.5 : 1,
            },
          ]}
        >
          {activeTokensOnCell.length > 0 ? (
            <View style={styles.tokenStackWrap}>
              {activeTokensOnCell.map(({ token, player }, idx) => {
                const isSelectable = selectableTokenIds.includes(token.id);
                return (
                  <View
                    key={token.id}
                    style={[
                      styles.tokenStackItem,
                      activeTokensOnCell.length > 1
                        ? {
                            transform: [
                              { translateX: (idx - (activeTokensOnCell.length - 1) / 2) * 3 },
                              { translateY: (idx - (activeTokensOnCell.length - 1) / 2) * 3 },
                            ],
                          }
                        : {},
                    ]}
                  >
                    <LudoTokenView
                      color={player.color}
                      size={20}
                      isSelectable={isSelectable}
                      onPress={isSelectable ? () => onSelectToken(token.id) : undefined}
                      stackCount={activeTokensOnCell.length}
                    />
                  </View>
                );
              })}
            </View>
          ) : isSafe ? (
            <Text style={styles.starText}>★</Text>
          ) : startColor ? (
            <Text style={styles.startCellIcon}>●</Text>
          ) : null}
        </View>
      );
    });
  };

  // Render 5-Player Center Home Pentagon
  const renderCenterHome5P = () => {
    const finishedTokens: Array<{ token: LudoToken; color: LudoPlayerColor }> = [];
    for (const player of gameState.players) {
      for (const token of player.tokens) {
        if (token.status === 'finished') {
          finishedTokens.push({ token, color: player.color });
        }
      }
    }

    return (
      <View style={styles.centerHomeWrap5P}>
        {/* Pentagonal 5-Color Meeting Wedges */}
        <View style={styles.centerStarCircle}>
          <Text style={styles.centerTrophyIcon}>🏆</Text>
        </View>

        {finishedTokens.length > 0 && (
          <View style={styles.centerFinishedTokens}>
            {finishedTokens.slice(0, 5).map(({ token, color }) => (
              <LudoTokenView key={token.id} color={color} size={16} isFinished={true} />
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.boardOuterBevel5P}>
      <View
        style={[
          styles.boardContainer5P,
          {
            width: BOARD_SIZE,
            height: BOARD_SIZE,
          },
        ]}
      >
        {/* Track Cells */}
        {renderTrackCells()}

        {/* 5 Home Corridors */}
        {renderHomeCorridors()}

        {/* 5 Corner Yards */}
        {LUDO_5P_COLORS.map((c) => renderHomeYard5P(c))}

        {/* Center Home */}
        {renderCenterHome5P()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  boardOuterBevel5P: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 26,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#334155',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.65,
    shadowRadius: 16,
    elevation: 14,
  },
  boardContainer5P: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
  },
  yardBox5P: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 18,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  yardInnerBox5P: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yardSlotsGrid5P: {
    width: '84%',
    height: '84%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  slotCircle5P: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDot5P: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.35,
  },
  corridorCell5P: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  corridorArrow: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    opacity: 0.7,
  },
  trackCell5P: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tokenStackWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenStackItem: {
    position: 'absolute',
  },
  starText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '900',
  },
  startCellIcon: {
    color: '#FFFFFF',
    fontSize: 8,
  },
  centerHomeWrap5P: {
    position: 'absolute',
    top: CENTER - 32,
    left: CENTER - 32,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  centerStarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  centerTrophyIcon: {
    fontSize: 22,
  },
  centerFinishedTokens: {
    position: 'absolute',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
});

export default LudoBoard5P;
