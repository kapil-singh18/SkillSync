const Assessment = require('../models/Assessment');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const User = require('../models/User');
const { generateAssessment } = require('../services/assessmentService');

// ─── Level Progression Helper ─────────────────────────────────────────────────
const LEVEL_RANK = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

// ─── POST /api/assessments/generate ───────────────────────────────────────────
const generateOrGetAssessment = async (req, res, next) => {
  try {
    const { skillName, difficulty } = req.body;

    if (!skillName || !skillName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required to generate an assessment',
      });
    }

    const assessment = await generateAssessment(skillName, difficulty);

    // Sanitize: do NOT send correctOptionIndex to client before submission!
    const sanitizedQuestions = assessment.questions.map((q, idx) => ({
      _id: q._id,
      questionIndex: idx,
      questionText: q.questionText,
      options: q.options,
    }));

    return res.status(200).json({
      success: true,
      assessment: {
        _id: assessment._id,
        skillName: assessment.skillName,
        difficulty: assessment.difficulty,
        totalQuestions: sanitizedQuestions.length,
        questions: sanitizedQuestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/assessments/:id/submit ─────────────────────────────────────────
const submitAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answers } = req.body; // Array of { questionIndex, selectedOptionIndex }
    const userId = req.user._id;

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers array is required',
      });
    }

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found',
      });
    }

    let correctCount = 0;
    const totalQuestions = assessment.questions.length;

    // Calculate score
    answers.forEach((ans) => {
      const q = assessment.questions[ans.questionIndex];
      if (q && q.correctOptionIndex === ans.selectedOptionIndex) {
        correctCount += 1;
      }
    });

    const percentage = totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

    const passed = percentage >= 60;
    let pointsEarned = 0;

    if (passed) {
      pointsEarned = 10;
    }

    // Update user points & skill level if passed with high score (>=80%)
    const user = await User.findById(userId);
    let skillLevelUpdated = false;
    let newLevel = null;

    if (user) {
      if (pointsEarned > 0) {
        user.points = (user.points || 0) + pointsEarned;
      }

      if (percentage >= 80) {
        const normalizedSkill = assessment.skillName.toLowerCase();
        const existingSkillIndex = user.skills.findIndex(
          (s) => s.name.toLowerCase() === normalizedSkill
        );

        const targetRank = LEVEL_RANK[assessment.difficulty] || 1;

        if (existingSkillIndex === -1) {
          user.skills.push({
            name: assessment.skillName,
            level: assessment.difficulty,
          });
          skillLevelUpdated = true;
          newLevel = assessment.difficulty;
        } else {
          const currentRank =
            LEVEL_RANK[user.skills[existingSkillIndex].level] || 1;
          if (targetRank > currentRank) {
            user.skills[existingSkillIndex].level = assessment.difficulty;
            skillLevelUpdated = true;
            newLevel = assessment.difficulty;
          }
        }
      }

      await user.save();
    }

    // Record attempt in database
    const attempt = await AssessmentAttempt.create({
      user: userId,
      assessment: assessment._id,
      score: correctCount,
      totalQuestions,
      percentage,
      passed,
      pointsEarned,
      answers,
      completedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      result: {
        score: correctCount,
        totalQuestions,
        percentage,
        passed,
        pointsEarned,
        skillLevelUpdated,
        newLevel,
        attemptId: attempt._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/assessments/history ─────────────────────────────────────────────
const getHistory = async (req, res, next) => {
  try {
    const attempts = await AssessmentAttempt.find({ user: req.user._id })
      .populate('assessment', 'skillName difficulty')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = attempts.map((att) => ({
      _id: att._id,
      skillName: att.assessment?.skillName || 'General Skill',
      difficulty: att.assessment?.difficulty || 'beginner',
      score: att.score,
      totalQuestions: att.totalQuestions,
      percentage: att.percentage,
      passed: att.passed,
      pointsEarned: att.pointsEarned,
      completedAt: att.completedAt || att.createdAt,
    }));

    return res.status(200).json({
      success: true,
      history: formatted,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateOrGetAssessment,
  submitAssessment,
  getHistory,
};
