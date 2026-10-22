const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

/**
 * protect — Verifies the Bearer JWT, loads req.user.
 * Rejects with 401 if token is missing, invalid, expired, or user not found / inactive.
 */
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token. Please log in again.' });
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return res.status(401).json({ success: false, message: 'User no longer exists.' });
  }
  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Your account has been deactivated.' });
  }

  req.user = user;
  next();
});

/**
 * requireVerified — Must come after protect.
 * Rejects with 403 if the user's email is not verified.
 */
const requireVerified = (req, res, next) => {
  if (!req.user?.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address to access this resource.',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }
  next();
};

/**
 * authorize(...roles) — Must come after protect.
 * Rejects with 403 if req.user.role is not in the allowed list.
 *
 * @param {...string} roles
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(' or ')}.`,
    });
  }
  next();
};

module.exports = { protect, requireVerified, authorize };
