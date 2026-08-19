const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getLeaderboard,
  getAllBadges,
  getMyStats,
} = require('../controllers/gamificationController');

router.get('/leaderboard', protect, getLeaderboard);
router.get('/badges', protect, getAllBadges);
router.get('/me', protect, getMyStats);

module.exports = router;
