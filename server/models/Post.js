const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post must have an author'],
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      maxlength: [2000, 'Post cannot exceed 2000 characters'],
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    commentCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for feed queries: newest first, filterable by tag
postSchema.index({ createdAt: -1 });
postSchema.index({ tags: 1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
