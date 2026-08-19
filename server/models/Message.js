const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // For direct messages
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // For study room messages
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// At least one of receiver or room must be set
messageSchema.pre('validate', function (next) {
  if (!this.receiver && !this.room) {
    return next(new Error('Message must have either a receiver or a room'));
  }
  next();
});

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ room: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
