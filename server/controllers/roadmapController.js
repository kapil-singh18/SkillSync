const Roadmap = require('../models/Roadmap');
const { generateRoadmap } = require('../services/roadmapService');

/**
 * Calculates progress percentage for a roadmap.
 * @param {Array} steps
 * @returns {number} 0-100
 */
const calculateProgress = (steps = []) => {
  if (!steps || steps.length === 0) return 0;
  const completed = steps.filter((s) => s.completed).length;
  return Math.round((completed / steps.length) * 100);
};

// ─── POST /api/roadmaps ───────────────────────────────────────────────────────
const createRoadmap = async (req, res, next) => {
  try {
    const { topic, level } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required to generate a roadmap',
      });
    }

    const validLevel = ['beginner', 'intermediate', 'advanced'].includes(level)
      ? level
      : 'beginner';

    const steps = await generateRoadmap(topic.trim(), validLevel);

    const roadmap = await Roadmap.create({
      user: req.user._id,
      topic: topic.trim(),
      level: validLevel,
      steps,
      generatedAt: new Date(),
    });

    const progress = calculateProgress(roadmap.steps);

    return res.status(201).json({
      success: true,
      roadmap: {
        ...roadmap.toObject(),
        progressPercent: progress,
        totalSteps: roadmap.steps.length,
        completedSteps: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/roadmaps ────────────────────────────────────────────────────────
const getRoadmaps = async (req, res, next) => {
  try {
    const roadmaps = await Roadmap.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = roadmaps.map((r) => {
      const totalSteps = r.steps?.length || 0;
      const completedSteps = (r.steps || []).filter((s) => s.completed).length;
      const progressPercent = totalSteps > 0
        ? Math.round((completedSteps / totalSteps) * 100)
        : 0;

      return {
        _id: r._id,
        topic: r.topic,
        level: r.level,
        totalSteps,
        completedSteps,
        progressPercent,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      roadmaps: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/roadmaps/:id ────────────────────────────────────────────────────
const getRoadmapById = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found',
      });
    }

    const totalSteps = roadmap.steps.length;
    const completedSteps = roadmap.steps.filter((s) => s.completed).length;
    const progressPercent = calculateProgress(roadmap.steps);

    return res.status(200).json({
      success: true,
      roadmap: {
        ...roadmap.toObject(),
        totalSteps,
        completedSteps,
        progressPercent,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/roadmaps/:id/steps/:stepId ───────────────────────────────────────
const toggleStepCompleted = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found',
      });
    }

    const step = roadmap.steps.id(req.params.stepId);
    if (!step) {
      return res.status(404).json({
        success: false,
        message: 'Step not found',
      });
    }

    // Toggle completed status
    step.completed = !step.completed;
    await roadmap.save();

    const totalSteps = roadmap.steps.length;
    const completedSteps = roadmap.steps.filter((s) => s.completed).length;
    const progressPercent = calculateProgress(roadmap.steps);

    return res.status(200).json({
      success: true,
      roadmap: {
        ...roadmap.toObject(),
        totalSteps,
        completedSteps,
        progressPercent,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/roadmaps/:id ─────────────────────────────────────────────────
const deleteRoadmap = async (req, res, next) => {
  try {
    const result = await Roadmap.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Roadmap removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoadmap,
  getRoadmaps,
  getRoadmapById,
  toggleStepCompleted,
  deleteRoadmap,
};
