// ─── Player Types (Game Engine) ──────────────────────────────────────────────

export type EnginePlayerColor = 'red' | 'green' | 'blue' | 'yellow';

export const PLAYER_COLORS: EnginePlayerColor[] = ['red', 'green', 'blue', 'yellow'];

export interface EnginePlayer {
  id: string;
  color: EnginePlayerColor;
  isBot: boolean;
}
