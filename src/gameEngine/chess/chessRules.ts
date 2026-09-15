import {
  ChessBoard,
  ChessColor,
  ChessMove,
  ChessPiece,
  ChessPieceType,
  ChessPosition,
  CastlingRights,
  MoveType,
} from './chessTypes';
import { CHESS_BOARD_SIZE, INITIAL_PIECE_ORDER } from './chessConstants';

export class ChessRules {
  /**
   * Generates the initial standard 8x8 chess board setup
   */
  static createInitialBoard(): ChessBoard {
    const board: ChessBoard = Array.from({ length: CHESS_BOARD_SIZE }, () =>
      Array(CHESS_BOARD_SIZE).fill(null),
    );

    // Row 0: Black major & minor pieces
    for (let c = 0; c < 8; c++) {
      const type = INITIAL_PIECE_ORDER[c];
      board[0][c] = {
        id: `b_${type}_${c}`,
        type,
        color: 'black',
        hasMoved: false,
      };
    }

    // Row 1: Black pawns
    for (let c = 0; c < 8; c++) {
      board[1][c] = {
        id: `b_pawn_${c}`,
        type: 'pawn',
        color: 'black',
        hasMoved: false,
      };
    }

    // Row 6: White pawns
    for (let c = 0; c < 8; c++) {
      board[6][c] = {
        id: `w_pawn_${c}`,
        type: 'pawn',
        color: 'white',
        hasMoved: false,
      };
    }

    // Row 7: White major & minor pieces
    for (let c = 0; c < 8; c++) {
      const type = INITIAL_PIECE_ORDER[c];
      board[7][c] = {
        id: `w_${type}_${c}`,
        type,
        color: 'white',
        hasMoved: false,
      };
    }

    return board;
  }

  static isInsideBoard(row: number, col: number): boolean {
    return row >= 0 && row < CHESS_BOARD_SIZE && col >= 0 && col < CHESS_BOARD_SIZE;
  }

  /**
   * Clone board deeply for move simulation
   */
  static cloneBoard(board: ChessBoard): ChessBoard {
    return board.map((row) =>
      row.map((piece) => (piece ? { ...piece } : null)),
    );
  }

  /**
   * Find king position of given color
   */
  static findKing(board: ChessBoard, color: ChessColor): ChessPosition | null {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  /**
   * Checks if a square is attacked by any piece of the attacking color
   */
  static isSquareAttacked(
    board: ChessBoard,
    target: ChessPosition,
    attackingColor: ChessColor,
  ): boolean {
    const oppColor = attackingColor;

    // 1. Pawn attacks (Pawns attack forward-diagonally relative to their movement direction)
    const pawnDir = oppColor === 'white' ? -1 : 1;
    const pawnRow = target.row - pawnDir;
    for (const pawnCol of [target.col - 1, target.col + 1]) {
      if (this.isInsideBoard(pawnRow, pawnCol)) {
        const piece = board[pawnRow][pawnCol];
        if (piece && piece.color === oppColor && piece.type === 'pawn') {
          return true;
        }
      }
    }

    // 2. Knight attacks
    const knightOffsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    for (const [dr, dc] of knightOffsets) {
      const nr = target.row + dr;
      const nc = target.col + dc;
      if (this.isInsideBoard(nr, nc)) {
        const piece = board[nr][nc];
        if (piece && piece.color === oppColor && piece.type === 'knight') {
          return true;
        }
      }
    }

    // 3. King attacks (1 step adjacent)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = target.row + dr;
        const nc = target.col + dc;
        if (this.isInsideBoard(nr, nc)) {
          const piece = board[nr][nc];
          if (piece && piece.color === oppColor && piece.type === 'king') {
            return true;
          }
        }
      }
    }

