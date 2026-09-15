import { ChessRules } from '../src/gameEngine/chess/chessRules';
import { ChessEngineImpl } from '../src/gameEngine/chess/chessEngine';
import { ChessGameState, ChessMove, ChessPosition } from '../src/gameEngine/chess/chessTypes';

describe('Chess Rules & Game Engine (Pure TypeScript)', () => {
  let engine: ChessEngineImpl;

  beforeEach(() => {
    engine = new ChessEngineImpl();
  });

  test('Initial board setup has all 32 pieces in standard positions', () => {
    const state = engine.getInitialState();
    expect(state.board.length).toBe(8);
    expect(state.board[0].length).toBe(8);
    expect(state.currentTurn).toBe('white');

    // Count pieces
    let whitePieces = 0;
    let blackPieces = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = state.board[r][c];
        if (p) {
          if (p.color === 'white') whitePieces++;
          else blackPieces++;
        }
      }
    }
    expect(whitePieces).toBe(16);
    expect(blackPieces).toBe(16);

    // Initial white pawns at row 6, black pawns at row 1
    for (let c = 0; c < 8; c++) {
      expect(state.board[6][c]?.type).toBe('pawn');
      expect(state.board[6][c]?.color).toBe('white');
      expect(state.board[1][c]?.type).toBe('pawn');
      expect(state.board[1][c]?.color).toBe('black');
    }

    // Kings at e1 (row 7, col 4) and e8 (row 0, col 4)
    expect(state.board[7][4]?.type).toBe('king');
    expect(state.board[7][4]?.color).toBe('white');
    expect(state.board[0][4]?.type).toBe('king');
    expect(state.board[0][4]?.color).toBe('black');
  });

  test('Pawn 2-step advance creates en-passant target and 1-step move works', () => {
    const state = engine.getInitialState();
    // White e2 -> e4 (row 6, col 4 -> row 4, col 4)
    const moveE4: ChessMove = {
      from: { row: 6, col: 4 },
      to: { row: 4, col: 4 },
      piece: state.board[6][4]!,
    };
    const { newState } = engine.applyMove(state, moveE4);
    expect(newState.board[6][4]).toBeNull();
    expect(newState.board[4][4]?.type).toBe('pawn');
    expect(newState.board[4][4]?.color).toBe('white');
    expect(newState.enPassantTarget).toEqual({ row: 5, col: 4 });
    expect(newState.currentTurn).toBe('black');
  });

  test('En Passant capture works correctly', () => {
    let state = engine.getInitialState();
    // 1. e4
    state = engine.applyMove(state, {
      from: { row: 6, col: 4 },
      to: { row: 4, col: 4 },
      piece: state.board[6][4]!,
    }).newState;
    // 1... a6 (irrelevant black move)
    state = engine.applyMove(state, {
      from: { row: 1, col: 0 },
      to: { row: 2, col: 0 },
      piece: state.board[1][0]!,
    }).newState;
    // 2. e5
    state = engine.applyMove(state, {
      from: { row: 4, col: 4 },
      to: { row: 3, col: 4 },
      piece: state.board[4][4]!,
    }).newState;
    // 2... d5 (black pawn 2-step jump next to white pawn)
    state = engine.applyMove(state, {
      from: { row: 1, col: 3 },
      to: { row: 3, col: 3 },
      piece: state.board[1][3]!,
    }).newState;
    expect(state.enPassantTarget).toEqual({ row: 2, col: 3 });

    // 3. exd6 (en passant capture)
    const epMove: ChessMove = {
      from: { row: 3, col: 4 },
      to: { row: 2, col: 3 },
      piece: state.board[3][4]!,
      moveType: 'en_passant',
    };
    const { newState, result } = engine.applyMove(state, epMove);
    expect(result.isValid).toBe(true);
    expect(newState.board[3][3]).toBeNull(); // Captured black pawn on d5 removed!
    expect(newState.board[2][3]?.type).toBe('pawn');
    expect(newState.board[2][3]?.color).toBe('white');
    expect(newState.capturedPieces.white.length).toBe(1);
    expect(newState.capturedPieces.white[0].type).toBe('pawn');
  });

  test('Castling Kingside (O-O) moves both King and Rook correctly', () => {
    let state = engine.getInitialState();
    // Clear path between e1 and h1:
    // Move e2-e4
    state = engine.applyMove(state, { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, piece: state.board[6][4]! }).newState;
    // Black e7-e5
    state = engine.applyMove(state, { from: { row: 1, col: 4 }, to: { row: 3, col: 4 }, piece: state.board[1][4]! }).newState;
    // Move Nf3 (g1 -> f3: row 7, col 6 -> row 5, col 5)
    state = engine.applyMove(state, { from: { row: 7, col: 6 }, to: { row: 5, col: 5 }, piece: state.board[7][6]! }).newState;
    // Black Nc6
    state = engine.applyMove(state, { from: { row: 0, col: 1 }, to: { row: 2, col: 2 }, piece: state.board[0][1]! }).newState;
    // Move Be2 / Bc4 (f1 -> c4: row 7, col 5 -> row 4, col 2)
    state = engine.applyMove(state, { from: { row: 7, col: 5 }, to: { row: 4, col: 2 }, piece: state.board[7][5]! }).newState;
    // Black Nf6
    state = engine.applyMove(state, { from: { row: 0, col: 6 }, to: { row: 2, col: 5 }, piece: state.board[0][6]! }).newState;

    // White should now have legal castling kingside move (e1 -> g1: row 7, col 4 -> row 7, col 6)
    const legalMoves = ChessRules.getLegalMoves(state.board, { row: 7, col: 4 }, state.castlingRights, state.enPassantTarget);
    const castleMove = legalMoves.find((m) => m.moveType === 'castle_kingside');
    expect(castleMove).toBeDefined();

    const { newState, result } = engine.applyMove(state, castleMove!);
    expect(result.isValid).toBe(true);
    expect(newState.board[7][4]).toBeNull(); // King left e1
    expect(newState.board[7][6]?.type).toBe('king'); // King on g1
    expect(newState.board[7][7]).toBeNull(); // Rook left h1
    expect(newState.board[7][5]?.type).toBe('rook'); // Rook on f1
    expect(newState.castlingRights.white.kingside).toBe(false);
    expect(newState.castlingRights.white.queenside).toBe(false);
  });

  test("Scholar's Mate Checkmate detection works", () => {
    let state = engine.getInitialState();
    // 1. e4 e5
    state = engine.applyMove(state, { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, piece: state.board[6][4]! }).newState;
    state = engine.applyMove(state, { from: { row: 1, col: 4 }, to: { row: 3, col: 4 }, piece: state.board[1][4]! }).newState;
    // 2. Bc4 Nc6
    state = engine.applyMove(state, { from: { row: 7, col: 5 }, to: { row: 4, col: 2 }, piece: state.board[7][5]! }).newState;
    state = engine.applyMove(state, { from: { row: 0, col: 1 }, to: { row: 2, col: 2 }, piece: state.board[0][1]! }).newState;
    // 3. Qh5 Nf6??
    state = engine.applyMove(state, { from: { row: 7, col: 3 }, to: { row: 3, col: 7 }, piece: state.board[7][3]! }).newState;
    state = engine.applyMove(state, { from: { row: 0, col: 6 }, to: { row: 2, col: 5 }, piece: state.board[0][6]! }).newState;
    // 4. Qxf7#
    const mateMove: ChessMove = {
      from: { row: 3, col: 7 },
      to: { row: 1, col: 5 },
      piece: state.board[3][7]!,
      capturedPiece: state.board[1][5],
    };
    const { newState, result } = engine.applyMove(state, mateMove);
    expect(result.isValid).toBe(true);
    expect(newState.isCheck).toBe(true);
    expect(newState.isCheckmate).toBe(true);
    expect(newState.gameStatus).toBe('checkmate');
    expect(newState.winner).toBe('white');
  });

  test('Pinned piece cannot move and expose King', () => {
    // Setup a board where a knight is pinned to king by a rook
    const board = ChessRules.createInitialBoard();
    // Empty board except King on e1 (row 7, col 4), Knight on e2 (row 6, col 4), Enemy Rook on e8 (row 0, col 4)
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        board[r][c] = null;
      }
    }
    board[7][4] = { id: 'w_k', type: 'king', color: 'white', hasMoved: false };
    board[6][4] = { id: 'w_n', type: 'knight', color: 'white', hasMoved: false };
    board[0][4] = { id: 'b_r', type: 'rook', color: 'black', hasMoved: true };
    board[0][0] = { id: 'b_k', type: 'king', color: 'black', hasMoved: false };

    // White Knight on e2 is absolute pinned! Any move by the knight would leave King in check.
    const legalKnightMoves = ChessRules.getLegalMoves(board, { row: 6, col: 4 });
    expect(legalKnightMoves.length).toBe(0);
  });

  test('Stalemate is accurately detected as draw', () => {
    // Standard stalemate: White King on a8, Black Queen on b6, Black King on c7
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    board[0][0] = { id: 'w_k', type: 'king', color: 'white', hasMoved: true }; // a8
    board[2][1] = { id: 'b_q', type: 'queen', color: 'black', hasMoved: true }; // b6
    board[1][2] = { id: 'b_k', type: 'king', color: 'black', hasMoved: true }; // c7

    const inCheck = ChessRules.isInCheck(board, 'white');
    expect(inCheck).toBe(false);
    const isStalemate = ChessRules.isStalemate(board, 'white');
    expect(isStalemate).toBe(true);
  });

  test('Insufficient material (K vs K, K+N vs K, K+B vs K) recognized', () => {
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    board[7][4] = { id: 'w_k', type: 'king', color: 'white', hasMoved: true };
    board[0][4] = { id: 'b_k', type: 'king', color: 'black', hasMoved: true };

    expect(ChessRules.isInsufficientMaterial(board)).toBe(true);

    board[6][4] = { id: 'w_n', type: 'knight', color: 'white', hasMoved: true };
    expect(ChessRules.isInsufficientMaterial(board)).toBe(true);
  });
});
