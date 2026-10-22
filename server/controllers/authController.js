const { validationResult } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const { generateJWT, generateRandomToken, hashToken } = require('../utils/tokens');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

// Helper: send 422 with formatted validation errors
const validateRequest = (req, res) => {
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

// ── POST /register ─────────────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const invalid = validateRequest(req, res);
  if (invalid) return;

  const { name, email, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  const { raw, hashed } = generateRandomToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = await User.create({
    name,
    email,
    password,
    role: 'student', // role never accepted from client
    emailVerificationToken: hashed,
    emailVerificationExpires: expires,
  });

  await sendVerificationEmail(user, raw);

  res.status(201).json({
    success: true,
    message: 'Account created. Please check your email to verify your address before logging in.',
  });
});

// ── POST /verify-email ─────────────────────────────────────────────────────────
const verifyEmail = asyncHandler(async (req, res) => {
  const invalid = validateRequest(req, res);
  if (invalid) return;

  const { token } = req.body;
  const hashed = hashToken(token);

  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: Date.now() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Verification link is invalid or has expired. Please request a new one.',
    });
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Email verified successfully. You can now log in.' });
});

// ── POST /resend-verification ──────────────────────────────────────────────────
const resendVerification = asyncHandler(async (req, res) => {
  const invalid = validateRequest(req, res);
  if (invalid) return;

  const { email } = req.body;

  // Always return the same message — prevents account enumeration
  const genericResponse = {
    success: true,
    message: 'If that email is registered and unverified, a new verification link has been sent.',
  };

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    '+emailVerificationToken +emailVerificationExpires'
  );

  if (!user || user.isEmailVerified) {
    return res.status(200).json(genericResponse);
  }

  const { raw, hashed } = generateRandomToken();
  user.emailVerificationToken = hashed;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  await sendVerificationEmail(user, raw);

  res.status(200).json(genericResponse);
});

// ── POST /login ────────────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const invalid = validateRequest(req, res);
  if (invalid) return;

  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  // Generic error — prevents user enumeration
  const authError = () =>
    res.status(401).json({ success: false, message: 'Invalid email or password.' });

  if (!user) return authError();

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return authError();

  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Your account has been deactivated.' });
  }

  if (!user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address before logging in.',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateJWT(user._id);

  res.status(200).json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
});

// ── POST /forgot-password ──────────────────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const invalid = validateRequest(req, res);
  if (invalid) return;

  const { email } = req.body;

  const genericResponse = {
    success: true,
    message: 'If that email is registered, a password reset link has been sent.',
  };

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    '+passwordResetToken +passwordResetExpires'
  );

  if (!user) return res.status(200).json(genericResponse);

  const { raw, hashed } = generateRandomToken();
  user.passwordResetToken = hashed;
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await user.save({ validateBeforeSave: false });

  await sendPasswordResetEmail(user, raw);

  res.status(200).json(genericResponse);
});

// ── POST /reset-password ───────────────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const invalid = validateRequest(req, res);
  if (invalid) return;

  const { token, password } = req.body;
  const hashed = hashToken(token);

  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Reset link is invalid or has expired. Please request a new one.',
    });
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
});

// ── GET /me ────────────────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user.toSafeObject() });
});

// ── POST /change-password ──────────────────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const invalid = validateRequest(req, res);
  if (invalid) return;

  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: 'Password changed successfully.' });
});

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
};
