const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  generateOrGetAssessment,
  submitAssessment,
  getHistory,
} = require('../controllers/assessmentController');
const { generateAssessmentValidator, submitAssessmentValidator } = require('../middleware/validators');

router.use(protect);

router.post('/generate', generateAssessmentValidator, generateOrGetAssessment);
router.post('/:id/submit', submitAssessmentValidator, submitAssessment);
router.get('/history', getHistory);

module.exports = router;

