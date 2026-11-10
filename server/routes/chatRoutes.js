/**
 * routes/chatRoutes.js
 * Mounted at /api/chat
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, param, query } = require('express-validator');
const { protect, requireVerified } = require('../middleware/authMiddleware');
const { validationErrors } = require('./validationHelpers');
const chatController = require('../controllers/chatController');

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => String(req.user?._id || req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many chat requests.' },
});

router.use(protect, requireVerified);

// ── Conversations ─────────────────────────────────────────────────────────────
router.get('/conversations', chatController.getConversations);

router.get(
  '/conversations/:userId/messages',
  [param('userId').isMongoId().withMessage('Invalid user ID'), validationErrors],
  chatController.getMessages
);

router.post(
  '/conversations/:userId/read',
  [param('userId').isMongoId().withMessage('Invalid user ID'), validationErrors],
  chatController.markRead
);

// ── Rooms ─────────────────────────────────────────────────────────────────────
router.get('/rooms/mine', chatController.getMyRooms);

router.get('/rooms/discover', chatController.discoverRooms);

router.post(
  '/rooms',
  chatLimiter,
  [
    body('name').isString().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 chars'),
    body('description').optional().isString().isLength({ max: 300 }),
    body('visibility').optional().isIn(['public', 'private']),
    body('maxMembers').optional().isInt({ min: 2, max: 50 }),
    validationErrors,
  ],
  chatController.createRoom
);

router.post(
  '/rooms/join-by-code',
  [body('code').isString().trim().notEmpty().withMessage('Invite code required'), validationErrors],
  chatController.joinByCode
);

router.get(
  '/rooms/:id',
  [param('id').isMongoId().withMessage('Invalid room ID'), validationErrors],
  chatController.getRoom
);

router.post(
  '/rooms/:id/join',
  [param('id').isMongoId().withMessage('Invalid room ID'), validationErrors],
  chatController.joinRoom
);

router.post(
  '/rooms/:id/leave',
  [param('id').isMongoId().withMessage('Invalid room ID'), validationErrors],
  chatController.leaveRoom
);

router.put(
  '/rooms/:id',
  [param('id').isMongoId().withMessage('Invalid room ID'), validationErrors],
  chatController.updateRoom
);

router.delete(
  '/rooms/:id/members/:userId',
  [
    param('id').isMongoId().withMessage('Invalid room ID'),
    param('userId').isMongoId().withMessage('Invalid user ID'),
    validationErrors,
  ],
  chatController.removeMember
);

router.delete(
  '/rooms/:id',
  [param('id').isMongoId().withMessage('Invalid room ID'), validationErrors],
  chatController.archiveRoom
);

router.get(
  '/rooms/:id/messages',
  [param('id').isMongoId().withMessage('Invalid room ID'), validationErrors],
  chatController.getRoomMessages
);

// ── Messages ──────────────────────────────────────────────────────────────────
router.delete(
  '/messages/:id',
  [param('id').isMongoId().withMessage('Invalid message ID'), validationErrors],
  chatController.deleteMessage
);

// ── Presence ──────────────────────────────────────────────────────────────────
router.get('/presence', chatController.getPresence);

module.exports = router;

