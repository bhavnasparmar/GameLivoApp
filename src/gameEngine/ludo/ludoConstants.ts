// ─── Ludo Constants ───────────────────────────────────────────────────────────

export const LUDO_BOARD_SIZE = 15; // 15x15 grid
export const LUDO_TOTAL_CELLS = 52; // Safe path cells
export const LUDO_HOME_STRETCH_LENGTH = 5;
export const LUDO_TOKENS_PER_PLAYER = 4;
export const LUDO_WIN_POSITION = 57; // Reached home

// Star/safe cells (0-indexed on the path)
export const LUDO_SAFE_CELLS = [0, 8, 13, 21, 26, 34, 39, 47];

// Starting positions for each color on the unified path
export const LUDO_START_POSITIONS: Record<string, number> = {
  red: 0,
  green: 13,
  blue: 26,
  yellow: 39,
};

// Home stretch starting position (before final home)
export const LUDO_HOME_STRETCH_START: Record<string, number> = {
  red: 51,
  green: 12,
  blue: 25,
  yellow: 38,
};