    // 4. Straight sliding attacks (Rook / Queen)
    const straightDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of straightDirs) {
      let step = 1;
      while (true) {
        const nr = target.row + dr * step;
        const nc = target.col + dc * step;
        if (!this.isInsideBoard(nr, nc)) break;
        const piece = board[nr][nc];
        if (piece) {
          if (piece.color === oppColor && (piece.type === 'rook' || piece.type === 'queen')) {
            return true;
          }
          break; // Line of sight blocked by piece
        }
        step++;
      }
    }

    // 5. Diagonal sliding attacks (Bishop / Queen)
    const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dr, dc] of diagDirs) {
      let step = 1;
      while (true) {
        const nr = target.row + dr * step;
        const nc = target.col + dc * step;
        if (!this.isInsideBoard(nr, nc)) break;
        const piece = board[nr][nc];
        if (piece) {
          if (piece.color === oppColor && (piece.type === 'bishop' || piece.type === 'queen')) {
            return true;
          }
          break; // Line of sight blocked
        }
        step++;
      }
    }

    return false;
  }

  /**
   * Check if King of given color is currently in check
   */
  static isInCheck(board: ChessBoard, color: ChessColor): boolean {
    const kingPos = this.findKing(board, color);
    if (!kingPos) return false;
    const oppColor: ChessColor = color === 'white' ? 'black' : 'white';
    return this.isSquareAttacked(board, kingPos, oppColor);
  }

  /**
   * Simulates a move and checks if it leaves the moving player's King in check
   */
  static doesMoveLeaveKingInCheck(
    board: ChessBoard,
    move: { from: ChessPosition; to: ChessPosition; moveType?: MoveType },
    color: ChessColor,
  ): boolean {
    const simBoard = this.cloneBoard(board);
    const piece = simBoard[move.from.row][move.from.col];
    if (!piece) return true;

    // Apply basic move on simulated board
    simBoard[move.to.row][move.to.col] = piece;
    simBoard[move.from.row][move.from.col] = null;

    // Special handling for en passant simulation (remove captured pawn on from.row)
    if (move.moveType === 'en_passant') {
      const capturedPawnRow = move.from.row;
      simBoard[capturedPawnRow][move.to.col] = null;
    }

    // Special handling for castling rook placement
    if (move.moveType === 'castle_kingside') {
      const rook = simBoard[move.from.row][7];
      simBoard[move.from.row][5] = rook;
      simBoard[move.from.row][7] = null;
    } else if (move.moveType === 'castle_queenside') {
      const rook = simBoard[move.from.row][0];
      simBoard[move.from.row][3] = rook;
      simBoard[move.from.row][0] = null;
    }

    return this.isInCheck(simBoard, color);
  }

  /**
   * Get all pseudo-legal moves for a piece at given position
   */
  static getPseudoLegalMoves(
    board: ChessBoard,
    pos: ChessPosition,
    castlingRights?: CastlingRights,
    enPassantTarget?: ChessPosition | null,
  ): ChessMove[] {
    const piece = board[pos.row][pos.col];
    if (!piece) return [];

    const moves: ChessMove[] = [];
    const color = piece.color;
    const oppColor: ChessColor = color === 'white' ? 'black' : 'white';
    const { row, col } = pos;

    // ───────────────── PAWN ─────────────────
    if (piece.type === 'pawn') {
      const dir = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;
      const promotionRow = color === 'white' ? 0 : 7;

      // 1-step forward
      const f1Row = row + dir;
      if (this.isInsideBoard(f1Row, col) && !board[f1Row][col]) {
        const isPromo = f1Row === promotionRow;
        moves.push({
          from: pos,
          to: { row: f1Row, col },
          piece,
          moveType: isPromo ? 'promotion' : 'normal',
          promotion: isPromo ? 'queen' : undefined,
        });

        // 2-step forward from starting row (both 1st and 2nd square must be empty)
        const f2Row = row + 2 * dir;
        if (row === startRow && this.isInsideBoard(f2Row, col) && !board[f2Row][col]) {
          moves.push({
            from: pos,
            to: { row: f2Row, col },
            piece,
            moveType: 'normal',
          });
        }
      }

      // Diagonal captures
      for (const dc of [-1, 1]) {
        const targetCol = col + dc;
        if (this.isInsideBoard(f1Row, targetCol)) {
          const targetPiece = board[f1Row][targetCol];
          const isPromo = f1Row === promotionRow;

          if (targetPiece && targetPiece.color === oppColor) {
            moves.push({
              from: pos,
              to: { row: f1Row, col: targetCol },
              piece,
              capturedPiece: targetPiece,
              moveType: isPromo ? 'promotion' : 'capture',
              promotion: isPromo ? 'queen' : undefined,
            });
          } else if (
            enPassantTarget &&
            enPassantTarget.row === f1Row &&
            enPassantTarget.col === targetCol
          ) {
            // En Passant Capture (enemy pawn sits at [row][targetCol])
            const capturedPawn = board[row][targetCol];
            if (capturedPawn && capturedPawn.color === oppColor && capturedPawn.type === 'pawn') {
              moves.push({
                from: pos,
                to: { row: f1Row, col: targetCol },
                piece,
                capturedPiece: capturedPawn,
                moveType: 'en_passant',
              });
            }
          }
        }
      }
    }

    // ───────────────── KNIGHT ─────────────────
    if (piece.type === 'knight') {
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      for (const [dr, dc] of knightOffsets) {
        const nr = row + dr;
        const nc = col + dc;
        if (this.isInsideBoard(nr, nc)) {
          const targetPiece = board[nr][nc];
          if (!targetPiece) {
            moves.push({ from: pos, to: { row: nr, col: nc }, piece, moveType: 'normal' });
          } else if (targetPiece.color === oppColor) {
            moves.push({
              from: pos,
              to: { row: nr, col: nc },
              piece,
              capturedPiece: targetPiece,
              moveType: 'capture',
            });
          }
        }
      }
    }

    // ───────────────── BISHOP / QUEEN / ROOK ─────────────────
    if (piece.type === 'bishop' || piece.type === 'queen' || piece.type === 'rook') {
      const dirs: number[][] = [];
      if (piece.type === 'rook' || piece.type === 'queen') {
        dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      }
      if (piece.type === 'bishop' || piece.type === 'queen') {
        dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      }

      for (const [dr, dc] of dirs) {
        let step = 1;
        while (true) {
          const nr = row + dr * step;
          const nc = col + dc * step;
          if (!this.isInsideBoard(nr, nc)) break;
          const targetPiece = board[nr][nc];

          if (!targetPiece) {
            moves.push({ from: pos, to: { row: nr, col: nc }, piece, moveType: 'normal' });
          } else {
            if (targetPiece.color === oppColor) {
              moves.push({
                from: pos,
                to: { row: nr, col: nc },
                piece,
                capturedPiece: targetPiece,
                moveType: 'capture',
              });
            }
            break; // Line of sight blocked
          }
          step++;
        }
      }
    }

    // ───────────────── KING ─────────────────
    if (piece.type === 'king') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = row + dr;
          const nc = col + dc;
          if (this.isInsideBoard(nr, nc)) {
            const targetPiece = board[nr][nc];
            if (!targetPiece) {
              moves.push({ from: pos, to: { row: nr, col: nc }, piece, moveType: 'normal' });
            } else if (targetPiece.color === oppColor) {
              moves.push({
                from: pos,
                to: { row: nr, col: nc },
                piece,
                capturedPiece: targetPiece,
                moveType: 'capture',
              });
            }
          }
        }
      }

      // Castling rules
      if (castlingRights && !piece.hasMoved && !this.isInCheck(board, color)) {
        const rights = castlingRights[color];
        const kingRow = color === 'white' ? 7 : 0;

        // Kingside Castling (e1 -> g1 / e8 -> g8)
        if (
          rights.kingside &&
          row === kingRow &&
          col === 4 &&
          !board[kingRow][5] &&
          !board[kingRow][6] &&
          board[kingRow][7]?.type === 'rook' &&
          board[kingRow][7]?.color === color &&
          !board[kingRow][7]?.hasMoved &&
          !this.isSquareAttacked(board, { row: kingRow, col: 5 }, oppColor) &&
          !this.isSquareAttacked(board, { row: kingRow, col: 6 }, oppColor)
        ) {
          moves.push({
            from: pos,
            to: { row: kingRow, col: 6 },
            piece,
            moveType: 'castle_kingside',
          });
        }

        // Queenside Castling (e1 -> c1 / e8 -> c8)
        if (
          rights.queenside &&
          row === kingRow &&
          col === 4 &&
          !board[kingRow][1] &&
          !board[kingRow][2] &&
          !board[kingRow][3] &&
          board[kingRow][0]?.type === 'rook' &&
          board[kingRow][0]?.color === color &&
          !board[kingRow][0]?.hasMoved &&
          !this.isSquareAttacked(board, { row: kingRow, col: 2 }, oppColor) &&
          !this.isSquareAttacked(board, { row: kingRow, col: 3 }, oppColor)
        ) {
          moves.push({
            from: pos,
            to: { row: kingRow, col: 2 },
            piece,
            moveType: 'castle_queenside',
          });
        }
      }
    }

    return moves;
  }

  /**
   * Get all strictly legal moves for a piece at given position (cannot leave King in check)
   */
  static getLegalMoves(
    board: ChessBoard,
    pos: ChessPosition,
    castlingRights?: CastlingRights,
    enPassantTarget?: ChessPosition | null,
  ): ChessMove[] {
    const piece = board[pos.row][pos.col];
    if (!piece) return [];

    const pseudoMoves = this.getPseudoLegalMoves(board, pos, castlingRights, enPassantTarget);
    return pseudoMoves.filter(
      (m) => !this.doesMoveLeaveKingInCheck(board, m, piece.color),
    );
  }

  /**
   * Get all legal moves for all pieces belonging to a color
   */
  static getAllLegalMoves(
    board: ChessBoard,
    color: ChessColor,
    castlingRights?: CastlingRights,
    enPassantTarget?: ChessPosition | null,
  ): ChessMove[] {
    const allMoves: ChessMove[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === color) {
          const legalMoves = this.getLegalMoves(
            board,
            { row: r, col: c },
            castlingRights,
            enPassantTarget,
          );
          allMoves.push(...legalMoves);
        }
      }
    }
    return allMoves;
  }

  /**
   * Checkmate detection: In check AND has 0 legal moves
   */
  static isCheckmate(
    board: ChessBoard,
    color: ChessColor,
    castlingRights?: CastlingRights,
    enPassantTarget?: ChessPosition | null,
  ): boolean {
    if (!this.isInCheck(board, color)) return false;
    const legalMoves = this.getAllLegalMoves(board, color, castlingRights, enPassantTarget);
    return legalMoves.length === 0;
  }

  /**
   * Stalemate detection: NOT in check AND has 0 legal moves
   */
  static isStalemate(
    board: ChessBoard,
    color: ChessColor,
    castlingRights?: CastlingRights,
    enPassantTarget?: ChessPosition | null,
  ): boolean {
    if (this.isInCheck(board, color)) return false;
    const legalMoves = this.getAllLegalMoves(board, color, castlingRights, enPassantTarget);
    return legalMoves.length === 0;
  }

  /**
   * Insufficient material detection (FIDE standard):
   * - K vs K
   * - K+B vs K
   * - K+N vs K
   * - K+B vs K+B (both bishops on same square color)
   */
  static isInsufficientMaterial(board: ChessBoard): boolean {
    const pieces: { type: ChessPieceType; color: ChessColor; pos: ChessPosition }[] = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          pieces.push({ type: piece.type, color: piece.color, pos: { row: r, col: c } });
        }
      }
    }

    // King vs King
    if (pieces.length === 2) return true;

    // King + minor vs King
    if (pieces.length === 3) {
      const nonKings = pieces.filter((p) => p.type !== 'king');
      if (nonKings.length === 1) {
        const t = nonKings[0].type;
        return t === 'bishop' || t === 'knight';
      }
    }

    // King + Bishop vs King + Bishop (same square color)
    if (pieces.length === 4) {
      const bishops = pieces.filter((p) => p.type === 'bishop');
      if (bishops.length === 2 && bishops[0].color !== bishops[1].color) {
        const sq1Color = (bishops[0].pos.row + bishops[0].pos.col) % 2;
        const sq2Color = (bishops[1].pos.row + bishops[1].pos.col) % 2;
        return sq1Color === sq2Color;
      }
    }

    return false;
  }

  /**
   * Standard Algebraic Notation generator (FIDE SAN) with disambiguation
   */
  static getAlgebraicNotation(
    move: ChessMove,
    isCheck: boolean,
    isCheckmate: boolean,
    boardBeforeMove?: ChessBoard,
    castlingRights?: CastlingRights,
    enPassantTarget?: ChessPosition | null,
  ): string {
    if (move.moveType === 'castle_kingside') return isCheckmate ? 'O-O#' : isCheck ? 'O-O+' : 'O-O';
    if (move.moveType === 'castle_queenside') return isCheckmate ? 'O-O-O#' : isCheck ? 'O-O-O+' : 'O-O-O';

    const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const fromCol = cols[move.from.col];
    const fromRank = `${8 - move.from.row}`;
    const toSquare = `${cols[move.to.col]}${8 - move.to.row}`;
    const pieceType = move.piece.type;

    let notation = '';

    if (pieceType === 'pawn') {
      if (move.capturedPiece || move.moveType === 'en_passant') {
        notation = `${fromCol}x${toSquare}`;
      } else {
        notation = toSquare;
      }
      if (move.promotion) {
        notation += `=${move.promotion.charAt(0).toUpperCase()}`;
      }
    } else {
      const pieceLetter = pieceType === 'knight' ? 'N' : pieceType.charAt(0).toUpperCase();
      let disambiguation = '';

      // Check if another identical piece of same color can reach the destination
      if (boardBeforeMove) {
        const otherCandidates: ChessPosition[] = [];
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (r === move.from.row && c === move.from.col) continue;
            const p = boardBeforeMove[r][c];
            if (p && p.color === move.piece.color && p.type === pieceType) {
              const legalMoves = this.getLegalMoves(
                boardBeforeMove,
                { row: r, col: c },
                castlingRights,
                enPassantTarget,
              );
              if (legalMoves.some((m) => m.to.row === move.to.row && m.to.col === move.to.col)) {
                otherCandidates.push({ row: r, col: c });
              }
            }
          }
        }

        if (otherCandidates.length > 0) {
          const sameCol = otherCandidates.some((p) => p.col === move.from.col);
          const sameRow = otherCandidates.some((p) => p.row === move.from.row);

          if (!sameCol) {
            disambiguation = fromCol;
          } else if (!sameRow) {
            disambiguation = fromRank;
          } else {
            disambiguation = `${fromCol}${fromRank}`;
          }
        }
      }

      const captureStr = move.capturedPiece ? 'x' : '';
      notation = `${pieceLetter}${disambiguation}${captureStr}${toSquare}`;
    }

    if (isCheckmate) notation += '#';
    else if (isCheck) notation += '+';

    return notation;
  }
}

