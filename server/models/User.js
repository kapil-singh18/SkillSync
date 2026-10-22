const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Sub-schemas ────────────────────────────────────────────────────────────────
const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      required: true,
    },
    slot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
      required: true,
    },
  },
  { _id: false }
);

const linksSchema = new mongoose.Schema(
  {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    portfolio: { type: String, default: '' },
  },
  { _id: false }
);

const mentorProfileSchema = new mongoose.Schema(
  {
    expertise: {
      type: [{ type: String, maxlength: 40 }],
      default: [],
      validate: {
        validator: (v) => v.length <= 10,
        message: 'Expertise can have at most 10 items',
      },
    },
    yearsOfExperience: { type: Number, min: 0, max: 50, default: 0 },
    mentoringStatement: { type: String, maxlength: 500, default: '' },
    acceptingMentees: { type: Boolean, default: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // ── Auth fields (Module 2 — do NOT modify) ─────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name must be at most 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
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
      enum: ['student', 'mentor', 'admin'],
      default: 'student',
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },

    // ── Profile fields (Module 3) ──────────────────────────────────────────────
    headline: { type: String, maxlength: 100, trim: true, default: '' },
    bio: { type: String, maxlength: 500, trim: true, default: '' },
    college: { type: String, maxlength: 120, trim: true, default: '' },
    course: { type: String, maxlength: 120, trim: true, default: '' },
    yearOfStudy: { type: String, maxlength: 30, trim: true, default: '' },
    location: { type: String, maxlength: 80, trim: true, default: '' },
    timezone: { type: String, default: '' },

    skills: {
      type: [skillSchema],
      default: [],
      validate: {
        validator: (v) => v.length <= 20,
        message: 'Skills can have at most 20 items',
      },
    },
    interests: {
      type: [{ type: String, maxlength: 40 }],
      default: [],
      validate: {
        validator: (v) => v.length <= 15,
        message: 'Interests can have at most 15 items',
      },
    },
    learningGoals: {
      type: [{ type: String, maxlength: 100 }],
      default: [],
      validate: {
        validator: (v) => v.length <= 10,
        message: 'Learning goals can have at most 10 items',
      },
    },
    availability: {
      type: [availabilitySchema],
      default: [],
    },
    links: { type: linksSchema, default: () => ({}) },

    avatarUrl: { type: String, default: '' },
    avatarPublicId: { type: String, default: '' },

    mentorProfile: { type: mentorProfileSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// ── Pre-save: hash password only when modified ────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance: compare password ────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ── Instance: safe object for auth responses (includes profile fields) ─────────
userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isEmailVerified: this.isEmailVerified,
    isActive: this.isActive,
    lastLoginAt: this.lastLoginAt,
    // profile
    headline: this.headline,
    bio: this.bio,
    college: this.college,
    course: this.course,
    yearOfStudy: this.yearOfStudy,
    location: this.location,
    timezone: this.timezone,
    skills: this.skills,
    interests: this.interests,
    learningGoals: this.learningGoals,
    availability: this.availability,
    links: this.links,
    avatarUrl: this.avatarUrl,
    mentorProfile: this.role === 'mentor' ? this.mentorProfile : undefined,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// ── Instance: public profile (no private fields) ───────────────────────────────
userSchema.methods.toPublicObject = function () {
  return {
    _id: this._id,
    name: this.name,
    role: this.role,
    headline: this.headline,
    bio: this.bio,
    college: this.college,
    course: this.course,
    yearOfStudy: this.yearOfStudy,
    location: this.location,
    skills: this.skills,
    interests: this.interests,
    learningGoals: this.learningGoals,
    availability: this.availability,
    links: this.links,
    avatarUrl: this.avatarUrl,
    mentorProfile: this.role === 'mentor' ? this.mentorProfile : undefined,
    createdAt: this.createdAt,
  };
};

// ── Instance: profile completeness (0-100) ────────────────────────────────────
/*
 * Student weights (total 100):
 *   avatar             : 15
 *   headline           : 10
 *   bio                : 10
 *   college or course  : 10
 *   skills >= 3        : 15
 *   interests >= 2     : 10
 *   learningGoals >= 1 : 10
 *   availability >= 3  : 10
 *   any link           : 10
 *
 * Mentor additionally requires (weights re-balanced to 100):
 *   expertise >= 1     : 10
 *   mentoringStatement : 10
 *   (college/course and links drop to 5 each, skills to 10, interests to 5)
 */
userSchema.methods.getProfileCompleteness = function () {
  const isMentor = this.role === 'mentor';

  if (!isMentor) {
    let score = 0;
    if (this.avatarUrl) score += 15;
    if (this.headline) score += 10;
    if (this.bio) score += 10;
    if (this.college || this.course) score += 10;
    if ((this.skills || []).length >= 3) score += 15;
    if ((this.interests || []).length >= 2) score += 10;
    if ((this.learningGoals || []).length >= 1) score += 10;
    if ((this.availability || []).length >= 3) score += 10;
    const l = this.links || {};
    if (l.github || l.linkedin || l.portfolio) score += 10;
    return score; // max 100
  }

  // Mentor weights
  let score = 0;
  if (this.avatarUrl) score += 15;
  if (this.headline) score += 10;
  if (this.bio) score += 10;
  if (this.college || this.course) score += 5;
  if ((this.skills || []).length >= 3) score += 10;
  if ((this.interests || []).length >= 2) score += 5;
  if ((this.learningGoals || []).length >= 1) score += 10;
  if ((this.availability || []).length >= 3) score += 10;
  const l = this.links || {};
  if (l.github || l.linkedin || l.portfolio) score += 5;
  const mp = this.mentorProfile || {};
  if ((mp.expertise || []).length >= 1) score += 10;
  if (mp.mentoringStatement) score += 10;
  return score; // max 100
};

module.exports = mongoose.model('User', userSchema);
