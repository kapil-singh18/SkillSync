const mongoose = require('mongoose');
const crypto = require('crypto');

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    description: { type: String, maxlength: 300, default: '', trim: true },
    tags: {
      type: [{ type: String, maxlength: 30, trim: true }],
      default: [],
      validate: { validator: (v) => v.length <= 5, message: 'Max 5 tags' },
    },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [memberSchema], default: [] },
    maxMembers: { type: Number, default: 30, max: 50 },
    // Only for private rooms — a short random code (index defined below, not on field)
    inviteCode: { type: String, default: null },
    lastMessageAt: { type: Date, default: Date.now },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

roomSchema.index({ 'members.user': 1 });
roomSchema.index({ visibility: 1, isArchived: 1 });
roomSchema.index({ inviteCode: 1 }, { sparse: true, unique: true });

/** Generate a readable invite code for private rooms */
roomSchema.statics.generateInviteCode = function () {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g. "A3F2C1B4"
};

module.exports = mongoose.model('Room', roomSchema);

