const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const {
  register,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ── Stricter rate limiter for sensitive auth endpoints ─────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts from this IP. Please try again after 15 minutes.',
  },
});

// ── Validation rules ───────────────────────────────────────────────────────────
const passwordRules = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/(?=.*[a-zA-Z])(?=.*[0-9])/)
  .withMessage('Password must contain at least one letter and one number');

const emailRule = body('email')
  .isEmail()
  .withMessage('Please provide a valid email address')
  .normalizeEmail();

const registerRules = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be between 2 and 60 characters'),
  emailRule,
  passwordRules,
];

const loginRules = [
  emailRule,
  body('password').notEmpty().withMessage('Password is required'),
];

const tokenBodyRule = body('token').notEmpty().withMessage('Token is required');

const newPasswordRules = [
  tokenBodyRule,
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/(?=.*[a-zA-Z])(?=.*[0-9])/)
    .withMessage('Password must contain at least one letter and one number'),
];

// ── Routes ─────────────────────────────────────────────────────────────────────
router.post('/register',               authLimiter, registerRules,   register);
router.post('/verify-email',                        [tokenBodyRule],  verifyEmail);
router.post('/resend-verification',    authLimiter, [emailRule],      resendVerification);
router.post('/login',                  authLimiter, loginRules,       login);
router.post('/forgot-password',        authLimiter, [emailRule],      forgotPassword);
router.post('/reset-password',                      newPasswordRules, resetPassword);
router.get('/me',                      protect,                       getMe);
router.post('/change-password',        protect,     [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/(?=.*[a-zA-Z])(?=.*[0-9])/)
    .withMessage('Password must contain at least one letter and one number'),
], changePassword);

module.exports = router;
