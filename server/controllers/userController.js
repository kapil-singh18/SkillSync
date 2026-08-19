const User = require('../models/User');

const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const VALID_LEVELS = ['beginner', 'intermediate', 'advanced'];

// ─── GET /api/users/profile ───────────────────────────────────────────────────

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('badges');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/users/profile ───────────────────────────────────────────────────

const updateProfile = async (req, res, next) => {
  try {
    const { bio, skills, interests, learningGoals, availability, role } = req.body;

    // Validate skills
    if (skills !== undefined) {
      if (!Array.isArray(skills)) {
        return res.status(400).json({ success: false, message: '`skills` must be an array' });
      }
      for (const skill of skills) {
        if (!skill.name || typeof skill.name !== 'string') {
          return res.status(400).json({ success: false, message: 'Each skill must have a `name` string' });
        }
        if (skill.level && !VALID_LEVELS.includes(skill.level)) {
          return res.status(400).json({
            success: false,
            message: `Skill level must be one of: ${VALID_LEVELS.join(', ')}`,
          });
        }
      }
    }

    // Validate availability
    if (availability !== undefined) {
      if (!Array.isArray(availability)) {
        return res.status(400).json({ success: false, message: '`availability` must be an array' });
      }
      for (const slot of availability) {
        if (!slot.day || !VALID_DAYS.includes(slot.day)) {
          return res.status(400).json({
            success: false,
            message: `Each availability slot must have a valid \`day\` (${VALID_DAYS.join(', ')})`,
          });
        }
        if (!slot.timeSlot || typeof slot.timeSlot !== 'string') {
          return res.status(400).json({ success: false, message: 'Each availability slot must have a `timeSlot` string' });
        }
      }
    }

    // Validate role
    if (role !== undefined && !['student', 'mentor'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be either "student" or "mentor"' });
    }

    // Build update payload — only include provided fields
    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (skills !== undefined) updates.skills = skills;
    if (interests !== undefined) updates.interests = interests;
    if (learningGoals !== undefined) updates.learningGoals = learningGoals;
    if (availability !== undefined) updates.availability = availability;
    if (role !== undefined) updates.role = role;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('badges');

    return res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/users/:id ───────────────────────────────────────────────────────

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resumeUrl')
      .populate('badges');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, getUserById };
