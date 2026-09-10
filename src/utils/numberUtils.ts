// ─── Number Utilities ────────────────────────────────────────────────────────

export const NumberUtils = {
  formatCoins: (coins: number): string => {
    if (coins >= 1_000_000) return `${(coins / 1_000_000).toFixed(1)}M`;
    if (coins >= 1_000) return `${(coins / 1_000).toFixed(1)}K`;
    return String(coins);
  },

  formatWinRate: (wins: number, total: number): string => {
    if (total === 0) return '0%';
    return `${Math.round((wins / total) * 100)}%`;
  },

  clamp: (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max),

  randomBetween: (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1)) + min,

  rollDice: (): number => NumberUtils.randomBetween(1, 6),

  pad: (num: number, size: number): string => String(num).padStart(size, '0'),
};
