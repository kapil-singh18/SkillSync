const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getProjects,
  createProject,
  getMyProjects,
  getProjectById,
  joinProject,
} = require('../controllers/projectController');

router.use(protect);

// /mine must come before /:id to avoid param conflict
router.get('/mine', getMyProjects);
router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProjectById);
router.post('/:id/join', joinProject);

module.exports = router;
