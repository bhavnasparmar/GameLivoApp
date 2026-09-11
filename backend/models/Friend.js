const mongoose = require('mongoose');

const FriendRequestSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined', 'blocked'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.FriendRequest || mongoose.model('FriendRequest', FriendRequestSchema);
