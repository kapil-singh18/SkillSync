const express = require('express');
const router = express.Router();

const { discover, connect, dismiss, getConnections } = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// GET  /api/matches/discover
router.get('/discover', discover);

// GET  /api/matches/connections
router.get('/connections', getConnections);

// POST /api/matches/:userId/connect
router.post('/:userId/connect', connect);

// POST /api/matches/:userId/dismiss
router.post('/:userId/dismiss', dismiss);

module.exports = router;
