const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  generateOrGetAssessment,
  submitAssessment,
  getHistory,
} = require('../controllers/assessmentController');

router.use(protect);

router.post('/generate', generateOrGetAssessment);
router.post('/:id/submit', submitAssessment);
router.get('/history', getHistory);

module.exports = router;
