const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { awardPoints, checkAndAwardBadges, POINTS } = require('../services/gamificationService');

// ─── GET /api/posts — paginated feed ────────────────────────────────────────

exports.getFeed = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;
    const sort = req.query.sort === 'popular' ? { upvotes: -1, createdAt: -1 } : { createdAt: -1 };

    const filter = {};
    if (req.query.tag) {
      filter.tags = req.query.tag.toLowerCase();
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('author', 'name email role'),
      Post.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/posts — create post ─────────────────────────────────────────

exports.createPost = async (req, res, next) => {
  try {
    const { content, tags } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Post content is required' });
    }

    const post = await Post.create({
      author: req.user._id,
      content: content.trim(),
      tags: tags || [],
    });

    await post.populate('author', 'name email role');

    // Gamification
    await awardPoints(req.user._id, POINTS.CREATE_POST);
    await checkAndAwardBadges(req.user._id);

    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/posts/:id/upvote — toggle upvote ─────────────────────────────

exports.toggleUpvote = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = req.user._id.toString();
    const idx = post.upvotes.findIndex((id) => id.toString() === userId);

    if (idx > -1) {
      post.upvotes.splice(idx, 1);
    } else {
      post.upvotes.push(req.user._id);
      // Award points to post author when someone upvotes (not self)
      if (post.author.toString() !== userId) {
        await awardPoints(post.author, POINTS.RECEIVE_UPVOTE);
        await checkAndAwardBadges(post.author);
      }
    }

    await post.save();
    await post.populate('author', 'name email role');

    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/posts/:id — delete own post ────────────────────────────────

exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    // Delete associated comments
    await Comment.deleteMany({ post: post._id });
    await Post.findByIdAndDelete(post._id);

    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/posts/:id/comments — list comments ───────────────────────────

exports.getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .sort({ createdAt: -1 })
      .populate('author', 'name email role');

    res.json({ success: true, data: comments });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/posts/:id/comments — add comment ────────────────────────────

exports.addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      content: content.trim(),
    });

    // Increment comment count on post
    post.commentCount = (post.commentCount || 0) + 1;
    await post.save();

    await comment.populate('author', 'name email role');

    // Gamification
    await awardPoints(req.user._id, POINTS.LEAVE_COMMENT);
    await checkAndAwardBadges(req.user._id);

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
};
