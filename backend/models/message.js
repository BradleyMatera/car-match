const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  senderId: mongoose.Schema.Types.Mixed, // string from mock or number from seeded demo
  senderUsername: String,
  senderEffectivePremiumStatus: Boolean,
  recipientId: mongoose.Schema.Types.Mixed,
  recipientUsername: String,
  recipientEffectivePremiumStatus: Boolean,
  text: String,
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  category: String,
  systemMessage: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema);

