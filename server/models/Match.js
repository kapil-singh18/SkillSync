const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    matchReason: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['suggested', 'connected', 'dismissed'],
      default: 'suggested',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index so we can quickly look up any pair regardless of order
matchSchema.index({ userA: 1, userB: 1 }, { unique: true });

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;
