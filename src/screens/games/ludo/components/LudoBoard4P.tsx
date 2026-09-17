import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  LudoGameState,
  LudoPlayer,
  LudoToken,
  LudoPlayerColor,
} from '../../../../gameEngine/ludo/ludoTypes';
import { LUDO_COLOR_THEMES } from '../../../../gameEngine/ludo/ludoConstants';
import { LudoPath } from '../../../../gameEngine/ludo/ludoPath';
import LudoTokenView from './LudoTokenView';
import { soundService } from '../../../../services/sound/soundService';
import { vibrationService } from '../../../../services/vibration/vibrationService';

const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 24, 380);
const CELL_SIZE = BOARD_SIZE / 15;

interface LudoBoard4PProps {
  gameState: LudoGameState;
  selectableTokenIds: string[];
  onSelectToken: (tokenId: string) => void;
  activeColor: LudoPlayerColor;
  activeMovingTokenId?: string | null;
  movingStepSteps?: Array<[number, number]>;
  onMoveAnimationEnd?: () => void;
}

export const LudoBoard4P: React.FC<LudoBoard4PProps> = ({
  gameState,
  selectableTokenIds,
  onSelectToken,
  activeColor,
  activeMovingTokenId,
  movingStepSteps,
  onMoveAnimationEnd,
}) => {
  // Hopping Animation State
  const hopX = useRef(new Animated.Value(0)).current;
  const hopY = useRef(new Animated.Value(0)).current;
  const hopArc = useRef(new Animated.Value(0)).current;
  const [animatingToken, setAnimatingToken] = useState<{
    token: LudoToken;
    color: LudoPlayerColor;
  } | null>(null);

  // Group all active tokens by their (row, col) grid coordinates
  const tokensOnGrid = React.useMemo(() => {
    const gridMap = new Map<string, Array<{ token: LudoToken; player: LudoPlayer }>>();

    for (const player of gameState.players) {
      for (const token of player.tokens) {
        // Skip the actively animating token from static rendering
        if (animatingToken && token.id === animatingToken.token.id) continue;

        if (token.status === 'active' || token.status === 'finished') {
          const coords = LudoPath.get4PCellCoordinates(
            token.stepCount,
            player.color,
            token.status,
            token.tokenIndex,
          );
          const key = `${coords[0]},${coords[1]}`;
          if (!gridMap.has(key)) {
            gridMap.set(key, []);
          }
          gridMap.get(key)!.push({ token, player });
        }
      }
    }
    return gridMap;
  }, [gameState, animatingToken]);

  // Execute Step-by-Step Hopping Animation
  useEffect(() => {
    let isCancelled = false;
    if (activeMovingTokenId && movingStepSteps && movingStepSteps.length > 0) {
      let foundToken: LudoToken | null = null;
      let foundColor: LudoPlayerColor = 'red';
      for (const p of gameState.players) {
        const tok = p.tokens.find((t) => t.id === activeMovingTokenId);
        if (tok) {
          foundToken = tok;
          foundColor = p.color;
          break;
        }
      }

      if (foundToken) {
        setAnimatingToken({ token: foundToken, color: foundColor });

        const firstCoord = movingStepSteps[0];
        hopX.setValue(firstCoord[1] * CELL_SIZE);
        hopY.setValue(firstCoord[0] * CELL_SIZE);
        hopArc.setValue(0);

        const stepAnimations: Animated.CompositeAnimation[] = [];

        for (let i = 1; i < movingStepSteps.length; i++) {
          const nextCoord = movingStepSteps[i];
          const targetX = nextCoord[1] * CELL_SIZE;
          const targetY = nextCoord[0] * CELL_SIZE;

          stepAnimations.push(
            Animated.parallel([
              Animated.timing(hopX, {
                toValue: targetX,
                duration: 150,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              Animated.timing(hopY, {
                toValue: targetY,
                duration: 150,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.timing(hopArc, {
                  toValue: -18,
                  duration: 75,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: true,
                }),
                Animated.timing(hopArc, {
                  toValue: 0,
                  duration: 75,
                  easing: Easing.in(Easing.quad),
                  useNativeDriver: true,
                }),
              ]),
            ]),
          );
        }

        let stepIdx = 0;
        const runNextStep = () => {
          if (isCancelled) return;
          if (stepIdx < stepAnimations.length) {
            soundService.play('token_move');
            vibrationService.vibrateTap();
            stepAnimations[stepIdx].start((result) => {
              if (isCancelled) return;
              if (result.finished) {
                stepIdx++;
                runNextStep();
              }
            });
          } else {
            setAnimatingToken(null);
            onMoveAnimationEnd?.();
          }
        };

        runNextStep();
      }
    }
    return () => {
      isCancelled = true;
    };
  }, [activeMovingTokenId, movingStepSteps]);

  // Helper to render Yard Box matching the image
  const renderHomeYard = (
    color: LudoPlayerColor,
    positionStyle: any,
  ) => {
    const player = gameState.players.find((p) => p.color === color);
    const homeTokens = player?.tokens.filter((t) => t.status === 'home') || [];

    // Colors matching uploaded reference image
    const yardThemeMap: Record<LudoPlayerColor, { bg: string; innerBg: string; rim: string }> = {
      red: { bg: '#E53935', innerBg: '#FFEBEE', rim: '#D32F2F' },
      yellow: { bg: '#FDD835', innerBg: '#FFFDE7', rim: '#FBC02D' },
      green: { bg: '#43A047', innerBg: '#E8F8F5', rim: '#2E7D32' },
      blue: { bg: '#1E88E5', innerBg: '#E3F2FD', rim: '#1565C0' },
      orange: { bg: '#FB8C00', innerBg: '#FFF3E0', rim: '#E65100' },
      purple: { bg: '#8E24AA', innerBg: '#F3E5F5', rim: '#4A148C' },
    };
    const yardTheme = yardThemeMap[color] || yardThemeMap.red;

    return (
      <View style={[styles.yardOuterContainer, positionStyle, { backgroundColor: yardTheme.bg }]}>
        {/* Rounded Recessed Inner Bed */}
        <View style={[styles.yardInnerBed, { backgroundColor: yardTheme.innerBg, borderColor: yardTheme.rim }]}>
          <View style={styles.yardSlotsGrid}>
            {[0, 1, 2, 3].map((slotIdx) => {
              const token = homeTokens.find((t) => t.tokenIndex === slotIdx);
              const isHiddenBecauseAnimating = animatingToken && token && token.id === animatingToken.token.id;
              const isSelectable = token && !isHiddenBecauseAnimating ? selectableTokenIds.includes(token.id) : false;

              return (
                <View
                  key={slotIdx}
                  style={styles.yardSlotRing}
                >
                  {token && !isHiddenBecauseAnimating ? (
                    <LudoTokenView
                      color={color}
                      size={CELL_SIZE * 1.3}
                      isSelectable={isSelectable}
                      onPress={isSelectable ? () => onSelectToken(token.id) : undefined}
                    />
                  ) : (
                    <View style={[styles.emptySlotBezel, { backgroundColor: yardTheme.innerBg }]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  // Helper to check cell type matching the uploaded image
  const getCellMeta = (row: number, col: number) => {
    // Check if in Home Yard areas (6x6 corners)
    if (row < 6 && col < 6) return { isYard: true, color: 'red' };
    if (row < 6 && col > 8) return { isYard: true, color: 'yellow' };
    if (row > 8 && col < 6) return { isYard: true, color: 'green' };
    if (row > 8 && col > 8) return { isYard: true, color: 'blue' };

    // Center Home area (3x3: rows 6-8, cols 6-8)
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) {
      return { isCenter: true };
    }

    // Home Stretches matching the image
    if (col === 7 && row >= 1 && row <= 5) return { isHomeStretch: true, color: 'red' };
    if (row === 7 && col >= 1 && col <= 5) return { isHomeStretch: true, color: 'green' };
    if (col === 7 && row >= 9 && row <= 13) return { isHomeStretch: true, color: 'green' };
    if (row === 7 && col >= 9 && col <= 13) return { isHomeStretch: true, color: 'yellow' };

    // Colored Start Cells
    if (row === 1 && col === 6) return { isStart: true, color: 'red' };
    if (row === 8 && col === 1) return { isStart: true, color: 'green' };
    if (row === 13 && col === 8) return { isStart: true, color: 'blue' };
    if (row === 6 && col === 13) return { isStart: true, color: 'yellow' };
    if (row === 7 && col === 13) return { isStart: true, color: 'blue' };

    // Start Cells with Colored Arrows matching the image
    if (row === 0 && col === 7) return { isArrow: true, color: 'red', arrow: '⬇' };
    if (row === 7 && col === 0) return { isArrow: true, color: 'green', arrow: '➡' };
    if (row === 14 && col === 7) return { isArrow: true, color: 'green', arrow: '⬆' };
    if (row === 7 && col === 14) return { isArrow: true, color: 'blue', arrow: '⬅' };

    // Safe Star Squares (★)
    if (
      (row === 2 && col === 6) ||
      (row === 6 && col === 2) ||
      (row === 6 && col === 12) ||
      (row === 12 && col === 8)
    ) {
      return { isStar: true };
    }

    return { isNormalTrack: true };
  };

  // Render a single track cell
  const renderCell = (row: number, col: number) => {
    const meta = getCellMeta(row, col);
    if (meta.isYard || meta.isCenter) return null;

    const cellKey = `${row},${col}`;
    const tokensHere = tokensOnGrid.get(cellKey) || [];

    let bgColor = '#FFFFFF';
    let borderColor = '#CBD5E1';

    if (meta.isHomeStretch && meta.color) {
      bgColor =
        meta.color === 'red'
          ? '#E53935'
          : meta.color === 'yellow'
          ? '#FDD835'
          : meta.color === 'green'
          ? '#43A047'
          : '#1E88E5';
    } else if (meta.isStart && meta.color) {
      bgColor =
        meta.color === 'red'
          ? '#E53935'
          : meta.color === 'yellow'
          ? '#FDD835'
          : meta.color === 'green'
          ? '#43A047'
          : '#1E88E5';
    }

    return (
      <View
        key={cellKey}
        style={[
          styles.cell,
          {
            left: col * CELL_SIZE,
            top: row * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE,
            backgroundColor: bgColor,
            borderColor,
          },
        ]}
      >
        {/* Entry Arrow */}
        {meta.isArrow && (
          <Text
            style={[
              styles.entryArrowText,
              {
                color:
                  meta.color === 'red'
                    ? '#E53935'
                    : meta.color === 'yellow'
                    ? '#FBC02D'
                    : meta.color === 'green'
                    ? '#2E7D32'
                    : '#1565C0',
                fontSize: CELL_SIZE * 0.7,
              },
            ]}
          >
            {meta.arrow}
          </Text>
        )}

        {/* Safe Star Icon */}
        {meta.isStar && tokensHere.length === 0 && (
          <Text style={[styles.starSymbol, { fontSize: CELL_SIZE * 0.7 }]}>
            ★
          </Text>
        )}

        {/* Tokens on this Cell */}
        {tokensHere.length > 0 && (
          <View style={styles.tokenStackContainer}>
            {tokensHere.map(({ token, player }, idx) => {
              const isSelectable = selectableTokenIds.includes(token.id);
              return (
                <View
                  key={token.id}
                  style={[
                    styles.tokenStackItem,
                    tokensHere.length > 1
                      ? {
                          transform: [
                            { translateX: (idx - (tokensHere.length - 1) / 2) * 4 },
                            { translateY: (idx - (tokensHere.length - 1) / 2) * 4 },
                          ],
                        }
                      : {},
                  ]}
                >
                  <LudoTokenView
                    color={player.color}
                    size={CELL_SIZE * 1.05}
                    isSelectable={isSelectable}
                    onPress={isSelectable ? () => onSelectToken(token.id) : undefined}
                    stackCount={tokensHere.length}
                    isFinished={token.status === 'finished'}
                  />
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // Render Center Home 4-Triangles matching the image
  const renderCenterHome = () => {
    const centerTokens = tokensOnGrid.get('7,7') || [];

    return (
      <View style={styles.centerHomeContainer}>
        {/* Top Triangle: RED */}
        <View style={[styles.triangleTop, { borderTopColor: '#E53935' }]} />
        {/* Right Triangle: YELLOW */}
        <View style={[styles.triangleRight, { borderRightColor: '#FDD835' }]} />
        {/* Bottom Triangle: BLUE */}
        <View style={[styles.triangleBottom, { borderBottomColor: '#1E88E5' }]} />
        {/* Left Triangle: GREEN */}
        <View style={[styles.triangleLeft, { borderLeftColor: '#43A047' }]} />

        {/* Center Finished Tokens if any */}
        {centerTokens.length > 0 && (
          <View style={styles.centerTokensLayer}>
            {centerTokens.slice(0, 4).map(({ token, player }) => (
              <LudoTokenView
                key={token.id}
                color={player.color}
                size={CELL_SIZE * 0.85}
                isFinished={true}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.boardOuterBevel}>
      <View
        style={[
          styles.boardContainer,
          {
            width: BOARD_SIZE,
            height: BOARD_SIZE,
          },
        ]}
      >
        {/* 4 Corner Home Yards matching uploaded image */}
        {renderHomeYard('red', { top: 0, left: 0 })}
        {renderHomeYard('yellow', { top: 0, right: 0 })}
        {renderHomeYard('green', { bottom: 0, left: 0 })}
        {renderHomeYard('blue', { bottom: 0, right: 0 })}

        {/* Center Home 3x3 */}
        {renderCenterHome()}

        {/* 15x15 Grid Track Cells */}
        {Array.from({ length: 15 }, (_, r) =>
          Array.from({ length: 15 }, (_, c) => renderCell(r, c)),
        )}

        {/* Active Hopping Piece Flight Overlay */}
        {animatingToken && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.animatingPieceOverlay,
              {
                transform: [
                  { translateX: hopX },
                  { translateY: hopY },
                  { translateY: hopArc },
                ],
              },
            ]}
          >
            <LudoTokenView
              color={animatingToken.color}
              size={CELL_SIZE * 1.15}
              isSelectable={false}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  boardOuterBevel: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 7,
    borderRadius: 26,
    backgroundColor: '#1565C0',
    borderWidth: 2,
    borderColor: '#0D47A1',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.65,
    shadowRadius: 16,
    elevation: 14,
  },
  boardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    position: 'relative',
  },
  yardOuterContainer: {
    position: 'absolute',
    width: CELL_SIZE * 6,
    height: CELL_SIZE * 6,
    padding: CELL_SIZE * 0.6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  yardInnerBed: {
    flex: 1,
    width: '100%',
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  yardSlotsGrid: {
    width: '85%',
    height: '85%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  yardSlotRing: {
    width: CELL_SIZE * 1.6,
    height: CELL_SIZE * 1.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotBezel: {
    width: CELL_SIZE * 1.2,
    height: CELL_SIZE * 1.2,
    borderRadius: (CELL_SIZE * 1.2) / 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  cell: {
    position: 'absolute',
    borderWidth: 0.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryArrowText: {
    fontWeight: '900',
  },
  starSymbol: {
    color: '#94A3B8',
    fontWeight: '900',
  },
  tokenStackContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenStackItem: {
    position: 'absolute',
  },
  centerHomeContainer: {
    position: 'absolute',
    top: CELL_SIZE * 6,
    left: CELL_SIZE * 6,
    width: CELL_SIZE * 3,
    height: CELL_SIZE * 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triangleTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    borderLeftWidth: (CELL_SIZE * 3) / 2,
    borderRightWidth: (CELL_SIZE * 3) / 2,
    borderTopWidth: (CELL_SIZE * 3) / 2,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  triangleRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderTopWidth: (CELL_SIZE * 3) / 2,
    borderBottomWidth: (CELL_SIZE * 3) / 2,
    borderRightWidth: (CELL_SIZE * 3) / 2,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  triangleBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 0,
    height: 0,
    borderLeftWidth: (CELL_SIZE * 3) / 2,
    borderRightWidth: (CELL_SIZE * 3) / 2,
    borderBottomWidth: (CELL_SIZE * 3) / 2,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  triangleLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    borderTopWidth: (CELL_SIZE * 3) / 2,
    borderBottomWidth: (CELL_SIZE * 3) / 2,
    borderLeftWidth: (CELL_SIZE * 3) / 2,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
  },
  centerTokensLayer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  animatingPieceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
});

export default LudoBoard4P;
