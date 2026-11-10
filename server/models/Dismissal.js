const mongoose = require('mongoose');

const dismissalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dismissedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

dismissalSchema.index({ user: 1, dismissedUser: 1 }, { unique: true });

module.exports = mongoose.model('Dismissal', dismissalSchema);

