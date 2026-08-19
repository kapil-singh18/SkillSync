const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: [
        (val) => val.length === 4,
        'Question must have exactly 4 options',
      ],
    },
    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
  },
  { _id: true }
);

const assessmentSchema = new mongoose.Schema(
  {
    skillName: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
      default: 'beginner',
      index: true,
    },
    questions: [questionSchema],
  },
  {
    timestamps: true,
  }
);

assessmentSchema.index({ skillName: 1, difficulty: 1 }, { unique: true });

const Assessment = mongoose.model('Assessment', assessmentSchema);
module.exports = Assessment;
