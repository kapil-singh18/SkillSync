const User = require('../models/User');
const Badge = require('../models/Badge');

// ─── GET /api/gamification/leaderboard ──────────────────────────────────────

exports.getLeaderboard = async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    const users = await User.find()
      .sort({ points: -1 })
      .limit(limit)
      .select('name email role points badges')
      .populate('badges', 'name iconUrl');

    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/gamification/badges — list all badges ─────────────────────────

exports.getAllBadges = async (req, res, next) => {
  try {
    const badges = await Badge.find().sort({ name: 1 });
    res.json({ success: true, data: badges });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/gamification/me — current user's gamification stats ───────────

exports.getMyStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('name points badges')
      .populate('badges', 'name description iconUrl criteria');

    const allBadges = await Badge.find();

    res.json({
      success: true,
      data: {
        points: user.points || 0,
        earnedBadges: user.badges || [],
        totalBadges: allBadges.length,
        rank: await User.countDocuments({ points: { $gt: user.points || 0 } }) + 1,
      },
    });
  } catch (err) {
    next(err);
  }
};
