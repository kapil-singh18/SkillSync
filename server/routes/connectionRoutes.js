/**
 * routes/connectionRoutes.js
 * Mounted at /api/connections
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, param } = require('express-validator');
const { protect, requireVerified } = require('../middleware/authMiddleware');
const { validationErrors } = require('./validationHelpers');
const connectionController = require('../controllers/connectionController');

const router = express.Router();

// Rate limit for sending requests: 30 per hour per user
const requestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => String(req.user?._id || req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many connection requests. Please wait before sending more.' },
});

// All routes require auth + verified email
router.use(protect, requireVerified);

// ── Send request ───────────────────────────────────────────────────────────────
router.post(
  '/',
  requestLimiter,
  [
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('type').isIn(['peer', 'mentorship']).withMessage('type must be "peer" or "mentorship"'),
    body('message')
      .optional()
      .isString()
      .isLength({ max: 300 })
      .withMessage('Message must be at most 300 characters'),
    validationErrors,
  ],
  connectionController.sendRequest
);

// ── List connections ───────────────────────────────────────────────────────────
router.get('/', connectionController.getConnections);

// ── Incoming / outgoing pending requests ──────────────────────────────────────
router.get('/requests/incoming', connectionController.getIncomingRequests);
router.get('/requests/outgoing', connectionController.getOutgoingRequests);

// ── Relationship status with a user ───────────────────────────────────────────
router.get(
  '/status/:userId',
  [param('userId').isMongoId().withMessage('Invalid user ID'), validationErrors],
  connectionController.getStatus
);

// ── Accept / Decline / Cancel ─────────────────────────────────────────────────
router.put(
  '/:id/accept',
  [param('id').isMongoId().withMessage('Invalid connection ID'), validationErrors],
  connectionController.acceptRequest
);

router.put(
  '/:id/decline',
  [param('id').isMongoId().withMessage('Invalid connection ID'), validationErrors],
  connectionController.declineRequest
);

router.put(
  '/:id/cancel',
  [param('id').isMongoId().withMessage('Invalid connection ID'), validationErrors],
  connectionController.cancelRequest
);

// ── Remove accepted connection ─────────────────────────────────────────────────
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid connection ID'), validationErrors],
  connectionController.removeConnection
);

module.exports = router;

