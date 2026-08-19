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
const { createPostValidator, createCommentValidator } = require('../middleware/validators');

router.get('/', protect, getFeed);
router.post('/', protect, createPostValidator, createPost);
router.put('/:id/upvote', protect, toggleUpvote);
router.delete('/:id', protect, deletePost);
router.get('/:id/comments', protect, getComments);
router.post('/:id/comments', protect, createCommentValidator, addComment);

module.exports = router;

