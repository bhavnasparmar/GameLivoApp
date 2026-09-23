import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import {
  Canvas,
  Rect,
  RoundedRect,
  Circle,
  RadialGradient,
  vec,
  Shadow,
} from '@shopify/react-native-skia';
import {
  ChessBoard,
  ChessColor,
  ChessMove,
  ChessPiece,
  ChessPosition,
} from '../../../../gameEngine/chess/chessTypes';
import { BOARD_THEMES } from '../../../../gameEngine/chess/chessConstants';
import ChessPieceAnimated from './ChessPieceAnimated';
import ChessCaptureEffect from './ChessCaptureEffect';

interface ChessBoardViewProps {
  board: ChessBoard;
  selectedPos: ChessPosition | null;
  legalMoves: ChessMove[];
  lastMove: ChessMove | null;
  isCheck: boolean;
  currentTurn: ChessColor;
  isFlipped?: boolean;
  onSquarePress: (pos: ChessPosition) => void;
  themeKey?: keyof typeof BOARD_THEMES;
}

// Granular Memoized Individual Square Component
interface ChessSquareItemProps {
  r: number;
  c: number;
  rIdx: number;
  cIdx: number;
  squareSize: number;
  piece: ChessPiece | null;
  isLight: boolean;
  isSelected: boolean;
  isCheckKing: boolean;
  isLastMovedPiece: boolean;
  isCaptureMove: boolean;
  fromRow?: number;
  fromCol?: number;
  toRow?: number;
  toCol?: number;
  isFlipped: boolean;
  isCapturedHere: boolean;
  capturedPiece: ChessPiece | null;
  onCapturedComplete: () => void;
  onSquarePress: (pos: ChessPosition) => void;
  coordRank?: string;
  coordFile?: string;
  coordColor: string;
}

const ChessSquareItem = React.memo<ChessSquareItemProps>(
  ({
    r,
    c,
    squareSize,
    piece,
    isSelected,
    isCheckKing,
    isLastMovedPiece,
    isCaptureMove,
    fromRow,
    fromCol,
    toRow,
    toCol,
    isFlipped,
    isCapturedHere,
    capturedPiece,
    onCapturedComplete,
    onSquarePress,
    coordRank,
    coordFile,
    coordColor,
  }) => {
    const handlePress = useCallback(() => {
      onSquarePress({ row: r, col: c });
    }, [onSquarePress, r, c]);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.touchSquare,
          {
            width: squareSize,
            height: squareSize,
          },
        ]}
        onPress={handlePress}
      >
        {/* Coordinate Rank Label */}
        {coordRank && (
          <Text
            style={[styles.coordRank, { color: coordColor }]}
            pointerEvents="none"
          >
            {coordRank}
          </Text>
        )}

        {/* Coordinate File Label */}
        {coordFile && (
          <Text
            style={[styles.coordFile, { color: coordColor }]}
            pointerEvents="none"
          >
            {coordFile}
          </Text>
        )}

        {/* Dynamic Capture Shockwave & Spark Burst Effect */}
        {isCapturedHere && capturedPiece && (
          <ChessCaptureEffect squareSize={squareSize} />
        )}

        {/* Captured Piece Overlay Playing Dramatic Knockout */}
        {isCapturedHere && capturedPiece && (
          <ChessPieceAnimated
            piece={capturedPiece}
            squareSize={squareSize}
            isCapturedPiece={true}
            onCapturedComplete={onCapturedComplete}
          />
        )}

        {/* Active Chess Piece with Smooth Transit & Strike Animation */}
        {piece && (
          <ChessPieceAnimated
            key={`piece_${piece.id}`}
            piece={piece}
            squareSize={squareSize}
            isSelected={isSelected}
            isCheckKing={isCheckKing}
            isLastMovedPiece={isLastMovedPiece}
            isCaptureMove={isLastMovedPiece && isCaptureMove}
            fromRow={fromRow}
            fromCol={fromCol}
            toRow={toRow}
            toCol={toCol}
            isFlipped={isFlipped}
          />
        )}
      </TouchableOpacity>
    );
  },
);

