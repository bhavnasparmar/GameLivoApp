const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    category: { type: String, enum: ['bug', 'account', 'coins', 'gameplay', 'other'], default: 'other' },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
    moderatorNotes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.models.SupportTicket || mongoose.model('SupportTicket', SupportTicketSchema);
