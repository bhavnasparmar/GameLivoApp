// ─── Chess Types ─────────────────────────────────────────────────────────────

export type ChessPieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type ChessColor = 'white' | 'black';

export interface ChessPiece {
  id: string;
  type: ChessPieceType;
  color: ChessColor;
  hasMoved: boolean;
}

export type ChessBoard = (ChessPiece | null)[][];

export interface ChessPosition {
  row: number; // 0 to 7 (0 is rank 8, 7 is rank 1 from White's perspective)
  col: number; // 0 to 7 (0 is 'a', 7 is 'h')
}

export type MoveType = 'normal' | 'capture' | 'castle_kingside' | 'castle_queenside' | 'en_passant' | 'promotion';

export interface ChessMove {
  from: ChessPosition;
  to: ChessPosition;
  piece: ChessPiece;
  capturedPiece?: ChessPiece | null;
  moveType?: MoveType;
  promotion?: ChessPieceType;
  notation?: string;
  isCheck?: boolean;
  isCheckmate?: boolean;
}

export interface CastlingRights {
  white: {
    kingside: boolean;
    queenside: boolean;
  };
  black: {
    kingside: boolean;
    queenside: boolean;
  };
}

export interface CapturedPiecesState {
  white: ChessPiece[]; // Pieces captured BY white (black pieces)
  black: ChessPiece[]; // Pieces captured BY black (white pieces)
}

export type ChessGameStatus = 'in_progress' | 'check' | 'checkmate' | 'stalemate' | 'draw_agreement' | 'draw_repetition' | 'draw_50move' | 'draw_material' | 'resigned' | 'timeout';

export interface ChessGameState {
  board: ChessBoard;
  currentTurn: ChessColor;
  whitePlayerId: string;
  blackPlayerId: string;
  castlingRights: CastlingRights;
  enPassantTarget: ChessPosition | null; // Square that can be captured via en passant
  halfmoveClock: number; // 50-move rule counter
  fullmoveNumber: number;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  gameStatus: ChessGameStatus;
  winner: ChessColor | 'draw' | null;
  winReason?: string;
  capturedPieces: CapturedPiecesState;
  moveHistory: ChessMove[];
  lastMove: ChessMove | null;
  whiteTimeLeft: number;
  blackTimeLeft: number;
  positionHistory: string[]; // For 3-fold repetition check
}

export type ChessDifficulty = 'easy' | 'medium' | 'hard';
export type ChessGameMode = 'computer' | 'local' | 'random' | 'private';

export interface ChessTimePreset {
  id: string;
  label: string;
  seconds: number;
  incrementSec?: number;
  tag: string;
}