export const ChessBoardView: React.FC<ChessBoardViewProps> = React.memo(
  ({
    board,
    selectedPos,
    legalMoves,
    lastMove,
    isCheck,
    currentTurn,
    isFlipped = false,
    onSquarePress,
    themeKey = 'woodEmerald',
  }) => {
    const { width, height } = useWindowDimensions();
    const theme = BOARD_THEMES[themeKey] || BOARD_THEMES.woodEmerald;

    // Responsive square calculation (maximized board size with sleek edge margins)
    const maxAvailableWidth = Math.min(width - 4, height * 0.58);
    const squareSize = Math.floor(maxAvailableWidth / 8);
    const boardTotalSize = squareSize * 8;

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    const displayRanks = isFlipped ? [...ranks].reverse() : ranks;
    const displayFiles = isFlipped ? [...files].reverse() : files;

    const rowIndices = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const colIndices = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

    // Track recently captured piece for impact animation
    const [capturedAnim, setCapturedAnim] = useState<{
      piece: ChessPiece;
      row: number;
      col: number;
      key: string;
    } | null>(null);

    useEffect(() => {
      if (lastMove && lastMove.capturedPiece) {
        const capRow =
          lastMove.moveType === 'en_passant' ? lastMove.from.row : lastMove.to.row;
        const capCol = lastMove.to.col;

        setCapturedAnim({
          piece: lastMove.capturedPiece,
          row: capRow,
          col: capCol,
          key: `cap_${capRow}_${capCol}_${Date.now()}`,
        });
      }
    }, [lastMove]);

    const handleCapturedComplete = useCallback(() => {
      setCapturedAnim(null);
    }, []);

    // Helper: Map chess board (r, c) to canvas screen (x, y)
    const getSquareXY = useCallback(
      (r: number, c: number) => {
        const rIdx = isFlipped ? 7 - r : r;
        const cIdx = isFlipped ? 7 - c : c;
        return {
          x: cIdx * squareSize,
          y: rIdx * squareSize,
        };
      },
      [isFlipped, squareSize],
    );

    // ─── 1. Static 64 Base Board Squares (Calculated only on dimension/theme change) ───
    const staticBaseSquares = useMemo(() => {
      const items: Array<{
        key: string;
        x: number;
        y: number;
        color: string;
      }> = [];

      rowIndices.forEach((r, rIdx) => {
        colIndices.forEach((c, cIdx) => {
          const isLight = (r + c) % 2 === 0;
          items.push({
            key: `base_${r}_${c}`,
            x: cIdx * squareSize,
            y: rIdx * squareSize,
            color: isLight ? theme.lightSquare : theme.darkSquare,
          });
        });
      });

      return items;
    }, [rowIndices, colIndices, squareSize, theme]);

    // ─── 2. Sparse Dynamic Overlays (Last move, Selected, Check glow, Legal Move dots) ───
    const lastMoveOverlays = useMemo(() => {
      if (!lastMove) return [];
      const fromPos = getSquareXY(lastMove.from.row, lastMove.from.col);
      const toPos = getSquareXY(lastMove.to.row, lastMove.to.col);
      return [
        { key: 'lm_from', x: fromPos.x, y: fromPos.y },
        { key: 'lm_to', x: toPos.x, y: toPos.y },
      ];
    }, [lastMove, getSquareXY]);

    const selectedOverlay = useMemo(() => {
      if (!selectedPos) return null;
      const { x, y } = getSquareXY(selectedPos.row, selectedPos.col);
      return { x, y };
    }, [selectedPos, getSquareXY]);

    const checkKingOverlay = useMemo(() => {
      if (!isCheck) return null;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r]?.[c];
          if (p && p.type === 'king' && p.color === currentTurn) {
            const { x, y } = getSquareXY(r, c);
            return {
              x,
              y,
              centerX: x + squareSize / 2,
              centerY: y + squareSize / 2,
            };
          }
        }
      }
      return null;
    }, [isCheck, board, currentTurn, getSquareXY, squareSize]);

    const legalMoveOverlays = useMemo(() => {
      return legalMoves.map((m) => {
        const { x, y } = getSquareXY(m.to.row, m.to.col);
        const isCapture = Boolean(m.capturedPiece || m.moveType === 'en_passant');
        return {
          key: `lm_${m.to.row}_${m.to.col}`,
          centerX: x + squareSize / 2,
          centerY: y + squareSize / 2,
          isCapture,
        };
      });
    }, [legalMoves, getSquareXY, squareSize]);

    return (
      <View
        style={[
          styles.container,
          {
            width: boardTotalSize,
            height: boardTotalSize,
          },
        ]}
      >
        {/* ─── 1. Skia Hardware-Accelerated Board Canvas ─── */}
        <Canvas style={[styles.canvas, { width: boardTotalSize, height: boardTotalSize }]}>
          {/* Outer Board Background */}
          <Rect
            x={0}
            y={0}
            width={boardTotalSize}
            height={boardTotalSize}
            color={theme.boardBorder || '#2A1B10'}
          />

          {/* 64 Static Base Squares */}
          {staticBaseSquares.map((sq) => (
            <Rect
              key={sq.key}
              x={sq.x}
              y={sq.y}
              width={squareSize}
              height={squareSize}
              color={sq.color}
            />
          ))}

          {/* Last Move Golden Highlight Overlay */}
          {lastMoveOverlays.map((sq) => (
            <Rect
              key={sq.key}
              x={sq.x}
              y={sq.y}
              width={squareSize}
              height={squareSize}
              color={theme.lastMove || 'rgba(240, 198, 74, 0.38)'}
            />
          ))}

          {/* In-Check King Warning Radial Glow */}
          {checkKingOverlay && (
            <Rect
              x={checkKingOverlay.x}
              y={checkKingOverlay.y}
              width={squareSize}
              height={squareSize}
            >
              <RadialGradient
                c={vec(checkKingOverlay.centerX, checkKingOverlay.centerY)}
                r={squareSize * 0.75}
                colors={[
                  'rgba(235, 59, 45, 0.95)',
                  'rgba(220, 40, 30, 0.65)',
                  'rgba(180, 20, 20, 0.2)',
                ]}
              />
            </Rect>
          )}

          {/* Selected Square Highlight with Soft Rounded Bevel */}
          {selectedOverlay && (
            <RoundedRect
              x={selectedOverlay.x + 1}
              y={selectedOverlay.y + 1}
              width={squareSize - 2}
              height={squareSize - 2}
              r={3}
              color={theme.selectedSquare || 'rgba(212, 160, 23, 0.65)'}
            >
              <Shadow dx={0} dy={0} blur={4} color="rgba(240, 198, 74, 0.75)" />
            </RoundedRect>
          )}

          {/* Legal Move Targets (Sparse Overlay) */}
          {legalMoveOverlays.map((lm) =>
            lm.isCapture ? (
              <Circle
                key={lm.key}
                cx={lm.centerX}
                cy={lm.centerY}
                r={squareSize * 0.44}
                style="stroke"
                strokeWidth={3}
                color={theme.captureTarget || 'rgba(230, 72, 58, 0.85)'}
              >
                <Shadow dx={0} dy={0} blur={3} color="rgba(230, 72, 58, 0.9)" />
              </Circle>
            ) : (
              <Circle
                key={lm.key}
                cx={lm.centerX}
                cy={lm.centerY}
                r={squareSize * 0.16}
                color={theme.validMoveDot || 'rgba(31, 157, 85, 0.85)'}
              >
                <Shadow dx={0} dy={1} blur={2} color="rgba(0,0,0,0.3)" />
              </Circle>
            ),
          )}
        </Canvas>

        {/* ─── 2. Interactive Touch & Memoized Chess Pieces Grid ─── */}
        <View style={styles.interactiveGrid}>
          {rowIndices.map((r, rIdx) => (
            <View key={`row_${r}`} style={styles.boardRow}>
              {colIndices.map((c, cIdx) => {
                const piece = board[r]?.[c] || null;
                const isLight = (r + c) % 2 === 0;
                const isSelected = selectedPos?.row === r && selectedPos?.col === c;
                const isCheckKing = Boolean(
                  isCheck && piece && piece.type === 'king' && piece.color === currentTurn,
                );

                let isLastMovedPiece = false;
                let fromRow: number | undefined;
                let fromCol: number | undefined;
                let toRow: number | undefined;
                let toCol: number | undefined;

                if (lastMove) {
                  if (lastMove.to.row === r && lastMove.to.col === c) {
                    isLastMovedPiece = true;
                    fromRow = lastMove.from.row;
                    fromCol = lastMove.from.col;
                    toRow = r;
                    toCol = c;
                  } else if (lastMove.moveType === 'castle_kingside' && r === lastMove.from.row && c === 5) {
                    isLastMovedPiece = true;
                    fromRow = r;
                    fromCol = 7;
                    toRow = r;
                    toCol = 5;
                  } else if (lastMove.moveType === 'castle_queenside' && r === lastMove.from.row && c === 3) {
                    isLastMovedPiece = true;
                    fromRow = r;
                    fromCol = 0;
                    toRow = r;
                    toCol = 3;
                  }
                }

                const isCapturedHere = capturedAnim?.row === r && capturedAnim?.col === c;
                const isCaptureMove = Boolean(
                  lastMove && (lastMove.capturedPiece || lastMove.moveType === 'en_passant'),
                );

                return (
                  <ChessSquareItem
                    key={`sq_${r}_${c}`}
                    r={r}
                    c={c}
                    rIdx={rIdx}
                    cIdx={cIdx}
                    squareSize={squareSize}
                    piece={piece}
                    isLight={isLight}
                    isSelected={isSelected}
                    isCheckKing={isCheckKing}
                    isLastMovedPiece={isLastMovedPiece}
                    isCaptureMove={isLastMovedPiece && isCaptureMove}
                    fromRow={fromRow}
                    fromCol={fromCol}
                    toRow={toRow}
                    toCol={toCol}
                    isFlipped={isFlipped}
                    isCapturedHere={isCapturedHere}
                    capturedPiece={isCapturedHere ? capturedAnim?.piece || null : null}
                    onCapturedComplete={handleCapturedComplete}
                    onSquarePress={onSquarePress}
                    coordRank={cIdx === 0 ? displayRanks[rIdx] : undefined}
                    coordFile={rIdx === 7 ? displayFiles[cIdx] : undefined}
                    coordColor={isLight ? theme.darkSquare : theme.lightSquare}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  interactiveGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  boardRow: {
    flexDirection: 'row',
  },
  touchSquare: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  coordRank: {
    position: 'absolute',
    top: 2,
    left: 2.5,
    fontSize: 9.5,
    fontWeight: '800',
    opacity: 0.85,
    zIndex: 5,
  },
  coordFile: {
    position: 'absolute',
    bottom: 1.5,
    right: 2.5,
    fontSize: 9.5,
    fontWeight: '800',
    opacity: 0.85,
    zIndex: 5,
  },
});

export default ChessBoardView;
