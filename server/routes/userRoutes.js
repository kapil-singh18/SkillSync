const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect, requireVerified } = require('../middleware/authMiddleware');
const { uploadAvatarMiddleware } = require('../middleware/uploadMiddleware');
const {
  getProfile,
  updateProfile,
  changeRole,
  uploadAvatarHandler,
  removeAvatar,
  getPublicProfile,
  updateProfileRules,
  changeRoleRules,
  publicProfileRules,
} = require('../controllers/userController');

const router = express.Router();

// Moderate rate limiter for avatar uploads
const avatarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many avatar uploads. Please wait 15 minutes.' },
});

// All user routes require authentication
router.use(protect);

// ── Own profile ────────────────────────────────────────────────────────────────
router.get('/profile',                       getProfile);
router.put('/profile',    requireVerified,   updateProfileRules, updateProfile);
router.put('/role',       requireVerified,   changeRoleRules,    changeRole);

// ── Avatar ─────────────────────────────────────────────────────────────────────
router.post('/avatar',    requireVerified,   avatarLimiter, uploadAvatarMiddleware, uploadAvatarHandler);
router.delete('/avatar',  requireVerified,   removeAvatar);

// ── Public profile — must come after named routes to avoid conflicts ────────────
router.get('/:id',        publicProfileRules, getPublicProfile);

module.exports = router;
