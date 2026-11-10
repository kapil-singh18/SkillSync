const mongoose = require('mongoose');

/**
 * Conversation — always exactly 2 participants, stored sorted so the pair
 * is symmetric (find by [A,B] == find by [B,A]).
 */
const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      validate: [
        { validator: (v) => v.length === 2, message: 'Conversation must have exactly 2 participants' },
      ],
    },
    lastMessage: {
      text: { type: String, default: '' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date },
    },
    // userId (string) → unread count
    unread: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Sorted pair ensures uniqueness regardless of order
conversationSchema.index({ participants: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);

