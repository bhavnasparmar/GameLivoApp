import { LudoPlayerColor } from './ludoTypes';

// ─── Ludo Constants ───────────────────────────────────────────────────────────

export const LUDO_DEFAULT_TURN_TIME = 15; // 15s turn timer

// 4-Player Board Metrics
export const LUDO_4P_TOTAL_CELLS = 52; // Main track perimeter cells
export const LUDO_4P_HOME_STRETCH_LENGTH = 5; // 5 cells in colored corridor
export const LUDO_4P_WIN_STEP = 56; // 50 perimeter steps + 5 corridor steps + 1 center home win step = 56
export const LUDO_TOKENS_PER_PLAYER = 4;

// 5-Player Board Metrics
export const LUDO_5P_TOTAL_CELLS = 60; // Main track perimeter cells for 5-arm pentagon
export const LUDO_5P_HOME_STRETCH_LENGTH = 5;
export const LUDO_5P_WIN_STEP = 64; // 58 perimeter steps + 5 corridor steps + 1 center home win step = 64

// 6-Player Board Metrics
export const LUDO_6P_TOTAL_CELLS = 72; // Main perimeter cells for 6-arm board
export const LUDO_6P_HOME_STRETCH_LENGTH = 5;
export const LUDO_6P_WIN_STEP = 76; // 70 perimeter steps + 5 corridor steps + 1 center home win step = 76

// 4-Player Color Order & Configurations (Standard Clockwise: Red = TL, Green = TR, Yellow = BR, Blue = BL)
export const LUDO_4P_COLORS: LudoPlayerColor[] = ['red', 'green', 'yellow', 'blue'];

// 5-Player Color Order & Configurations (Clockwise: Red = TL, Green = TR, Yellow = BR, Blue = Bottom, Purple = Left)
export const LUDO_5P_COLORS: LudoPlayerColor[] = ['red', 'green', 'yellow', 'blue', 'purple'];

// 6-Player Color Order & Configurations (Clockwise: Red=TL, Green=TR, Yellow=MR, Blue=BR, Purple=ML, Orange=BL)
export const LUDO_6P_COLORS: LudoPlayerColor[] = ['red', 'green', 'yellow', 'blue', 'purple', 'orange'];

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
    primary: '#E53935',
    dark: '#C62828',
    light: '#FFEBEE',
    glow: 'rgba(229, 57, 53, 0.4)',
    badge: '🔴',
    hexCode: '#E53935',
  },
  green: {
    name: 'Player 2',
    primary: '#00A859',
    dark: '#1B5E20',
    light: '#E8F8F0',
    glow: 'rgba(0, 168, 89, 0.4)',
    badge: '🟢',
    hexCode: '#00A859',
  },
  yellow: {
    name: 'Player 3',
    primary: '#FFC107',
    dark: '#F57F17',
    light: '#FFFDE7',
    glow: 'rgba(255, 193, 7, 0.4)',
    badge: '🟡',
    hexCode: '#FFC107',
  },
  blue: {
    name: 'Player 4',
    primary: '#0288D1',
    dark: '#0D47A1',
    light: '#E1F5FE',
    glow: 'rgba(2, 136, 209, 0.4)',
    badge: '🔵',
    hexCode: '#0288D1',
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

// 4-Player Start Track Indices on 52-cell circle (Clockwise: Red=0, Green=13, Yellow=26, Blue=39)
export const LUDO_4P_START_INDICES: Record<LudoPlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
  orange: 0,
  purple: 0,
};

// 4-Player Safe Cells (4 Start cells + 4 Star cells)
export const LUDO_4P_SAFE_CELLS: number[] = [
  0, 8, // Red Start (0) & Star (8)
  13, 21, // Green Start (13) & Star (21)
  26, 34, // Yellow Start (26) & Star (34)
  39, 47, // Blue Start (39) & Star (47)
];

// 5-Player Start Track Indices on 60-cell circle (Clockwise: Red=0, Green=12, Yellow=24, Blue=36, Purple=48)
export const LUDO_5P_START_INDICES: Record<LudoPlayerColor, number> = {
  red: 0,
  green: 12,
  yellow: 24,
  blue: 36,
  purple: 48,
  orange: 0,
};

// 5-Player Safe Cells (5 Start cells + 5 Star cells)
export const LUDO_5P_SAFE_CELLS: number[] = [
  0, 6, // Red Start (0) & Star (6)
  12, 18, // Green Start (12) & Star (18)
  24, 30, // Yellow Start (24) & Star (30)
  36, 42, // Blue Start (36) & Star (42)
  48, 54, // Purple Start (48) & Star (54)
];

// 6-Player Start Track Indices on 72-cell circle (Clockwise: Red=0, Green=12, Yellow=24, Blue=36, Purple=48, Orange=60)
export const LUDO_6P_START_INDICES: Record<LudoPlayerColor, number> = {
  red: 0,
  green: 12,
  yellow: 24,
  blue: 36,
  purple: 48,
  orange: 60,
};

// 6-Player Safe Cells (6 Start cells + 6 Star cells)
export const LUDO_6P_SAFE_CELLS: number[] = [
  0, 6, // Red Start & Star
  12, 18, // Green Start & Star
  24, 30, // Yellow Start & Star
  36, 42, // Blue Start & Star
  48, 54, // Purple Start & Star
  60, 66, // Orange Start & Star
];

// Preset Bot Profiles for 1-6 player games
export const LUDO_BOT_PROFILES = [
  { id: 'bot_p2', name: 'Player 2', avatar: '👧🏻', rating: 1480, style: 'balanced' },
  { id: 'bot_p3', name: 'Player 3', avatar: '👦🏽', rating: 1450, style: 'strategic' },
  { id: 'bot_p4', name: 'Player 4', avatar: '👩🏻', rating: 1520, style: 'aggressive' },
  { id: 'bot_p5', name: 'Player 5', avatar: '🧑🏽', rating: 1420, style: 'defensive' },
  { id: 'bot_p6', name: 'Player 6', avatar: '👱🏻‍♂️', rating: 1500, style: 'aggressive' },
];
