/**
 * routes/matchRoutes.js
 * Mounted at /api/matches
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { param } = require('express-validator');
const { protect, requireVerified } = require('../middleware/authMiddleware');
const { validationErrors } = require('./validationHelpers');
const matchController = require('../controllers/matchController');

const router = express.Router();

// Rate limit: 60 discover requests per 15 minutes per IP
const discoverLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyGenerator: (req) => String(req.user?._id || req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many discover requests. Please slow down.' },
});

router.use(protect, requireVerified);

// GET /api/matches/discover?type=peer|mentor&skill=&page=&limit=
router.get('/discover', discoverLimiter, matchController.discover);

// POST /api/matches/:userId/dismiss
router.post(
  '/:userId/dismiss',
  [param('userId').isMongoId().withMessage('Invalid user ID'), validationErrors],
  matchController.dismiss
);

// DELETE /api/matches/dismissed — clear all my dismissals
router.delete('/dismissed', matchController.clearDismissed);

module.exports = router;

