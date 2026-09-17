import { LudoPlayerColor } from './ludoTypes';

// ─── Ludo Constants ───────────────────────────────────────────────────────────

export const LUDO_DEFAULT_TURN_TIME = 15; // 15s turn timer

// 4-Player Board Metrics
export const LUDO_4P_TOTAL_CELLS = 52; // Main track perimeter cells
export const LUDO_4P_HOME_STRETCH_LENGTH = 5; // 5 cells in colored corridor
export const LUDO_4P_WIN_STEP = 57; // 56th step is home corridor end, 57 is center win!
export const LUDO_TOKENS_PER_PLAYER = 4;

// 6-Player Board Metrics
export const LUDO_6P_TOTAL_CELLS = 72; // Main perimeter cells for 6-arm board
export const LUDO_6P_HOME_STRETCH_LENGTH = 5;
export const LUDO_6P_WIN_STEP = 77;

// 4-Player Color Order & Configurations (Matching Image: Red = TL, Yellow = TR, Green = BL, Blue = BR)
export const LUDO_4P_COLORS: LudoPlayerColor[] = ['red', 'yellow', 'green', 'blue'];

// 6-Player Color Order & Configurations
export const LUDO_6P_COLORS: LudoPlayerColor[] = ['red', 'yellow', 'green', 'blue', 'orange', 'purple'];

export const LUDO_COLOR_THEMES: Record<
  LudoPlayerColor,
  {
    name: string;
    primary: string;
    dark: string;
    light: string;
    glow: string;
    badge: string;
    hexCode: string;
  }
> = {
  red: {
    name: 'Player 1',
    primary: '#E74C3C',
    dark: '#922B21',
    light: '#FADBD8',
    glow: 'rgba(231, 76, 60, 0.4)',
    badge: '🔴',
    hexCode: '#E74C3C',
  },
  yellow: {
    name: 'Player 2',
    primary: '#F1C40F',
    dark: '#B7950B',
    light: '#FCF3CF',
    glow: 'rgba(241, 196, 15, 0.4)',
    badge: '🟡',
    hexCode: '#F1C40F',
  },
  green: {
    name: 'Player 3',
    primary: '#2ECC71',
    dark: '#1E8449',
    light: '#D4EFDF',
    glow: 'rgba(46, 204, 113, 0.4)',
    badge: '🟢',
    hexCode: '#2ECC71',
  },
  blue: {
    name: 'Player 4',
    primary: '#3498DB',
    dark: '#1F618D',
    light: '#D6EAF8',
    glow: 'rgba(52, 152, 219, 0.4)',
    badge: '🔵',
    hexCode: '#3498DB',
  },
  orange: {
    name: 'Player 5',
    primary: '#E67E22',
    dark: '#A04000',
    light: '#EDBB99',
    glow: 'rgba(230, 126, 34, 0.4)',
    badge: '🟠',
    hexCode: '#E67E22',
  },
  purple: {
    name: 'Player 6',
    primary: '#9B59B6',
    dark: '#6C3483',
    light: '#EBDEF0',
    glow: 'rgba(155, 89, 182, 0.4)',
    badge: '🟣',
    hexCode: '#9B59B6',
  },
};

// 4-Player Start Track Indices on 52-cell circle
export const LUDO_4P_START_INDICES: Record<LudoPlayerColor, number> = {
  red: 0,
  green: 13,
  blue: 26,
  yellow: 39,
  orange: 0,
  purple: 0,
};

// 4-Player Safe Cells (Start cells + Star cells)
export const LUDO_4P_SAFE_CELLS: number[] = [
  0, 8, // Red
  13, 21, // Green
  26, 34, // Blue
  39, 47, // Yellow
];

// 6-Player Start Track Indices on 72-cell circle
export const LUDO_6P_START_INDICES: Record<LudoPlayerColor, number> = {
  red: 0,
  green: 12,
  blue: 24,
  yellow: 36,
  orange: 48,
  purple: 60,
};

// 6-Player Safe Cells
export const LUDO_6P_SAFE_CELLS: number[] = [
  0, 7, // Red
  12, 19, // Green
  24, 31, // Blue
  36, 43, // Yellow
  48, 55, // Orange
  60, 67, // Purple
];

// Preset Bot Profiles for 1-6 player games
export const LUDO_BOT_PROFILES = [
  { id: 'bot_p2', name: 'Player 2', avatar: '👧🏻', rating: 1480, style: 'balanced' },
  { id: 'bot_p3', name: 'Player 3', avatar: '👦🏽', rating: 1450, style: 'strategic' },
  { id: 'bot_p4', name: 'Player 4', avatar: '👩🏻', rating: 1520, style: 'aggressive' },
  { id: 'bot_p5', name: 'Player 5', avatar: '🧑🏽', rating: 1420, style: 'defensive' },
  { id: 'bot_p6', name: 'Player 6', avatar: '👱🏻‍♂️', rating: 1500, style: 'aggressive' },
];
