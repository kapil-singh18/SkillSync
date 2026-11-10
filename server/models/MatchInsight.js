const mongoose = require('mongoose');

/**
 * Caches AI-generated match insight text for a user pair.
 * userA and userB are ALWAYS stored in sorted string order so the
 * pair is symmetric (A↔B lookup == B↔A lookup).
 */
const matchInsightSchema = new mongoose.Schema(
  {
    userA: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userB: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['peer', 'mentor'], required: true },
    text: { type: String, required: true },
    // SHA-256 hash of the concatenated skills/interests/goals used to generate
    // this insight. If the profiles change, the hash changes and the cache is stale.
    inputHash: { type: String, required: true },
    // TTL field — MongoDB automatically removes expired documents.
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
);

matchInsightSchema.index({ userA: 1, userB: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('MatchInsight', matchInsightSchema);

