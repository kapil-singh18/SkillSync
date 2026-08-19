const express = require('express');
const router = express.Router();

const { getProfile, updateProfile, getUserById } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// All user routes require authentication
router.use(protect);

// GET  /api/users/profile
router.get('/profile', getProfile);

// PUT  /api/users/profile
router.put('/profile', updateProfile);

// GET  /api/users/:id  (must be after /profile to avoid conflict)
router.get('/:id', getUserById);

module.exports = router;
