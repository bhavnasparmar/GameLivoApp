import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing } from 'react-native';
import FastImage from 'react-native-fast-image';
import { ChessPiece } from '../../../../gameEngine/chess/chessTypes';
import { CHESS_PIECE_IMAGES } from '../../../../gameEngine/chess/chessConstants';

export interface ChessPieceAnimatedProps {
  piece: ChessPiece;
  size?: number;
  squareSize: number;
  isSelected?: boolean;
  isCheckKing?: boolean;
  isLastMovedPiece?: boolean;
  isCaptureMove?: boolean;
  fromRow?: number;
  fromCol?: number;
  toRow?: number;
  toCol?: number;
  isFlipped?: boolean;
  isCapturedPiece?: boolean;
  onCapturedComplete?: () => void;
}

export const ChessPieceAnimated: React.FC<ChessPieceAnimatedProps> = React.memo(
  ({
    piece,
    size,
    squareSize,
    isSelected = false,
    isCheckKing = false,
    isLastMovedPiece = false,
    isCaptureMove = false,
    fromRow,
    fromCol,
    toRow,
    toCol,
    isFlipped = false,
    isCapturedPiece = false,
    onCapturedComplete,
  }) => {
    const pieceImage = CHESS_PIECE_IMAGES[piece.color]?.[piece.type];
    const pieceDisplaySize = size || squareSize * 0.9;

    // Calculate starting offsets if this piece just moved
    const hasMoveData =
      isLastMovedPiece &&
      fromRow !== undefined &&
      fromCol !== undefined &&
      toRow !== undefined &&
      toCol !== undefined;

    const cDiff = hasMoveData ? (isFlipped ? toCol! - fromCol! : fromCol! - toCol!) : 0;
    const rDiff = hasMoveData ? (isFlipped ? toRow! - fromRow! : fromRow! - toRow!) : 0;
    const startX = cDiff * squareSize;
    const startY = rDiff * squareSize;

    // Animated values
    const animX = useRef(new Animated.Value(startX)).current;
    const animY = useRef(new Animated.Value(startY + (isSelected ? -6 : 0))).current;
    const animScale = useRef(
      new Animated.Value(hasMoveData ? 1.18 : isSelected ? 1.15 : 1.0),
    ).current;
    const animOpacity = useRef(new Animated.Value(1.0)).current;
    const animRotate = useRef(new Animated.Value(0)).current; // -1 to 1 for tilt/spin

    // Track move signature to ensure each move animates once cleanly
    const animatedMoveSigRef = useRef<string>('');

    // Check heartbeat animation ref
    const checkPulseAnim = useRef<Animated.CompositeAnimation | null>(null);

    // ─── 1. Movement & Attack Strike Animation ──────────────────────────────
    useEffect(() => {
      if (isCapturedPiece) return;

      if (hasMoveData) {
        const moveSig = `${fromRow}_${fromCol}_${toRow}_${toCol}_${piece.id}_${isCaptureMove ? 'cap' : 'norm'}`;
        if (animatedMoveSigRef.current !== moveSig) {
          animatedMoveSigRef.current = moveSig;
          animRotate.setValue(0);

          // ── A. Knight: "L" Jump with Attack Slam ──
          if (piece.type === 'knight') {
            animX.setValue(startX);
            animY.setValue(startY);

            let midX = 0;
            let midY = 0;
            if (Math.abs(fromRow! - toRow!) >= Math.abs(fromCol! - toCol!)) {
              midX = startX;
              midY = 0;
            } else {
              midX = 0;
              midY = startY;
            }

            Animated.sequence([
              // Stage 1: High jump lift + step along primary axis
              Animated.parallel([
                Animated.timing(animX, {
                  toValue: midX,
                  duration: isCaptureMove ? 110 : 130,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: true,
                }),
                Animated.timing(animY, {
                  toValue: midY,
                  duration: isCaptureMove ? 110 : 130,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: true,
                }),
                Animated.timing(animScale, {
                  toValue: isCaptureMove ? 1.38 : 1.32,
                  duration: isCaptureMove ? 100 : 120,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: true,
                }),
              ]),
              // Stage 2: Orthogonal turn & strike onto target square
              Animated.parallel([
                Animated.timing(animX, {
                  toValue: 0,
                  duration: isCaptureMove ? 100 : 130,
                  easing: isCaptureMove ? Easing.in(Easing.quad) : Easing.inOut(Easing.quad),
                  useNativeDriver: true,
                }),
                Animated.timing(animY, {
                  toValue: 0,
                  duration: isCaptureMove ? 100 : 130,
                  easing: isCaptureMove ? Easing.in(Easing.quad) : Easing.inOut(Easing.quad),
                  useNativeDriver: true,
                }),
                // Landing impact: Heavy strike slam if capture, otherwise smooth spring
                isCaptureMove
                  ? Animated.sequence([
                      Animated.timing(animScale, {
                        toValue: 0.9,
                        duration: 60,
                        easing: Easing.in(Easing.quad),
                        useNativeDriver: true,
                      }),
                      Animated.spring(animScale, {
                        toValue: isSelected ? 1.15 : 1.0,
                        friction: 5,
                        tension: 120,
                        useNativeDriver: true,
                      }),
                    ])
                  : Animated.spring(animScale, {
                      toValue: isSelected ? 1.15 : 1.0,
                      friction: 6,
                      tension: 100,
                      useNativeDriver: true,
                    }),
              ]),
            ]).start();
            return;
          } else {
            // ── B. Straight / Diagonal Pieces (Pawn, Rook, Bishop, Queen, King) ──
            animX.setValue(startX);
            animY.setValue(startY);

            const distSquares = Math.max(
              Math.abs(fromRow! - toRow!),
              Math.abs(fromCol! - toCol!),
            );
            const baseDuration = Math.min(260, Math.max(160, Math.round(distSquares * 28 + 110)));
            const duration = isCaptureMove ? Math.round(baseDuration * 0.85) : baseDuration;

            Animated.parallel([
              Animated.timing(animX, {
                toValue: 0,
                duration,
                easing: isCaptureMove
                  ? Easing.bezier(0.25, 0.1, 0.25, 1)
                  : Easing.bezier(0.22, 1, 0.36, 1),
                useNativeDriver: true,
              }),
              Animated.timing(animY, {
                toValue: 0,
                duration,
                easing: isCaptureMove
                  ? Easing.bezier(0.25, 0.1, 0.25, 1)
                  : Easing.bezier(0.22, 1, 0.36, 1),
                useNativeDriver: true,
              }),
              Animated.sequence([
                // High aggressive lift during transit
                Animated.timing(animScale, {
                  toValue: isCaptureMove ? 1.26 : 1.14,
                  duration: duration * 0.45,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: true,
                }),
                // Landing impact: Heavy attack slam if capture, normal spring otherwise
                isCaptureMove
                  ? Animated.sequence([
                      Animated.timing(animScale, {
                        toValue: 0.92,
                        duration: 55,
                        easing: Easing.in(Easing.quad),
                        useNativeDriver: true,
                      }),
                      Animated.spring(animScale, {
                        toValue: isSelected ? 1.15 : 1.0,
                        friction: 5,
                        tension: 110,
                        useNativeDriver: true,
                      }),
                    ])
                  : Animated.spring(animScale, {
                      toValue: isSelected ? 1.15 : 1.0,
                      friction: 6.5,
                      tension: 90,
                      useNativeDriver: true,
                    }),
              ]),
            ]).start();
            return;
          }
        }
      }

      // If not currently executing transit, handle in-place selection hover
      Animated.parallel([
        Animated.spring(animY, {
          toValue: isSelected ? -6 : 0,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.spring(animScale, {
          toValue: isSelected ? 1.15 : 1.0,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }, [
      hasMoveData,
      isCaptureMove,
      fromRow,
      fromCol,
      toRow,
      toCol,
      startX,
      startY,
      piece.type,
      piece.id,
      isSelected,
      isCapturedPiece,
      animX,
      animY,
      animScale,
      animRotate,
    ]);

    // ─── 2. King In-Check Warning Aura ───────────────────────────────────────
    useEffect(() => {
      if (isCheckKing && piece.type === 'king' && !isCapturedPiece) {
        checkPulseAnim.current = Animated.loop(
          Animated.sequence([
            Animated.timing(animScale, {
              toValue: 1.18,
              duration: 380,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(animScale, {
              toValue: 1.0,
              duration: 380,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        );
        checkPulseAnim.current.start();
      } else {
        if (checkPulseAnim.current) {
          checkPulseAnim.current.stop();
          checkPulseAnim.current = null;
        }
        if (!isSelected && !isCapturedPiece && !hasMoveData) {
          animScale.setValue(1.0);
        }
      }

      return () => {
        if (checkPulseAnim.current) {
          checkPulseAnim.current.stop();
        }
      };
    }, [isCheckKing, piece.type, isCapturedPiece, isSelected, hasMoveData, animScale]);

    // ─── 3. Captured Dramatic Knockout & Dissolve Animation ─────────────────
    useEffect(() => {
      if (isCapturedPiece) {
        // Randomize slight knockback direction (-1 for left tilt, 1 for right tilt)
        const tiltDirection = Math.random() > 0.5 ? 1 : -1;

        Animated.sequence([
          // Phase 1: Heavy Hit Impact Pop & Knockback Tilt (0-80ms)
          Animated.parallel([
            Animated.timing(animScale, {
              toValue: 1.36,
              duration: 80,
              easing: Easing.out(Easing.back(2)),
              useNativeDriver: true,
            }),
            Animated.timing(animY, {
              toValue: -14,
              duration: 80,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(animX, {
              toValue: tiltDirection * 10,
              duration: 80,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(animRotate, {
              toValue: tiltDirection * 0.45,
              duration: 80,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          // Phase 2: Defeat Tumble & Disintegrate Fade (80-320ms)
          Animated.parallel([
            Animated.timing(animScale, {
              toValue: 0.05,
              duration: 240,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(animY, {
              toValue: -28,
              duration: 240,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(animX, {
              toValue: tiltDirection * 20,
              duration: 240,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(animRotate, {
              toValue: tiltDirection * 1.0,
              duration: 240,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(animOpacity, {
              toValue: 0,
              duration: 240,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          if (onCapturedComplete) {
            onCapturedComplete();
          }
        });
      }
    }, [
      isCapturedPiece,
      animScale,
      animY,
      animX,
      animRotate,
      animOpacity,
      onCapturedComplete,
    ]);

    if (!pieceImage) return null;

    const spinInterpolate = animRotate.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: ['-65deg', '0deg', '65deg'],
    });

    return (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.container,
          {
            width: squareSize,
            height: squareSize,
            zIndex: isSelected
              ? 40
              : hasMoveData
              ? 30
              : isCapturedPiece
              ? 25
              : 20,
            transform: [
              { translateX: animX },
              { translateY: animY },
              { scale: animScale },
              { rotate: spinInterpolate },
            ],
            opacity: animOpacity,
          },
        ]}
      >
        <FastImage
          source={pieceImage}
          style={[
            styles.pieceImg,
            {
              width: pieceDisplaySize,
              height: pieceDisplaySize,
            },
          ] as any}
          resizeMode={FastImage.resizeMode.contain}
        />
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  pieceImg: {
    alignSelf: 'center',
  },
});

export default ChessPieceAnimated;
