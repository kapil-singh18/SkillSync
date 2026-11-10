const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    // Exactly one of conversation or room must be set
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', default: null },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    // Client-generated deduplication id
    clientId: { type: String, default: null },
    // Soft delete
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Exactly one of conversation or room must be set
messageSchema.pre('validate', function (next) {
  const hasBoth = this.conversation && this.room;
  const hasNeither = !this.conversation && !this.room;
  if (hasBoth || hasNeither) {
    return next(new Error('Message must belong to exactly one of: conversation or room'));
  }
  next();
});

// Pagination indexes
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ room: 1, createdAt: -1 });
// Deduplication index
messageSchema.index({ sender: 1, clientId: 1 }, { sparse: true });

module.exports = mongoose.model('Message', messageSchema);

