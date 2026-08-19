const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createRoadmap,
  getRoadmaps,
  getRoadmapById,
  toggleStepCompleted,
  deleteRoadmap,
} = require('../controllers/roadmapController');

router.use(protect);

router.post('/', createRoadmap);
router.get('/', getRoadmaps);
router.get('/:id', getRoadmapById);
router.put('/:id/steps/:stepId', toggleStepCompleted);
router.delete('/:id', deleteRoadmap);

module.exports = router;
