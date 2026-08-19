const { body, validationResult } = require('express-validator');

/**
 * Middleware that inspects validation results from express-validator.
 * Returns a uniform 400 Bad Request with the first error message and full error array.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: extractedErrors[0].message,
      errors: extractedErrors,
    });
  }
  next();
};

// ─── Auth Validators ─────────────────────────────────────────────────────────

const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 60 })
    .withMessage('Name must be 60 characters or less'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  validate,
];

const loginValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate,
];

// ─── User Profile Validators ──────────────────────────────────────────────────

const updateProfileValidator = [
  body('bio')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio cannot exceed 1000 characters'),
  body('role')
    .optional()
    .isIn(['student', 'mentor'])
    .withMessage('Role must be either "student" or "mentor"'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('availability')
    .optional()
    .isArray()
    .withMessage('Availability must be an array'),
  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),
  body('learningGoals')
    .optional()
    .isArray()
    .withMessage('Learning goals must be an array'),
  validate,
];

// ─── Post & Comment Validators ────────────────────────────────────────────────

const createPostValidator = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Post content is required')
    .isLength({ max: 2000 })
    .withMessage('Post content cannot exceed 2000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  validate,
];

const createCommentValidator = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 1000 })
    .withMessage('Comment content cannot exceed 1000 characters'),
  validate,
];

// ─── Project & Task Validators ────────────────────────────────────────────────

const createProjectValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Project title is required')
    .isLength({ max: 150 })
    .withMessage('Title cannot exceed 150 characters'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('type')
    .isIn(['study_project', 'hackathon_team'])
    .withMessage('Type must be either "study_project" or "hackathon_team"'),
  body('requiredSkills')
    .optional()
    .isArray()
    .withMessage('Required skills must be an array'),
  validate,
];

const createTaskValidator = [
  body('projectId')
    .notEmpty()
    .withMessage('projectId is required')
    .isMongoId()
    .withMessage('Invalid project ID format'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ max: 200 })
    .withMessage('Task title cannot exceed 200 characters'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  validate,
];

const updateTaskValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Task title cannot exceed 200 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done'])
    .withMessage('Status must be "todo", "in_progress", or "done"'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  validate,
];

// ─── Roadmap & Assessment Validators ──────────────────────────────────────────

const createRoadmapValidator = [
  body('topic')
    .trim()
    .notEmpty()
    .withMessage('Topic is required to generate a roadmap')
    .isLength({ max: 100 })
    .withMessage('Topic cannot exceed 100 characters'),
  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Level must be beginner, intermediate, or advanced'),
  validate,
];

const generateAssessmentValidator = [
  body('skillName')
    .trim()
    .notEmpty()
    .withMessage('Skill name is required to generate an assessment')
    .isLength({ max: 100 })
    .withMessage('Skill name cannot exceed 100 characters'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),
  validate,
];

const submitAssessmentValidator = [
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Answers array must contain at least one response'),
  validate,
];

// ─── Chat Validators ──────────────────────────────────────────────────────────

const createRoomValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Room name is required')
    .isLength({ max: 100 })
    .withMessage('Room name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  validate,
];

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  updateProfileValidator,
  createPostValidator,
  createCommentValidator,
  createProjectValidator,
  createTaskValidator,
  updateTaskValidator,
  createRoadmapValidator,
  generateAssessmentValidator,
  submitAssessmentValidator,
  createRoomValidator,
};
