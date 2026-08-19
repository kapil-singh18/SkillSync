/**
 * Gamification Service
 *
 * Centralised helper that awards points and checks badge eligibility
 * whenever a gamification-worthy event occurs.
 */
const User = require('../models/User');
const Badge = require('../models/Badge');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const Roadmap = require('../models/Roadmap');
const Project = require('../models/Project');

// ─── Point values ────────────────────────────────────────────────────────────

const POINTS = {
  CREATE_POST: 10,
  LEAVE_COMMENT: 5,
  RECEIVE_UPVOTE: 3,
  COMPLETE_ASSESSMENT: 15,
  HIGH_SCORE_ASSESSMENT: 25,
  CREATE_ROADMAP: 10,
  JOIN_PROJECT: 10,
};

// ─── Award points ────────────────────────────────────────────────────────────

const awardPoints = async (userId, amount) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { points: amount } },
    { new: true }
  );
  return user;
};

// ─── Badge checkers ──────────────────────────────────────────────────────────

/**
 * Check all badge conditions for a user and grant any newly earned badges.
 * Returns array of newly awarded badge names (empty if none).
 */
const checkAndAwardBadges = async (userId) => {
  const user = await User.findById(userId).populate('badges');
  if (!user) return [];

  const allBadges = await Badge.find();
  const ownedNames = new Set((user.badges || []).map((b) => b.name));
  const newlyAwarded = [];

  for (const badge of allBadges) {
    if (ownedNames.has(badge.name)) continue;

    const earned = await isBadgeEarned(badge.name, userId, user);
    if (earned) {
      user.badges.push(badge._id);
      newlyAwarded.push(badge.name);
    }
  }

  if (newlyAwarded.length > 0) {
    await user.save();
  }

  return newlyAwarded;
};

/**
 * Evaluate a single badge condition against user data.
 */
const isBadgeEarned = async (badgeName, userId, user) => {
  switch (badgeName) {
    case 'First Post': {
      const count = await Post.countDocuments({ author: userId });
      return count >= 1;
    }
    case 'Conversationalist': {
      const count = await Comment.countDocuments({ author: userId });
      return count >= 10;
    }
    case 'Helpful Hand': {
      const posts = await Post.find({ author: userId });
      const totalUpvotes = posts.reduce((sum, p) => sum + (p.upvotes?.length || 0), 0);
      return totalUpvotes >= 10;
    }
    case 'Team Player': {
      const count = await Project.countDocuments({ members: userId });
      return count >= 1;
    }
    case 'Quiz Ace': {
      const attempt = await AssessmentAttempt.findOne({
        user: userId,
        scorePercent: { $gte: 80 },
      });
      return !!attempt;
    }
    case 'Roadmap Pioneer': {
      const count = await Roadmap.countDocuments({ user: userId });
      return count >= 1;
    }
    case 'Rising Star': {
      return (user.points || 0) >= 100;
    }
    case 'Explorer': {
      const count = await AssessmentAttempt.countDocuments({ user: userId });
      return count >= 5;
    }
    case 'Community Leader': {
      return (user.points || 0) >= 500 && (user.badges?.length || 0) >= 5;
    }
    default:
      return false;
  }
};

module.exports = {
  POINTS,
  awardPoints,
  checkAndAwardBadges,
};
