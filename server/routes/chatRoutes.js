const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getConversations,
  getDirectMessages,
  getRooms,
  createRoom,
  joinRoom,
  getRoomMessages,
} = require('../controllers/chatController');
const { createRoomValidator } = require('../middleware/validators');

router.use(protect);

router.get('/conversations', getConversations);
router.get('/messages/:userId', getDirectMessages);
router.get('/rooms', getRooms);
router.post('/rooms', createRoomValidator, createRoom);
router.post('/rooms/:roomId/join', joinRoom);
router.get('/rooms/:roomId/messages', getRoomMessages);

module.exports = router;

