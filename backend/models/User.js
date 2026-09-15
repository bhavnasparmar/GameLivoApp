const mongoose = require('mongoose');

const BlockedUserSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  username: { type: String, required: true },
  avatar: { type: String, default: '' },
  reason: { type: String, default: 'Blocked by user' },
  blockedAt: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, sparse: true, trim: true, lowercase: true },
    mobile: { type: String, sparse: true, trim: true },
    password: { type: String },
    avatar: { type: String, default: '' },
    bio: { type: String, default: 'Board game enthusiast 🎲' },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 1000 },
    rank: { type: Number, default: 999 },
    totalGamesPlayed: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    totalLosses: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    referralCode: { type: String, unique: true },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },

    // Preferences
    preferences: {
      notifications: { type: Boolean, default: true },
      matchAlerts: { type: Boolean, default: true },
      friendActivity: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false },
      soundEffects: { type: Boolean, default: true },
      bgMusic: { type: Boolean, default: true },
      haptics: { type: Boolean, default: true },
      theme: { type: String, default: 'dark' },
      language: { type: String, default: 'English' },
    },

    // Privacy & Security
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
      showOnlineStatus: { type: Boolean, default: true },
      allowFriendRequests: { type: Boolean, default: true },
      allowGameInvites: { type: Boolean, default: true },
      twoFactorEnabled: { type: Boolean, default: false },
    },

    // Blocked Players List
    blockedUsers: [BlockedUserSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
