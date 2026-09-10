// ─── Turn Manager ────────────────────────────────────────────────────────────

export class TurnManager {
  private playerIds: string[];
  private currentIndex: number;

  constructor(playerIds: string[]) {
    this.playerIds = playerIds;
    this.currentIndex = 0;
  }

  getCurrentPlayerId(): string {
    return this.playerIds[this.currentIndex];
  }

  next(skip?: string[]): string {
    do {
      this.currentIndex = (this.currentIndex + 1) % this.playerIds.length;
    } while (skip?.includes(this.getCurrentPlayerId()));
    return this.getCurrentPlayerId();
  }

  setCurrentPlayer(playerId: string): void {
    const idx = this.playerIds.indexOf(playerId);
    if (idx !== -1) this.currentIndex = idx;
  }

  removePlayer(playerId: string): void {
    this.playerIds = this.playerIds.filter(id => id !== playerId);
    if (this.currentIndex >= this.playerIds.length) {
      this.currentIndex = 0;
    }
  }

  getPlayerCount(): number {
    return this.playerIds.length;
  }
}
