/**
 * utils/seedDevUsers.js
 *
 * Creates 8 verified, active dev users (6 students + 2 mentors) with
 * varied, realistic profiles for testing Module 4 matching and connections.
 *
 * Usage: npm run seed:dev-users
 *
 * Password comes from DEV_SEED_PASSWORD env var — NEVER hardcoded.
 * Refuses to run in production.
 * Idempotent: safe to run multiple times; updates existing users.
 */

require('dotenv').config();

if (process.env.NODE_ENV === 'production') {
  console.error('[seed:dev-users] Refused to run in production.');
  process.exit(1);
}

const mongoose = require('mongoose');
const User = require('../models/User');

const { DEV_SEED_PASSWORD, MONGO_URI } = process.env;

if (!DEV_SEED_PASSWORD) {
  console.error('[seed:dev-users] DEV_SEED_PASSWORD must be set in .env');
  process.exit(1);
}

const DEV_USERS = [
  // ── Students ──────────────────────────────────────────────────────────────
  {
    name: 'Arjun Mehta',
    email: 'arjun.dev@skillsync.test',
    role: 'student',
    headline: 'Full-Stack Dev in Progress',
    bio: 'Third-year CS student passionate about building real products and learning from peers.',
    college: 'IIT Bombay',
    course: 'B.Tech Computer Science',
    yearOfStudy: '3rd Year',
    location: 'Mumbai, India',
    timezone: 'Asia/Kolkata',
    skills: [
      { name: 'React', level: 'intermediate' },
      { name: 'JavaScript', level: 'advanced' },
      { name: 'Node.js', level: 'beginner' },
    ],
    interests: ['Web Development', 'Open Source', 'UI/UX'],
    learningGoals: ['Master TypeScript', 'Learn system design', 'Contribute to OSS'],
    availability: [
      { day: 'Mon', slot: 'evening' },
      { day: 'Wed', slot: 'evening' },
      { day: 'Sat', slot: 'morning' },
      { day: 'Sun', slot: 'afternoon' },
    ],
    links: { github: 'https://github.com/arjundev', linkedin: '', portfolio: '' },
  },
  {
    name: 'Priya Sharma',
    email: 'priya.dev@skillsync.test',
    role: 'student',
    headline: 'ML Enthusiast | Data Nerd',
    bio: 'Love turning messy data into insights. Looking for peers to work on AI side-projects.',
    college: 'IIT Delhi',
    course: 'B.Tech Data Science',
    yearOfStudy: '4th Year',
    location: 'Delhi, India',
    timezone: 'Asia/Kolkata',
    skills: [
      { name: 'Python', level: 'advanced' },
      { name: 'Machine Learning', level: 'intermediate' },
      { name: 'SQL', level: 'intermediate' },
    ],
    interests: ['AI/ML', 'Data Science', 'Open Source'],
    learningGoals: ['Deep learning', 'MLOps', 'Build a recommendation engine'],
    availability: [
      { day: 'Tue', slot: 'evening' },
      { day: 'Thu', slot: 'evening' },
      { day: 'Sat', slot: 'morning' },
    ],
    links: { github: 'https://github.com/priyaml', linkedin: '', portfolio: '' },
  },
  {
    name: 'Liam O\'Brien',
    email: 'liam.dev@skillsync.test',
    role: 'student',
    headline: 'Backend & DevOps Explorer',
    bio: 'Big fan of Rust, Kubernetes, and anything that scales. Looking for a system-design study buddy.',
    college: 'University College Dublin',
    course: 'B.Sc Computer Science',
    yearOfStudy: '4th Year',
    location: 'Dublin, Ireland',
    timezone: 'Europe/Dublin',
    skills: [
      { name: 'Rust', level: 'beginner' },
      { name: 'Docker', level: 'intermediate' },
      { name: 'Node.js', level: 'intermediate' },
      { name: 'PostgreSQL', level: 'beginner' },
    ],
    interests: ['DevOps', 'System Design', 'Cloud Computing'],
    learningGoals: ['Kubernetes', 'Distributed systems', 'Go'],
    availability: [
      { day: 'Mon', slot: 'morning' },
      { day: 'Wed', slot: 'morning' },
      { day: 'Fri', slot: 'afternoon' },
    ],
    links: { github: 'https://github.com/liamob', linkedin: '', portfolio: '' },
  },
  {
    name: 'Zara Ahmed',
    email: 'zara.dev@skillsync.test',
    role: 'student',
    headline: 'Frontend & Design Systems',
    bio: 'I care deeply about design systems and accessible UIs. React is my happy place.',
    college: 'BITS Pilani',
    course: 'B.E. Computer Science',
    yearOfStudy: '3rd Year',
    location: 'Pilani, India',
    timezone: 'Asia/Kolkata',
    skills: [
      { name: 'React', level: 'advanced' },
      { name: 'TypeScript', level: 'intermediate' },
      { name: 'CSS', level: 'advanced' },
      { name: 'Figma', level: 'intermediate' },
    ],
    interests: ['UI/UX', 'Web Development', 'Design Systems'],
    learningGoals: ['Next.js', 'Web Animations', 'Accessibility standards'],
    availability: [
      { day: 'Mon', slot: 'evening' },
      { day: 'Thu', slot: 'evening' },
      { day: 'Sat', slot: 'afternoon' },
      { day: 'Sun', slot: 'morning' },
    ],
    links: { github: '', linkedin: '', portfolio: 'https://zaraahmed.design' },
  },
  {
    name: 'Marcus Johnson',
    email: 'marcus.dev@skillsync.test',
    role: 'student',
    headline: 'Mobile Dev | React Native',
    bio: 'Building cross-platform apps and looking to level up with experienced mentors.',
    college: 'Georgia Tech',
    course: 'B.S. Computer Science',
    yearOfStudy: '3rd Year',
    location: 'Atlanta, USA',
    timezone: 'America/New_York',
    skills: [
      { name: 'React Native', level: 'intermediate' },
      { name: 'JavaScript', level: 'advanced' },
      { name: 'Firebase', level: 'beginner' },
    ],
    interests: ['Mobile Development', 'UI/UX', 'Web Development'],
    learningGoals: ['TypeScript', 'React', 'App performance optimization'],
    availability: [
      { day: 'Tue', slot: 'night' },
      { day: 'Thu', slot: 'night' },
      { day: 'Sat', slot: 'morning' },
    ],
    links: { github: 'https://github.com/marcusj', linkedin: '', portfolio: '' },
  },
  {
    name: 'Fatima Al-Rashid',
    email: 'fatima.dev@skillsync.test',
    role: 'student',
    headline: 'Security + Backend | CS Senior',
    bio: 'Interested in ethical hacking, cryptography, and building secure APIs.',
    college: 'King Abdullah University',
    course: 'B.Sc Cybersecurity',
    yearOfStudy: '4th Year',
    location: 'Riyadh, Saudi Arabia',
    timezone: 'Asia/Riyadh',
    skills: [
      { name: 'Python', level: 'advanced' },
      { name: 'Node.js', level: 'intermediate' },
      { name: 'SQL', level: 'intermediate' },
      { name: 'Linux', level: 'intermediate' },
    ],
    interests: ['Cybersecurity', 'AI/ML', 'Open Source'],
    learningGoals: ['Penetration testing', 'Machine Learning', 'Rust'],
    availability: [
      { day: 'Mon', slot: 'morning' },
      { day: 'Wed', slot: 'afternoon' },
      { day: 'Sun', slot: 'morning' },
    ],
    links: { github: 'https://github.com/fatimacyber', linkedin: '', portfolio: '' },
  },
  // ── Mentors ───────────────────────────────────────────────────────────────
  {
    name: 'Dr. Neha Kapoor',
    email: 'neha.mentor@skillsync.test',
    role: 'mentor',
    headline: 'Senior SWE @ Google | 8 yrs | Full-Stack & System Design',
    bio: 'Passionate about helping students land their dream roles. Specialise in full-stack architecture and interview prep.',
    college: 'IIT Madras',
    course: 'M.Tech Computer Science',
    yearOfStudy: 'Alumni',
    location: 'Bangalore, India',
    timezone: 'Asia/Kolkata',
    skills: [
      { name: 'React', level: 'advanced' },
      { name: 'TypeScript', level: 'advanced' },
      { name: 'Node.js', level: 'advanced' },
      { name: 'System Design', level: 'advanced' },
      { name: 'Python', level: 'intermediate' },
    ],
    interests: ['Web Development', 'Open Source', 'System Design', 'UI/UX'],
    learningGoals: ['WebAssembly', 'Rust'],
    availability: [
      { day: 'Sat', slot: 'morning' },
      { day: 'Sun', slot: 'morning' },
      { day: 'Sat', slot: 'afternoon' },
    ],
    links: { github: 'https://github.com/nehakapoor', linkedin: 'https://linkedin.com/in/nehakapoor', portfolio: '' },
    mentorProfile: {
      expertise: ['React', 'TypeScript', 'System Design', 'Node.js', 'Interview Prep'],
      yearsOfExperience: 8,
      mentoringStatement: 'I help students grow from junior to senior thinking through real-world projects and structured feedback.',
      acceptingMentees: true,
    },
  },
  {
    name: 'James Wu',
    email: 'james.mentor@skillsync.test',
    role: 'mentor',
    headline: 'ML Engineer @ Anthropic | 5 yrs | AI/ML & Python',
    bio: 'ML engineer with a focus on NLP and responsible AI. Happy to guide students into the ML field.',
    college: 'Stanford University',
    course: 'M.S. Computer Science',
    yearOfStudy: 'Alumni',
    location: 'San Francisco, USA',
    timezone: 'America/Los_Angeles',
    skills: [
      { name: 'Python', level: 'advanced' },
      { name: 'Machine Learning', level: 'advanced' },
      { name: 'PyTorch', level: 'advanced' },
      { name: 'SQL', level: 'intermediate' },
    ],
    interests: ['AI/ML', 'Data Science', 'Open Source', 'Cybersecurity'],
    learningGoals: ['Distributed training', 'Rust'],
    availability: [
      { day: 'Sat', slot: 'morning' },
      { day: 'Sun', slot: 'afternoon' },
      { day: 'Mon', slot: 'evening' },
    ],
    links: { github: 'https://github.com/jameswu', linkedin: 'https://linkedin.com/in/jameswu', portfolio: '' },
    mentorProfile: {
      expertise: ['Machine Learning', 'Python', 'Deep Learning', 'NLP', 'MLOps'],
      yearsOfExperience: 5,
      mentoringStatement: 'I provide structured guidance on ML fundamentals, project design, and career paths in AI.',
      acceptingMentees: true,
    },
  },
];

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[seed:dev-users] Connected to MongoDB');

    for (const userData of DEV_USERS) {
      const { email, mentorProfile, ...rest } = userData;

      const existing = await User.findOne({ email: email.toLowerCase() });

      if (existing) {
        // Update profile fields but keep password in sync
        Object.assign(existing, rest);
        existing.email = email.toLowerCase();
        existing.password = DEV_SEED_PASSWORD;
        existing.isEmailVerified = true;
        existing.isActive = true;
        if (mentorProfile) existing.mentorProfile = mentorProfile;
        await existing.save();
        console.log(`[seed:dev-users] Updated: ${email}`);
      } else {
        const newUser = new User({
          ...rest,
          email: email.toLowerCase(),
          password: DEV_SEED_PASSWORD,
          isEmailVerified: true,
          isActive: true,
        });
        if (mentorProfile) newUser.mentorProfile = mentorProfile;
        await newUser.save();
        console.log(`[seed:dev-users] Created: ${email}`);
      }
    }

    console.log('[seed:dev-users] Done.');
  } catch (err) {
    console.error('[seed:dev-users] Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();

