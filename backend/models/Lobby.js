const mongoose = require('mongoose');

const LobbyPlayerSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  username: { type: String, required: true },
  avatar: { type: String, default: '' },
  isHost: { type: Boolean, default: false },
  isReady: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now },
});

const LobbySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    gameId: { type: String, required: true },
    entryFee: { type: Number, default: 100 },
    maxPlayers: { type: Number, default: 4 },
    isPrivate: { type: Boolean, default: false },
    hostId: { type: String, required: true },
    players: [LobbyPlayerSchema],
    status: { type: String, enum: ['waiting', 'starting', 'in_progress', 'finished'], default: 'waiting' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Lobby || mongoose.model('Lobby', LobbySchema);
