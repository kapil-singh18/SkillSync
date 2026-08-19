const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { analyzeResume } = require('../controllers/resumeController');

router.post('/analyze', protect, upload.single('resume'), analyzeResume);

module.exports = router;
