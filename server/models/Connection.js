const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['peer', 'mentorship'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled'],
      default: 'pending',
    },
    message: {
      type: String,
      maxlength: 300,
      default: '',
    },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

// Partial unique index: only one active (pending or accepted) connection
// per requester-recipient-type pair.
connectionSchema.index(
  { requester: 1, recipient: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'accepted'] } },
    name: 'unique_active_connection',
  }
);

connectionSchema.index({ recipient: 1, status: 1 });
connectionSchema.index({ requester: 1, status: 1 });

module.exports = mongoose.model('Connection', connectionSchema);

