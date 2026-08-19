const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getTasksByProject,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { createTaskValidator, updateTaskValidator } = require('../middleware/validators');

router.use(protect);

router.get('/project/:projectId', getTasksByProject);
router.post('/', createTaskValidator, createTask);
router.put('/:id', updateTaskValidator, updateTask);
router.delete('/:id', deleteTask);

module.exports = router;

