/**
 * controllers/matchController.js
 *
 * GET /api/matches/discover  — scored, ranked candidate list with AI insights
 * POST /api/matches/:userId/dismiss
 * DELETE /api/matches/dismissed
 */

const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Connection = require('../models/Connection');
const Dismissal = require('../models/Dismissal');
const { calculatePeerScore, calculateMentorScore } = require('../services/matchingService');
const { getInsights } = require('../services/matchInsightService');

const POOL_CAP = 300;
const MIN_SCORE = 15;
const MAX_LIMIT = 20;

// Fields to SELECT from the candidate pool (never email or private fields)
const CANDIDATE_SELECT =
  'name role headline avatarUrl skills interests learningGoals availability mentorProfile location';

// ── Discover ──────────────────────────────────────────────────────────────────

exports.discover = asyncHandler(async (req, res) => {
  const me = req.user;
  const type = req.query.type === 'mentor' ? 'mentor' : 'peer';
  const skillFilter = typeof req.query.skill === 'string' ? req.query.skill.trim().toLowerCase() : '';
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || 12));

  // If the user has no skills and no interests, prompt them to complete their profile
  const hasProfile =
    (me.skills && me.skills.length > 0) ||
    (me.interests && me.interests.length > 0);

  if (!hasProfile) {
    return res.status(200).json({ success: true, needsProfile: true, results: [], total: 0 });
  }

  // ── Build exclusion sets ───────────────────────────────────────────────────
  // Users I've dismissed
  const dismissals = await Dismissal.find({ user: me._id }).select('dismissedUser').lean();
  const dismissedIds = dismissals.map((d) => d.dismissedUser);

  // Users with whom I have a pending or accepted connection of this type
  const existingConnections = await Connection.find({
    $or: [
      { requester: me._id, type: type === 'mentor' ? 'mentorship' : 'peer', status: { $in: ['pending', 'accepted'] } },
      { recipient: me._id, type: type === 'mentor' ? 'mentorship' : 'peer', status: { $in: ['pending', 'accepted'] } },
    ],
  })
    .select('requester recipient')
    .lean();

  const connectedIds = new Set(
    existingConnections.flatMap((c) => [String(c.requester), String(c.recipient)])
  );
  connectedIds.delete(String(me._id)); // keep me out of the exclusion set itself

  // ── Build candidate query ──────────────────────────────────────────────────
  const query = {
    _id: { $nin: [me._id, ...dismissedIds, ...[...connectedIds].map((id) => new mongoose.Types.ObjectId(id))] },
    isActive: true,
    isEmailVerified: true,
    role: { $ne: 'admin' },
  };

  if (type === 'mentor') {
    query.role = 'mentor';
    query['mentorProfile.acceptingMentees'] = true;
  }

  if (skillFilter) {
    query['skills.name'] = { $regex: skillFilter, $options: 'i' };
  }

  // ── Load candidate pool (capped at POOL_CAP) ───────────────────────────────
  const candidates = await User.find(query)
    .select(CANDIDATE_SELECT)
    .limit(POOL_CAP)
    .lean();

  // ── Score in memory ────────────────────────────────────────────────────────
  const meObj = me.toObject ? me.toObject() : me;
  const scoreFn = type === 'mentor' ? calculateMentorScore : calculatePeerScore;

  const scored = candidates
    .map((candidate) => {
      const result = scoreFn(meObj, candidate);
      return { user: candidate, ...result };
    })
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);

  const total = scored.length;

  // ── Paginate ───────────────────────────────────────────────────────────────
  const start = (page - 1) * limit;
  const paginated = scored.slice(start, start + limit);

  // ── AI insights for top 8 overall (re-use cached for subsequent pages) ─────
  const insightMap = await getInsights(meObj, scored, type);

  // ── Build response (public-safe, no email) ─────────────────────────────────
  const insightType = type === 'mentor' ? 'mentor' : 'peer';
  const results = paginated.map(({ user, score, breakdown, sharedSkills, sharedInterests, overlappingSlots, canTeachMe }) => ({
    user: {
      _id: user._id,
      name: user.name,
      role: user.role,
      headline: user.headline,
      avatarUrl: user.avatarUrl,
      location: user.location,
      skills: user.skills,
      interests: user.interests,
      learningGoals: user.learningGoals,
      mentorProfile: user.role === 'mentor' ? user.mentorProfile : undefined,
    },
    score,
    breakdown,
    sharedSkills,
    sharedInterests,
    overlappingSlots,
    canTeachMe,
    insight: insightMap.get(String(user._id)) || null,
  }));

  return res.status(200).json({
    success: true,
    needsProfile: false,
    results,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

// ── Dismiss ────────────────────────────────────────────────────────────────────

exports.dismiss = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID.' });
  }

  if (String(userId) === String(req.user._id)) {
    return res.status(400).json({ success: false, message: 'Cannot dismiss yourself.' });
  }

  await Dismissal.findOneAndUpdate(
    { user: req.user._id, dismissedUser: userId },
    { user: req.user._id, dismissedUser: userId },
    { upsert: true }
  );

  return res.status(200).json({ success: true, message: 'User dismissed.' });
});

// ── Clear all dismissals ───────────────────────────────────────────────────────

exports.clearDismissed = asyncHandler(async (req, res) => {
  await Dismissal.deleteMany({ user: req.user._id });
  return res.status(200).json({ success: true, message: 'All dismissed users cleared.' });
});

