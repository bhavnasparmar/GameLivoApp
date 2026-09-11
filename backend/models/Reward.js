const mongoose = require('mongoose');

const RewardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    coins: { type: Number, required: true },
    type: { type: String, enum: ['daily', 'mission', 'achievement', 'referral'], default: 'daily' },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Reward || mongoose.model('Reward', RewardSchema);
