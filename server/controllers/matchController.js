const User = require('../models/User');
const Match = require('../models/Match');
const { calculateMatchScore, generateMatchExplanation } = require('../services/matchingService');

// ─── GET /api/matches/discover ────────────────────────────────────────────────

const discover = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id);

    // Find users this person has already acted on (connected or dismissed)
    const actedMatches = await Match.find({
      $or: [{ userA: currentUser._id }, { userB: currentUser._id }],
      status: { $in: ['connected', 'dismissed'] },
    });

    const actedUserIds = actedMatches.map((m) =>
      m.userA.toString() === currentUser._id.toString()
        ? m.userB.toString()
        : m.userA.toString()
    );

    // Fetch all other users not yet acted on
    const candidates = await User.find({
      _id: { $ne: currentUser._id, $nin: actedUserIds },
    });

    // Score + explain each candidate
    const scored = await Promise.all(
      candidates.map(async (candidate) => {
        const score = calculateMatchScore(currentUser, candidate);
        const reason = await generateMatchExplanation(currentUser, candidate, score);
        return {
          user: {
            _id: candidate._id,
            name: candidate.name,
            role: candidate.role,
            bio: candidate.bio,
            skills: candidate.skills,
            interests: candidate.interests,
            learningGoals: candidate.learningGoals,
          },
          matchScore: score,
          matchReason: reason,
        };
      })
    );

    // Return top 10 sorted by score descending
    const results = scored
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    return res.status(200).json({ success: true, matches: results });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/matches/:userId/connect ───────────────────────────────────────

const connect = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot connect with yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Normalise pair so userA < userB (lexicographic) to ensure uniqueness
    const [userA, userB] = [currentUserId.toString(), userId].sort();

    const match = await Match.findOneAndUpdate(
      { userA, userB },
      { userA, userB, status: 'connected' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, match });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/matches/:userId/dismiss ───────────────────────────────────────

const dismiss = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const [userA, userB] = [currentUserId.toString(), userId].sort();

    const match = await Match.findOneAndUpdate(
      { userA, userB },
      { userA, userB, status: 'dismissed' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, match });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/matches/connections ─────────────────────────────────────────────

const getConnections = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    const matches = await Match.find({
      $or: [{ userA: currentUserId }, { userB: currentUserId }],
      status: 'connected',
    })
      .populate('userA', 'name role bio skills interests')
      .populate('userB', 'name role bio skills interests');

    // Return the "other" user from each match
    const connections = matches.map((m) => {
      const other =
        m.userA._id.toString() === currentUserId.toString() ? m.userB : m.userA;
      return {
        matchId: m._id,
        user: other,
        matchScore: m.matchScore,
        matchReason: m.matchReason,
        connectedAt: m.updatedAt,
      };
    });

    return res.status(200).json({ success: true, connections });
  } catch (error) {
    next(error);
  }
};

module.exports = { discover, connect, dismiss, getConnections };
