import { LudoPlayerColor } from './ludoTypes';
import { LUDO_START_POSITIONS } from './ludoConstants';

// ─── Ludo Path ────────────────────────────────────────────────────────────────
// Converts a color's relative position (0-51 on the shared track)
// to an absolute board cell index for rendering.

export const LudoPath = {
  // 52-cell shared path coordinates (row, col) on a 15x15 grid
  SHARED_PATH: [
    // Red starting side (bottom-left to top going left column)
    [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
    // Top row left section
    [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
    // Up column center-left
    [7, 0], [6, 0],
    // Top-left corner going right
    [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
    // Top center
    [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
    // Right column going down
    [0, 7], [0, 8],
    [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
    // Right side going across
    [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
    // Down right column
    [7, 14], [8, 14],
    [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
    // Bottom section
    [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
    // Bottom center going left
    [14, 7], // position 51 — last cell before home stretch
  ] as [number, number][],

  getCellForPosition: (
    position: number,
    color: LudoPlayerColor,
  ): [number, number] => {
    const startIndex = LUDO_START_POSITIONS[color];
    const absoluteIndex = (startIndex + position) % 52;
    return LudoPath.SHARED_PATH[absoluteIndex];
  },
};
