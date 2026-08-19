const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// ─── User Schema ──────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'mentor'],
      default: 'student',
    },
    bio: {
      type: String,
      trim: true,
    },
    skills: [skillSchema],
    interests: [String],
    learningGoals: [String],
    availability: [availabilitySchema],
    points: {
      type: Number,
      default: 0,
    },
    badges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Badge',
      },
    ],
    resumeUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Pre-save Hook: Hash password if modified ─────────────────────────────────

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance Method: Compare password ───────────────────────────────────────

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
