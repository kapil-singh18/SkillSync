const mongoose = require('mongoose');
const { body, param, validationResult } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const { uploadAvatar, deleteImage } = require('../services/uploadService');
const {
  normalizeStringArray,
  normalizeSkills,
  normalizeAvailability,
} = require('../utils/profileSanitizer');

const HTTPS_URL = /^https:\/\/.+/;

// Whitelisted profile fields — never includes role, email, password, isActive, avatar, or token fields
const PROFILE_WHITELIST = [
  'name', 'headline', 'bio', 'college', 'course', 'yearOfStudy',
  'location', 'timezone', 'skills', 'interests', 'learningGoals',
  'availability', 'links',
];
const MENTOR_WHITELIST = ['expertise', 'yearsOfExperience', 'mentoringStatement', 'acceptingMentees'];

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  return null;
};

// ── GET /api/users/profile ─────────────────────────────────────────────────────
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({
    success: true,
    user: user.toSafeObject(),
    profileCompleteness: user.getProfileCompleteness(),
  });
});

// ── PUT /api/users/profile ─────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  if (handleValidation(req, res)) return;

  const user = await User.findById(req.user._id);

  // Only pick whitelisted fields
  for (const field of PROFILE_WHITELIST) {
    if (req.body[field] !== undefined) {
      if (field === 'skills') {
        user.skills = normalizeSkills(req.body.skills, 20);
      } else if (field === 'interests') {
        user.interests = normalizeStringArray(req.body.interests, 15);
      } else if (field === 'learningGoals') {
        user.learningGoals = normalizeStringArray(req.body.learningGoals, 10);
      } else if (field === 'availability') {
        user.availability = normalizeAvailability(req.body.availability);
      } else {
        user[field] = req.body[field];
      }
    }
  }

  // Mentor profile — only if role is mentor
  if (user.role === 'mentor' && req.body.mentorProfile) {
    const mp = req.body.mentorProfile;
    if (!user.mentorProfile) user.mentorProfile = {};
    for (const field of MENTOR_WHITELIST) {
      if (mp[field] !== undefined) {
        if (field === 'expertise') {
          user.mentorProfile.expertise = normalizeStringArray(mp.expertise, 10);
        } else {
          user.mentorProfile[field] = mp[field];
        }
      }
    }
  }

  await user.save({ validateBeforeSave: true });

  res.status(200).json({
    success: true,
    user: user.toSafeObject(),
    profileCompleteness: user.getProfileCompleteness(),
  });
});

// ── PUT /api/users/role ────────────────────────────────────────────────────────
const changeRole = asyncHandler(async (req, res) => {
  if (handleValidation(req, res)) return;

  const { role } = req.body;

  // Admins cannot change their role; nobody can set "admin" through this route
  if (req.user.role === 'admin') {
    return res.status(403).json({ success: false, message: 'Admin role cannot be changed.' });
  }

  const user = await User.findById(req.user._id);
  user.role = role;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, user: user.toSafeObject() });
});

// ── POST /api/users/avatar ─────────────────────────────────────────────────────
const uploadAvatarHandler = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  const user = await User.findById(req.user._id);

  // Delete previous avatar if exists
  if (user.avatarPublicId) {
    await deleteImage(user.avatarPublicId);
  }

  const { url, publicId } = await uploadAvatar(req.file.buffer, user._id.toString());

  user.avatarUrl = url;
  user.avatarPublicId = publicId;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    user: user.toSafeObject(),
    profileCompleteness: user.getProfileCompleteness(),
  });
});

// ── DELETE /api/users/avatar ───────────────────────────────────────────────────
const removeAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.avatarPublicId) {
    await deleteImage(user.avatarPublicId);
  }

  user.avatarUrl = '';
  user.avatarPublicId = '';
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    user: user.toSafeObject(),
    profileCompleteness: user.getProfileCompleteness(),
  });
});

// ── GET /api/users/:id ─────────────────────────────────────────────────────────
const getPublicProfile = asyncHandler(async (req, res) => {
  if (handleValidation(req, res)) return;

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID.' });
  }

  const user = await User.findById(id);

  if (!user || !user.isActive) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  res.status(200).json({ success: true, user: user.toPublicObject() });
});

// ── Validation rule sets ───────────────────────────────────────────────────────
const httpsUrlOrEmpty = (field) =>
  body(`links.${field}`)
    .optional()
    .custom((val) => {
      if (!val || val === '') return true;
      if (!HTTPS_URL.test(val)) throw new Error(`${field} must be a valid https URL`);
      return true;
    });

const updateProfileRules = [
  body('name').optional().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),
  body('headline').optional().trim().isLength({ max: 100 }).withMessage('Headline must be at most 100 characters'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio must be at most 500 characters'),
  body('college').optional().trim().isLength({ max: 120 }).withMessage('College must be at most 120 characters'),
  body('course').optional().trim().isLength({ max: 120 }).withMessage('Course must be at most 120 characters'),
  body('yearOfStudy').optional().trim().isLength({ max: 30 }).withMessage('Year of study must be at most 30 characters'),
  body('location').optional().trim().isLength({ max: 80 }).withMessage('Location must be at most 80 characters'),
  body('timezone').optional().isString(),
  body('skills').optional().isArray({ max: 20 }).withMessage('Skills must be an array of at most 20'),
  body('skills.*.name').optional().trim().isLength({ max: 40 }).withMessage('Skill name must be at most 40 chars'),
  body('skills.*.level').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid skill level'),
  body('interests').optional().isArray({ max: 15 }).withMessage('Interests must be an array of at most 15'),
  body('learningGoals').optional().isArray({ max: 10 }).withMessage('Goals must be an array of at most 10'),
  body('availability').optional().isArray(),
  body('availability.*.day').optional().isIn(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
  body('availability.*.slot').optional().isIn(['morning', 'afternoon', 'evening', 'night']),
  httpsUrlOrEmpty('github'),
  httpsUrlOrEmpty('linkedin'),
  httpsUrlOrEmpty('portfolio'),
  body('mentorProfile.yearsOfExperience').optional().isFloat({ min: 0, max: 50 }),
  body('mentorProfile.mentoringStatement').optional().trim().isLength({ max: 500 }),
  body('mentorProfile.acceptingMentees').optional().isBoolean(),
  body('mentorProfile.expertise').optional().isArray({ max: 10 }),
];

const changeRoleRules = [
  body('role')
    .isIn(['student', 'mentor'])
    .withMessage('Role must be "student" or "mentor"'),
];

const publicProfileRules = [
  param('id').isMongoId().withMessage('Invalid user ID'),
];

module.exports = {
  getProfile,
  updateProfile,
  changeRole,
  uploadAvatarHandler,
  removeAvatar,
  getPublicProfile,
  updateProfileRules,
  changeRoleRules,
  publicProfileRules,
};
