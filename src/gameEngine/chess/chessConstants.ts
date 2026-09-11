import { ChessPieceType, ChessTimePreset } from './chessTypes';

export const CHESS_BOARD_SIZE = 8;
export const CHESS_DEFAULT_TIME_SECONDS = 300; // 5 minutes

export const PIECE_VALUES: Record<ChessPieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 1000,
};

// High-fidelity Unicode glyphs for crisp fallback rendering
export const CHESS_GLYPHS = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
} as const;

export const CHESS_TIME_PRESETS: ChessTimePreset[] = [
  { id: '1m', label: '1 Min', seconds: 60, tag: 'Bullet ⚡' },
  { id: '3m', label: '3 Min', seconds: 180, tag: 'Blitz 🔥' },
  { id: '5m', label: '5 Min', seconds: 300, tag: 'Rapid ⏱️' },
  { id: '10m', label: '10 Min', seconds: 600, tag: 'Classic 🏆' },
  { id: 'unlimited', label: 'Unlimited', seconds: 0, tag: 'Casual ☕' },
];

export const BOARD_THEMES = {
  woodEmerald: {
    name: 'Royal Wood & Amber',
    lightSquare: '#F0E4C4',
    darkSquare: '#A97B48',
    selectedSquare: 'rgba(212, 160, 23, 0.65)',
    validMoveDot: 'rgba(31, 157, 85, 0.75)',
    captureTarget: 'rgba(230, 72, 58, 0.65)',
    lastMove: 'rgba(240, 198, 74, 0.35)',
    checkWarning: 'rgba(230, 72, 58, 0.85)',
    boardBorder: '#533722',
  },
  emeraldClassic: {
    name: 'Grandmaster Green',
    lightSquare: '#EEEED2',
    darkSquare: '#769656',
    selectedSquare: 'rgba(240, 198, 74, 0.7)',
    validMoveDot: 'rgba(20, 85, 30, 0.6)',
    captureTarget: 'rgba(230, 72, 58, 0.65)',
    lastMove: 'rgba(187, 203, 43, 0.45)',
    checkWarning: 'rgba(230, 72, 58, 0.85)',
    boardBorder: '#23391A',
  },
  midnightObsidian: {
    name: 'Midnight Obsidian',
    lightSquare: '#384252',
    darkSquare: '#1E2530',
    selectedSquare: 'rgba(212, 160, 23, 0.75)',
    validMoveDot: 'rgba(92, 242, 122, 0.7)',
    captureTarget: 'rgba(255, 106, 92, 0.75)',
    lastMove: 'rgba(74, 144, 226, 0.35)',
    checkWarning: 'rgba(230, 72, 58, 0.9)',
    boardBorder: '#0F1318',
  },
} as const;

export const INITIAL_PIECE_ORDER: ChessPieceType[] = [
  'rook',
  'knight',
  'bishop',
  'queen',
  'king',
  'bishop',
  'knight',
  'rook',
];
