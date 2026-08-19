const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getFeed,
  createPost,
  toggleUpvote,
  deletePost,
  getComments,
  addComment,
} = require('../controllers/postController');

router.get('/', protect, getFeed);
router.post('/', protect, createPost);
router.put('/:id/upvote', protect, toggleUpvote);
router.delete('/:id', protect, deletePost);
router.get('/:id/comments', protect, getComments);
router.post('/:id/comments', protect, addComment);

module.exports = router;
