const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema(
  {
    matchId: { type: String, required: true, unique: true },
    gameId: { type: String, required: true },
    lobbyId: { type: String },
    players: [
      {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        score: { type: Number, default: 0 },
        position: { type: Number, default: 0 },
        isWinner: { type: Boolean, default: false },
      },
    ],
    winnerId: { type: String },
    potAmount: { type: Number, default: 0 },
    boardState: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['in_progress', 'completed', 'cancelled'], default: 'in_progress' },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Match || mongoose.model('Match', MatchSchema);
