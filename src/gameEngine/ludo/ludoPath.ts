import { LudoPlayerColor, LudoBoardType } from './ludoTypes';
import {
  LUDO_4P_START_INDICES,
  LUDO_6P_START_INDICES,
  LUDO_4P_TOTAL_CELLS,
  LUDO_6P_TOTAL_CELLS,
} from './ludoConstants';

// ─── 4-Player Board Grid Path (15x15) Matching Image ──────────────────────────

export const LUDO_4P_SHARED_PATH: [number, number][] = [
  // 0-4: Red arm going down (Red Start at [1, 6])
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
  // 5-10: Turning left along top of green yard
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
  // 11-12: Left edge going down
  [7, 0], [8, 0],
  // 13-17: Green arm going right (Green Start at [8, 1])
  [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  // 18-23: Green arm going down
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
  // 24-25: Bottom edge going right
  [14, 7], [14, 8],
  // 26-30: Blue arm going up (Blue Start at [13, 8])
  [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
  // 31-36: Turning right along bottom of yellow yard
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
  // 37-38: Right edge going up
  [7, 14], [6, 14],
  // 39-43: Yellow arm going left (Yellow Start at [6, 13])
  [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
  // 44-49: Yellow arm going up
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  // 50-51: Top edge going left
  [0, 7], [0, 6],
];

// Home Stretch (5 cells for each color leading to center [7, 7])
export const LUDO_4P_HOME_STRETCH: Record<LudoPlayerColor, [number, number][]> = {
  red: [
    [1, 7], [2, 7], [3, 7], [4, 7], [5, 7],
  ],
  green: [
    [7, 1], [7, 2], [7, 3], [7, 4], [7, 5],
  ],
  blue: [
    [13, 7], [12, 7], [11, 7], [10, 7], [9, 7],
  ],
  yellow: [
    [7, 13], [7, 12], [7, 11], [7, 10], [7, 9],
  ],
  orange: [
    [1, 7], [2, 7], [3, 7], [4, 7], [5, 7],
  ],
  purple: [
    [13, 7], [12, 7], [11, 7], [10, 7], [9, 7],
  ],
};

// Base Yard Token Coordinates (row, col) inside 4 home quadrants (Matching Image)
export const LUDO_4P_BASE_SLOTS: Record<LudoPlayerColor, [number, number][]> = {
  red: [
    [1.8, 1.8], [1.8, 3.8], [3.8, 1.8], [3.8, 3.8],
  ],
  yellow: [
    [1.8, 10.8], [1.8, 12.8], [3.8, 10.8], [3.8, 12.8],
  ],
  green: [
    [10.8, 1.8], [10.8, 3.8], [12.8, 1.8], [12.8, 3.8],
  ],
  blue: [
    [10.8, 10.8], [10.8, 12.8], [12.8, 10.8], [12.8, 12.8],
  ],
  orange: [
    [1.8, 1.8], [1.8, 3.8], [3.8, 1.8], [3.8, 3.8],
  ],
  purple: [
    [10.8, 10.8], [10.8, 12.8], [12.8, 10.8], [12.8, 12.8],
  ],
};

export const LudoPath = {
  // Get grid coordinates (row, col) on 15x15 board for 4P
  get4PCellCoordinates: (
    stepCount: number, // 0 = at start, 51 = before home stretch, 52-56 = home stretch, 57 = center
    color: LudoPlayerColor,
    tokenStatus: 'home' | 'active' | 'finished',
    tokenIndex: number = 0,
  ): [number, number] => {
    if (tokenStatus === 'home') {
      const slots = LUDO_4P_BASE_SLOTS[color] || LUDO_4P_BASE_SLOTS.red;
      return slots[tokenIndex % 4] || slots[0];
    }

    if (tokenStatus === 'finished' || stepCount >= 57) {
      // Center Home square [7, 7]
      return [7, 7];
    }

    if (stepCount >= 52) {
      // In home stretch (52 to 56)
      const stretchIdx = Math.min(4, Math.max(0, stepCount - 52));
      const stretch = LUDO_4P_HOME_STRETCH[color] || LUDO_4P_HOME_STRETCH.red;
      return stretch[stretchIdx] || [7, 7];
    }

    // On shared main perimeter track (0 to 51 steps)
    const startIdx = LUDO_4P_START_INDICES[color] || 0;
    const trackIndex = (startIdx + stepCount) % LUDO_4P_TOTAL_CELLS;
    return LUDO_4P_SHARED_PATH[trackIndex] || [7, 7];
  },

  // Calculate track index for capturing logic
  getTrackIndex: (
    stepCount: number,
    color: LudoPlayerColor,
    boardType: LudoBoardType = '4player',
  ): number | null => {
    if (boardType === '4player') {
      if (stepCount < 0 || stepCount >= 52) return null; // In base or home stretch (safe)
      const startIdx = LUDO_4P_START_INDICES[color] || 0;
      return (startIdx + stepCount) % LUDO_4P_TOTAL_CELLS;
    } else {
      if (stepCount < 0 || stepCount >= 72) return null;
      const startIdx = LUDO_6P_START_INDICES[color] || 0;
      return (startIdx + stepCount) % LUDO_6P_TOTAL_CELLS;
    }
  },
};
