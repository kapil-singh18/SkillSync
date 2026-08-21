/**
 * SkillSync Comprehensive Database Seed Script
 *
 * Populates SkillSync with realistic, production-quality demo data:
 * - 12 diverse student & mentor user accounts with detailed profiles
 * - 16 rich community posts with comments and organic upvotes
 * - 5 collaborative projects with members and Kanban task boards
 * - 4 active study rooms with continuous message histories
 * - 4 AI-styled learning roadmaps with completed milestone steps
 * - Technical skill assessments and graded attempts
 * - Gamification points, ranks, and unlocked badge achievements
 * - Peer matching connections with realistic compatibility scores
 *
 * Usage:
 *   npm run seed
 *   or
 *   node utils/seedDatabase.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

// Models
const User = require('../models/User');
const Badge = require('../models/Badge');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Room = require('../models/Room');
const Message = require('../models/Message');
const Roadmap = require('../models/Roadmap');
const Assessment = require('../models/Assessment');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const Match = require('../models/Match');

// Gamification helper
const { checkAndAwardBadges } = require('../services/gamificationService');

const SEED_PASSWORD = 'Demo@123';
const SEED_EMAIL_DOMAIN = '@demo.skillsync.io';

// Helper for realistic timestamps
const daysAgo = (days, hours = 0, minutes = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  d.setMinutes(d.getMinutes() - minutes);
  return d;
};

// ─── 0. Badge Catalog Definition ──────────────────────────────────────────────

const BADGES = [
  {
    name: 'First Post',
    description: 'Published your first community post',
    iconUrl: '📝',
    criteria: 'Create 1 post in the community feed',
  },
  {
    name: 'Conversationalist',
    description: 'Left 10 comments on community posts',
    iconUrl: '💬',
    criteria: 'Write 10 comments',
  },
  {
    name: 'Helpful Hand',
    description: 'Received 10 upvotes on your posts',
    iconUrl: '👍',
    criteria: 'Accumulate 10 upvotes across all posts',
  },
  {
    name: 'Team Player',
    description: 'Joined your first project team',
    iconUrl: '🤝',
    criteria: 'Be a member of at least 1 project',
  },
  {
    name: 'Quiz Ace',
    description: 'Scored 80%+ on a skill assessment',
    iconUrl: '🏆',
    criteria: 'Score at least 80% on any assessment',
  },
  {
    name: 'Roadmap Pioneer',
    description: 'Generated your first learning roadmap',
    iconUrl: '🗺️',
    criteria: 'Create 1 AI-generated roadmap',
  },
  {
    name: 'Rising Star',
    description: 'Earned 100 points',
    iconUrl: '⭐',
    criteria: 'Accumulate 100 points',
  },
  {
    name: 'Mentor',
    description: 'Helped 5 different users in chat',
    iconUrl: '🎓',
    criteria: 'Chat with 5 unique users',
  },
  {
    name: 'Explorer',
    description: 'Completed 5 skill assessments',
    iconUrl: '🧭',
    criteria: 'Complete 5 assessments',
  },
  {
    name: 'Community Leader',
    description: 'Earned 500 points and 5 badges',
    iconUrl: '👑',
    criteria: 'Have at least 500 points and 5 badges',
  },
];

// ─── 1. User Profiles Definition ──────────────────────────────────────────────

const SEED_USERS = [
  {
    key: 'sarah',
    name: 'Sarah Chen',
    email: `sarah.chen${SEED_EMAIL_DOMAIN}`,
    role: 'mentor',
    bio: 'Senior Full-Stack Engineer at Stripe alumni. Passionate about system design, microservices, and helping junior engineers transition to production-grade distributed architectures.',
    skills: [
      { name: 'React', level: 'advanced' },
      { name: 'Node.js', level: 'advanced' },
      { name: 'TypeScript', level: 'advanced' },
      { name: 'System Design', level: 'advanced' },
      { name: 'PostgreSQL', level: 'intermediate' },
    ],
    interests: ['Cloud Architecture', 'Distributed Systems', 'Mentorship', 'Open Source'],
    learningGoals: ['Rust for Systems Programming', 'WebAssembly internals'],
    availability: [
      { day: 'Tuesday', timeSlot: '18:00 - 20:00' },
      { day: 'Saturday', timeSlot: '10:00 - 12:00' },
    ],
    targetPoints: 850,
  },
  {
    key: 'alex',
    name: 'Alex Rivera',
    email: `alex.rivera${SEED_EMAIL_DOMAIN}`,
    role: 'student',
    bio: 'CS sophomore building modern React & Node applications. Currently grinding LeetCode patterns and building full-stack portfolio projects for summer internships.',
    skills: [
      { name: 'React', level: 'intermediate' },
      { name: 'JavaScript', level: 'intermediate' },
      { name: 'Python', level: 'beginner' },
      { name: 'TailwindCSS', level: 'intermediate' },
    ],
    interests: ['Frontend Development', 'Web3', 'Hackathons', 'Algorithm Practice'],
    learningGoals: ['Master Next.js App Router', 'Solve 150 LeetCode Mediums', 'Docker Basics'],
    availability: [
      { day: 'Monday', timeSlot: '16:00 - 18:00' },
      { day: 'Wednesday', timeSlot: '16:00 - 18:00' },
      { day: 'Friday', timeSlot: '14:00 - 16:00' },
    ],
    targetPoints: 420,
  },
  {
    key: 'marcus',
    name: 'Marcus Johnson',
    email: `marcus.johnson${SEED_EMAIL_DOMAIN}`,
    role: 'mentor',
    bio: 'Staff Machine Learning Engineer & Kaggle Grandmaster. 7+ years deploying PyTorch & LLM pipelines in production. Happy to review ML research papers and guide deep learning projects.',
    skills: [
      { name: 'Python', level: 'advanced' },
      { name: 'PyTorch', level: 'advanced' },
      { name: 'Machine Learning', level: 'advanced' },
      { name: 'MLOps', level: 'intermediate' },
      { name: 'Data Analysis', level: 'advanced' },
    ],
    interests: ['Large Language Models', 'Computer Vision', 'Deep Learning', 'Research'],
    learningGoals: ['CUDA Optimization', 'Mechanistic Interpretability'],
    availability: [
      { day: 'Thursday', timeSlot: '19:00 - 21:00' },
      { day: 'Sunday', timeSlot: '14:00 - 16:00' },
    ],
    targetPoints: 980,
  },
  {
    key: 'priya',
    name: 'Priya Patel',
    email: `priya.patel${SEED_EMAIL_DOMAIN}`,
    role: 'student',
    bio: 'Data Science student transitioning into AI Engineering. Exploring LangChain, Vector Databases, and fine-tuning open-source models for NLP applications.',
    skills: [
      { name: 'Python', level: 'intermediate' },
      { name: 'Data Analysis', level: 'intermediate' },
      { name: 'SQL', level: 'intermediate' },
      { name: 'Machine Learning', level: 'beginner' },
      { name: 'LangChain', level: 'beginner' },
    ],
    interests: ['Generative AI', 'Data Pipelines', 'NLP', 'Productivity Tools'],
    learningGoals: ['Build an Agentic Workflow App', 'Pass AWS Cloud Practitioner', 'Learn FastAPI'],
    availability: [
      { day: 'Tuesday', timeSlot: '14:00 - 16:00' },
      { day: 'Thursday', timeSlot: '14:00 - 16:00' },
    ],
    targetPoints: 310,
  },
  {
    key: 'david',
    name: 'David Kim',
    email: `david.kim${SEED_EMAIL_DOMAIN}`,
    role: 'student',
    bio: 'Self-taught developer focusing on Mobile & Cross-platform apps with Flutter and React Native. Love crafting buttery smooth 60fps micro-interactions.',
    skills: [
      { name: 'Flutter', level: 'intermediate' },
      { name: 'Dart', level: 'intermediate' },
      { name: 'React Native', level: 'intermediate' },
      { name: 'UI/UX Design', level: 'beginner' },
      { name: 'Firebase', level: 'intermediate' },
    ],
    interests: ['Mobile Architecture', 'App Store Publishing', 'Animations', 'Design Systems'],
    learningGoals: ['SwiftUI Basics', 'GraphQL for Mobile', 'State Management Patterns'],
    availability: [
      { day: 'Wednesday', timeSlot: '18:00 - 20:00' },
      { day: 'Saturday', timeSlot: '14:00 - 18:00' },
    ],
    targetPoints: 520,
  },
  {
    key: 'elena',
    name: 'Elena Rostova',
    email: `elena.rostova${SEED_EMAIL_DOMAIN}`,
    role: 'student',
    bio: 'Product Designer & UI Engineer passionate about accessible web components, Figma token workflows, and bridging the gap between Figma and production React code.',
    skills: [
      { name: 'UI/UX Design', level: 'advanced' },
      { name: 'Figma', level: 'advanced' },
      { name: 'CSS', level: 'advanced' },
      { name: 'React', level: 'intermediate' },
      { name: 'HTML', level: 'advanced' },
    ],
    interests: ['Design Systems', 'Web Accessibility', 'Figma Plugins', 'Design Engineering'],
    learningGoals: ['TailwindCSS v4', 'Framer Motion Pro', 'Storybook 8 Automation'],
    availability: [
      { day: 'Monday', timeSlot: '10:00 - 12:00' },
      { day: 'Thursday', timeSlot: '16:00 - 18:00' },
    ],
    targetPoints: 640,
  },
  {
    key: 'liam',
    name: "Liam O'Connor",
    email: `liam.oconnor${SEED_EMAIL_DOMAIN}`,
    role: 'student',
    bio: 'Backend enthusiast diving deep into Go microservices, gRPC, and Docker orchestration. Preparing for distributed systems engineering roles.',
    skills: [
      { name: 'Go', level: 'intermediate' },
      { name: 'Docker', level: 'intermediate' },
      { name: 'PostgreSQL', level: 'intermediate' },
      { name: 'Redis', level: 'beginner' },
      { name: 'Linux', level: 'intermediate' },
    ],
    interests: ['DevOps', 'Distributed Systems', 'Kubernetes', 'High-Throughput APIs'],
    learningGoals: ['Kubernetes Certification (CKA)', 'gRPC & Protobuf in Production', 'Kafka Streaming'],
    availability: [
      { day: 'Friday', timeSlot: '18:00 - 21:00' },
      { day: 'Sunday', timeSlot: '10:00 - 13:00' },
    ],
    targetPoints: 380,
  },
  {
    key: 'amara',
    name: 'Amara Okafor',
    email: `amara.okafor${SEED_EMAIL_DOMAIN}`,
    role: 'student',
    bio: 'Aspiring Cybersecurity Analyst & Ethical Hacker. Focused on OWASP Top 10 web vulnerabilities, secure code review, and network penetration testing.',
    skills: [
      { name: 'Cybersecurity', level: 'intermediate' },
      { name: 'Linux', level: 'intermediate' },
      { name: 'Python', level: 'intermediate' },
      { name: 'Network Security', level: 'intermediate' },
      { name: 'Cryptography', level: 'beginner' },
    ],
    interests: ['Capture The Flag (CTF)', 'Penetration Testing', 'Cloud Security', 'DevSecOps'],
    learningGoals: ['CompTIA Security+', 'Burp Suite Pro Techniques', 'OAuth2 & OIDC Security'],
    availability: [
      { day: 'Tuesday', timeSlot: '19:00 - 21:00' },
      { day: 'Saturday', timeSlot: '12:00 - 15:00' },
    ],
    targetPoints: 290,
  },
  {
    key: 'devon',
    name: 'Devon Vance',
    email: `devon.vance${SEED_EMAIL_DOMAIN}`,
    role: 'mentor',
    bio: 'Lead DevOps Architect & Cloud Consultant with 8+ years experience in AWS, Terraform, and CI/CD pipelines. Love helping teams automate deployments and scale reliably.',
    skills: [
      { name: 'AWS', level: 'advanced' },
      { name: 'Terraform', level: 'advanced' },
      { name: 'Docker', level: 'advanced' },
      { name: 'CI/CD', level: 'advanced' },
      { name: 'Kubernetes', level: 'intermediate' },
    ],
    interests: ['Infrastructure as Code', 'Site Reliability Engineering', 'GitOps', 'Cloud Cost Optimization'],
    learningGoals: ['eBPF Observability', 'Zero Trust Architecture'],
    availability: [
      { day: 'Wednesday', timeSlot: '19:00 - 21:00' },
      { day: 'Sunday', timeSlot: '16:00 - 18:00' },
    ],
    targetPoints: 760,
  },
  {
    key: 'chloe',
    name: 'Chloe Bennett',
    email: `chloe.bennett${SEED_EMAIL_DOMAIN}`,
    role: 'student',
    bio: 'Frontend developer with a keen eye for motion and typography. Building modern web experiences with Next.js, Three.js, and WebGL.',
    skills: [
      { name: 'React', level: 'intermediate' },
      { name: 'Three.js', level: 'beginner' },
      { name: 'JavaScript', level: 'advanced' },
      { name: 'CSS', level: 'advanced' },
      { name: 'WebGL', level: 'beginner' },
    ],
    interests: ['Creative Coding', '3D Web', 'Design Systems', 'Interactive Portfolio'],
    learningGoals: ['Shaders (GLSL)', 'React Three Fiber', 'Canvas Performance'],
    availability: [
      { day: 'Monday', timeSlot: '14:00 - 16:00' },
      { day: 'Wednesday', timeSlot: '14:00 - 16:00' },
    ],
    targetPoints: 450,
  },
  {
    key: 'hassan',
    name: 'Hassan Malik',
    email: `hassan.malik${SEED_EMAIL_DOMAIN}`,
    role: 'student',
    bio: 'Information Systems student learning full-stack MERN stack development and relational databases. Eager to collaborate on real-world team projects.',
    skills: [
      { name: 'JavaScript', level: 'intermediate' },
      { name: 'Node.js', level: 'intermediate' },
      { name: 'MongoDB', level: 'intermediate' },
      { name: 'Express', level: 'intermediate' },
      { name: 'Git', level: 'intermediate' },
    ],
    interests: ['Full-Stack Development', 'API Design', 'Open Source', 'Study Groups'],
    learningGoals: ['TypeScript Integration in Express', 'JWT Refresh Token Patterns', 'Redis Caching'],
    availability: [
      { day: 'Thursday', timeSlot: '17:00 - 19:00' },
      { day: 'Friday', timeSlot: '15:00 - 17:00' },
    ],
    targetPoints: 340,
  },
  {
    key: 'maya',
    name: 'Maya Lin',
    email: `maya.lin${SEED_EMAIL_DOMAIN}`,
    role: 'student',
    bio: 'Junior Data Analyst specializing in SQL, Tableau, and Python Pandas. Passionate about turning complex datasets into clear, actionable business insights.',
    skills: [
      { name: 'SQL', level: 'advanced' },
      { name: 'Python', level: 'intermediate' },
      { name: 'Data Visualization', level: 'intermediate' },
      { name: 'Tableau', level: 'intermediate' },
      { name: 'Statistics', level: 'intermediate' },
    ],
    interests: ['Business Intelligence', 'Data Storytelling', 'Product Analytics', 'A/B Testing'],
    learningGoals: ['dbt Fundamentals', 'Snowflake Cloud Data Warehouse', 'PowerBI Advanced DAX'],
    availability: [
      { day: 'Tuesday', timeSlot: '16:00 - 18:00' },
      { day: 'Saturday', timeSlot: '11:00 - 14:00' },
    ],
    targetPoints: 590,
  },
];

// ─── Main Seed Routine ────────────────────────────────────────────────────────

const runSeed = async () => {
  try {
    console.log('\n========================================');
    console.log('🌱 SkillSync Database Seeder Initiating...');
    console.log('========================================\n');

    await connectDB();
    console.log('✓ Connected to MongoDB');

    // ── 0. Seed Badges Catalog ────────────────────────────────────────────────
    console.log('\n[1/8] Seeding Badge Catalog...');
    for (const badge of BADGES) {
      await Badge.findOneAndUpdate(
        { name: badge.name },
        { $set: badge },
        { upsert: true, new: true }
      );
    }
    const allBadges = await Badge.find();
    const badgeMap = new Map(allBadges.map((b) => [b.name, b]));
    console.log(`✓ Seeded ${allBadges.length} badge definitions`);

    // ── 1. Clean Existing Demo Data Safely ─────────────────────────────────────
    console.log('\n[2/8] Cleaning previous seed data...');
    const existingSeedUsers = await User.find({ email: { $regex: /@demo\.skillsync\.io$/i } });
    const seedUserIds = existingSeedUsers.map((u) => u._id);

    if (seedUserIds.length > 0) {
      // Find seed projects to delete tasks
      const seedProjects = await Project.find({ owner: { $in: seedUserIds } });
      const seedProjectIds = seedProjects.map((p) => p._id);
      await Task.deleteMany({ project: { $in: seedProjectIds } });
      await Project.deleteMany({ _id: { $in: seedProjectIds } });

      // Find seed rooms to delete messages
      const seedRooms = await Room.find({ createdBy: { $in: seedUserIds } });
      const seedRoomIds = seedRooms.map((r) => r._id);
      await Message.deleteMany({ $or: [{ sender: { $in: seedUserIds } }, { room: { $in: seedRoomIds } }] });
      await Room.deleteMany({ _id: { $in: seedRoomIds } });

      // Seed posts & comments
      const seedPosts = await Post.find({ author: { $in: seedUserIds } });
      const seedPostIds = seedPosts.map((p) => p._id);
      await Comment.deleteMany({ $or: [{ author: { $in: seedUserIds } }, { post: { $in: seedPostIds } }] });
      await Post.deleteMany({ _id: { $in: seedPostIds } });

      // Roadmaps, Attempts, Matches
      await Roadmap.deleteMany({ user: { $in: seedUserIds } });
      await AssessmentAttempt.deleteMany({ user: { $in: seedUserIds } });
      await Match.deleteMany({ $or: [{ userA: { $in: seedUserIds } }, { userB: { $in: seedUserIds } }] });

      // Delete seed users
      await User.deleteMany({ _id: { $in: seedUserIds } });
      console.log(`✓ Cleaned ${seedUserIds.length} legacy seed user records and related artifacts`);
    } else {
      console.log('✓ No previous seed data found');
    }

    // ── 2. Create Seed Users ──────────────────────────────────────────────────
    console.log('\n[3/8] Creating 12 realistic User accounts...');
    const userMap = {}; // key -> User doc
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(SEED_PASSWORD, salt);

    for (const userData of SEED_USERS) {
      const user = new User({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        bio: userData.bio,
        skills: userData.skills,
        interests: userData.interests,
        learningGoals: userData.learningGoals,
        availability: userData.availability,
        points: userData.targetPoints || 0,
      });

      // Save directly bypassing double-hash
      await user.save({ validateBeforeSave: false });
      userMap[userData.key] = user;
    }
    console.log(`✓ Successfully created ${Object.keys(userMap).length} users`);

    // ── 3. Seed Assessments Catalog ───────────────────────────────────────────
    console.log('\n[4/8] Seeding Skill Assessments & Attempts...');
    const assessmentsData = [
      {
        skillName: 'javascript',
        difficulty: 'intermediate',
        questions: [
          {
            questionText: 'What is the output of `typeof null` in standard JavaScript?',
            options: ['"null"', '"object"', '"undefined"', '"number"'],
            correctOptionIndex: 1,
          },
          {
            questionText: 'Which method creates a new array with all elements that pass the test implemented by the provided function?',
            options: ['Array.prototype.map()', 'Array.prototype.forEach()', 'Array.prototype.filter()', 'Array.prototype.reduce()'],
            correctOptionIndex: 2,
          },
          {
            questionText: 'What will `console.log(0.1 + 0.2 === 0.3)` output in JavaScript?',
            options: ['true', 'false', 'undefined', 'TypeError'],
            correctOptionIndex: 1,
          },
          {
            questionText: 'What does the `Promise.allSettled()` method return?',
            options: ['A single promise that rejects as soon as one rejects', 'A promise that resolves after all given promises have fulfilled or rejected', 'An array of fulfilled values only', 'A generator iterator'],
            correctOptionIndex: 1,
          },
          {
            questionText: 'Which statement accurately describes JavaScript event loop microtasks vs macrotasks?',
            options: ['setTimeout callbacks are microtasks', 'Promise resolution callbacks queue into the microtask queue executed before the next macrotask', 'requestAnimationFrame runs in the microtask queue', 'Microtasks only run once per second'],
            correctOptionIndex: 1,
          },
        ],
      },
      {
        skillName: 'python',
        difficulty: 'intermediate',
        questions: [
          {
            questionText: 'Which Python keyword is used to define a generator function?',
            options: ['async', 'yield', 'lambda', 'generator'],
            correctOptionIndex: 1,
          },
          {
            questionText: 'What is the time complexity of looking up a key in a standard Python dictionary on average?',
            options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
            correctOptionIndex: 0,
          },
          {
            questionText: 'Which built-in module provides tools for working with iterators?',
            options: ['functools', 'itertools', 'collections', 'operator'],
            correctOptionIndex: 1,
          },
          {
            questionText: 'What is the purpose of Python GIL (Global Interpreter Lock)?',
            options: ['To speed up multi-core math calculations', 'To synchronize thread execution so only one native thread executes Python bytecode at a time', 'To encrypt compiled bytecode in memory', 'To manage garbage collection memory pools'],
            correctOptionIndex: 1,
          },
          {
            questionText: 'What is the difference between `@classmethod` and `@staticmethod` in Python?',
            options: ['Class methods receive `cls` as the first argument; static methods receive neither `self` nor `cls`', 'Static methods can modify class state, class methods cannot', 'Class methods are private, static methods are public', 'There is no difference'],
            correctOptionIndex: 0,
          },
        ],
      },
      {
        skillName: 'react',
        difficulty: 'intermediate',
        questions: [
          {
            questionText: 'What rule must be followed when invoking React Hooks?',
            options: ['Hooks can only be called inside loops', 'Hooks must only be called at the top level of React function components or custom hooks', 'Hooks must be declared with the var keyword', 'Hooks cannot be asynchronous under any circumstance'],
            correctOptionIndex: 1,
          },
          {
            questionText: 'What is the primary benefit of `useCallback` in React?',
            options: ['It caches calculated values between renders', 'It memoizes a function definition across re-renders to prevent unnecessary child re-renders', 'It creates a background web worker', 'It synchronizes state with local storage'],
            correctOptionIndex: 1,
          },
          {
            questionText: 'Why should you avoid using array indices as `key` props on dynamic lists?',
            options: ['React throws a runtime compile error', 'It can cause bugs with component state and incorrect DOM reordering when items are added, removed, or sorted', 'Keys must always be strings longer than 10 characters', 'Indices make bundle sizes larger'],
            correctOptionIndex: 1,
          },
          {
            questionText: 'When does the cleanup function in `useEffect` run?',
            options: ['Only when the component mounts', 'Before the effect runs again and when the component unmounts', 'Only on window reload', 'After the DOM paint of the next render'],
            correctOptionIndex: 1,
          },
          {
            questionText: 'What is the React Virtual DOM?',
            options: ['A direct wrapper around the browser WebGL canvas', 'A lightweight in-memory representation of the real DOM tree used for diffing and batch updates', 'A proprietary Chrome browser extension API', 'A WebAssembly rendering engine'],
            correctOptionIndex: 1,
          },
        ],
      },
    ];

    const assessmentMap = {};
    for (const aData of assessmentsData) {
      const a = await Assessment.findOneAndUpdate(
        { skillName: aData.skillName, difficulty: aData.difficulty },
        { $set: aData },
        { upsert: true, new: true }
      );
      assessmentMap[`${aData.skillName}_${aData.difficulty}`] = a;
    }

    // Seed realistic assessment attempts for users
    const sampleAttempts = [
      { user: userMap.marcus, key: 'python_intermediate', score: 5, total: 5, passed: true, points: 25, days: 12 },
      { user: userMap.sarah, key: 'javascript_intermediate', score: 5, total: 5, passed: true, points: 25, days: 10 },
      { user: userMap.sarah, key: 'react_intermediate', score: 5, total: 5, passed: true, points: 25, days: 8 },
      { user: userMap.alex, key: 'javascript_intermediate', score: 4, total: 5, passed: true, points: 20, days: 6 },
      { user: userMap.alex, key: 'react_intermediate', score: 4, total: 5, passed: true, points: 20, days: 3 },
      { user: userMap.priya, key: 'python_intermediate', score: 4, total: 5, passed: true, points: 20, days: 7 },
      { user: userMap.elena, key: 'react_intermediate', score: 4, total: 5, passed: true, points: 20, days: 9 },
      { user: userMap.maya, key: 'python_intermediate', score: 5, total: 5, passed: true, points: 25, days: 5 },
      { user: userMap.hassan, key: 'javascript_intermediate', score: 3, total: 5, passed: false, points: 0, days: 11 },
      { user: userMap.hassan, key: 'javascript_intermediate', score: 4, total: 5, passed: true, points: 20, days: 4 },
      { user: userMap.david, key: 'javascript_intermediate', score: 4, total: 5, passed: true, points: 20, days: 5 },
      { user: userMap.liam, key: 'python_intermediate', score: 4, total: 5, passed: true, points: 20, days: 6 },
    ];

    for (const att of sampleAttempts) {
      const assessment = assessmentMap[att.key];
      if (!assessment) continue;
      const percentage = Math.round((att.score / att.total) * 100);
      await AssessmentAttempt.create({
        user: att.user._id,
        assessment: assessment._id,
        score: att.score,
        totalQuestions: att.total,
        percentage,
        passed: att.passed,
        pointsEarned: att.points,
        answers: assessment.questions.map((q, idx) => ({
          questionIndex: idx,
          selectedOptionIndex: idx < att.score ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4,
        })),
        completedAt: daysAgo(att.days, 2),
      });
    }
    console.log(`✓ Seeded ${sampleAttempts.length} assessment attempts`);

    // ── 4. Seed Roadmaps ──────────────────────────────────────────────────────
    console.log('\n[5/8] Seeding AI Learning Roadmaps...');
    const roadmapsData = [
      {
        user: userMap.alex._id,
        topic: 'Full-Stack React & Node Mastery',
        level: 'intermediate',
        steps: [
          { order: 1, title: 'TypeScript Fundamentals for React', description: 'Generics, utility types, and strict component props typing.', estimatedTime: '1 week', completed: true },
          { order: 2, title: 'Next.js 15 App Router Architecture', description: 'Server vs Client components, streaming Suspense boundaries, and Route Handlers.', estimatedTime: '2 weeks', completed: true },
          { order: 3, title: 'State Management with Zustand & React Query', description: 'Decoupled asynchronous caching and lightweight client stores.', estimatedTime: '1 week', completed: true },
          { order: 4, title: 'REST & GraphQL Backend API Design in Node', description: 'Express middleware, Zod schema validation, and error boundaries.', estimatedTime: '2 weeks', completed: true },
          { order: 5, title: 'PostgreSQL & Prisma ORM Modeling', description: 'Relational schemas, indexes, migrations, and connection pooling.', estimatedTime: '2 weeks', completed: true },
          { order: 6, title: 'Authentication, OAuth2 & JWT Refresh Flow', description: 'Secure httpOnly cookie patterns, rate limiting, and session revocation.', estimatedTime: '1 week', completed: true },
          { order: 7, title: 'Docker Containerization & CI/CD Pipelines', description: 'Multi-stage Docker builds and automated GitHub Actions testing.', estimatedTime: '1-2 weeks', completed: false },
          { order: 8, title: 'Production Deployment & Monitoring', description: 'Deploying to AWS/Render with Sentry telemetry and uptime metrics.', estimatedTime: '1 week', completed: false },
        ],
      },
      {
        user: userMap.priya._id,
        topic: 'Applied Machine Learning & NLP',
        level: 'beginner',
        steps: [
          { order: 1, title: 'Data Wrangling with Pandas & NumPy', description: 'Vectorized transformations, missing value imputation, and exploratory data analysis.', estimatedTime: '1-2 weeks', completed: true },
          { order: 2, title: 'Classical Machine Learning with Scikit-Learn', description: 'Linear models, Random Forests, Gradient Boosting, and cross-validation.', estimatedTime: '2 weeks', completed: true },
          { order: 3, title: 'Deep Learning Foundations with PyTorch', description: 'Tensors, autograd, custom Dataset classes, and training loops.', estimatedTime: '2 weeks', completed: true },
          { order: 4, title: 'Hugging Face Transformers & Tokenizers', description: 'BERT, RoBERTa embeddings, and fine-tuning sequence classification heads.', estimatedTime: '2 weeks', completed: true },
          { order: 5, title: 'Vector Databases & Semantic Search', description: 'ChromaDB, Pinecone, embeddings indexing, and RAG pipelines.', estimatedTime: '2 weeks', completed: false },
          { order: 6, title: 'LangChain & Agentic LLM Workflows', description: 'Tool calling, memory management, and structured schema outputs.', estimatedTime: '2 weeks', completed: false },
          { order: 7, title: 'Model Evaluation & LLMOps Monitoring', description: 'Faithfulness metrics, hallucination detection, and LangSmith telemetry.', estimatedTime: '1 week', completed: false },
        ],
      },
      {
        user: userMap.liam._id,
        topic: 'Cloud-Native Backend in Go & Kubernetes',
        level: 'intermediate',
        steps: [
          { order: 1, title: 'Go Language Internals & Concurrency', description: 'Goroutines, channels, sync.Mutex, and context cancellation patterns.', estimatedTime: '2 weeks', completed: true },
          { order: 2, title: 'High-Performance HTTP & gRPC Microservices', description: 'Protocol buffers, streaming RPCs, and middleware chains.', estimatedTime: '2 weeks', completed: true },
          { order: 3, title: 'PostgreSQL Advanced Query Tuning', description: 'Indexes, EXPLAIN ANALYZE, transaction isolation levels, and pgx driver.', estimatedTime: '1-2 weeks', completed: true },
          { order: 4, title: 'Distributed Caching with Redis', description: 'Cache-aside, Redis streams, and distributed rate limiting algorithms.', estimatedTime: '1 week', completed: true },
          { order: 5, title: 'Docker Multi-Stage Packaging', description: 'Scratch-based minimal container images with non-root security.', estimatedTime: '1 week', completed: true },
          { order: 6, title: 'Kubernetes Pods, Services & Deployments', description: 'ConfigMaps, Secrets, Ingress controllers, and HPA autoscaling.', estimatedTime: '2 weeks', completed: true },
          { order: 7, title: 'Helm Charts & GitOps with ArgoCD', description: 'Templated cloud releases and declarative infrastructure syncing.', estimatedTime: '1-2 weeks', completed: true },
          { order: 8, title: 'Prometheus & OpenTelemetry Observability', description: 'Distributed tracing, histogram metrics, and Grafana dashboards.', estimatedTime: '1 week', completed: true },
        ],
      },
      {
        user: userMap.david._id,
        topic: 'Production Mobile App Development with Flutter',
        level: 'beginner',
        steps: [
          { order: 1, title: 'Dart Language & OOP Fundamentals', description: 'Null safety, mixins, async/await streams, and functional helpers.', estimatedTime: '1 week', completed: true },
          { order: 2, title: 'Flutter Widget Tree & Custom Painting', description: 'Stateless vs Stateful, CustomPainter, and responsive layout builders.', estimatedTime: '2 weeks', completed: true },
          { order: 3, title: 'State Management with Bloc & Riverpod', description: 'Immutable state streams, dependency injection, and decoupled view logic.', estimatedTime: '2 weeks', completed: true },
          { order: 4, title: 'REST & GraphQL Networking with Dio', description: 'Interceptors, automatic token refresh, and JSON serialization.', estimatedTime: '1-2 weeks', completed: false },
          { order: 5, title: 'Local Offline Persistence with Hive / SQLite', description: 'Encrypted key-value storage and offline-first data sync.', estimatedTime: '1 week', completed: false },
          { order: 6, title: 'App Store & Google Play Store Publishing', description: 'Fastlane automation, code signing, and release bundle optimization.', estimatedTime: '1 week', completed: false },
        ],
      },
    ];

    for (const rData of roadmapsData) {
      await Roadmap.create(rData);
    }
    console.log(`✓ Seeded ${roadmapsData.length} learning roadmaps with completed steps`);

    // ── 5. Seed Projects & Kanban Boards ──────────────────────────────────────
    console.log('\n[6/8] Seeding Collaborative Projects & Kanban Boards...');
    const projectsData = [
      {
        key: 'devflow',
        title: 'DevFlow - Open Source Developer Dashboard',
        description: 'A modular developer command center featuring GitHub PR tracking, CI/CD pipeline health checks, and customizable widget grids.',
        type: 'study_project',
        owner: userMap.sarah._id,
        members: [
          { user: userMap.sarah._id, role: 'lead' },
          { user: userMap.alex._id, role: 'frontend' },
          { user: userMap.liam._id, role: 'backend' },
          { user: userMap.elena._id, role: 'designer' },
        ],
        requiredSkills: ['React', 'Node.js', 'PostgreSQL', 'Figma'],
        status: 'in_progress',
        tasks: [
          { title: 'Design Figma component library & theme tokens', description: 'Create accessible dark/light mode UI tokens and reusable button/input styles.', status: 'done', assignedTo: userMap.elena._id },
          { title: 'Implement JWT authentication & refresh flow', description: 'Secure cookie-based authentication with Express middleware and token rotation.', status: 'done', assignedTo: userMap.liam._id },
          { title: 'Build interactive metrics chart widgets', description: 'Render responsive Recharts graphs with time-range filtering.', status: 'in_progress', assignedTo: userMap.alex._id },
          { title: 'Setup GitHub Actions CI/CD workflow', description: 'Automate linting, unit testing, and Docker container publishing.', status: 'in_progress', assignedTo: userMap.sarah._id },
          { title: 'Write API documentation with OpenAPI/Swagger', description: 'Document all REST endpoints, request payloads, and error codes.', status: 'todo', assignedTo: userMap.liam._id },
          { title: 'Add keyboard navigation accessibility tests', description: 'Ensure full WCAG 2.1 AA compliance across all modal dialogs and dropdowns.', status: 'todo', assignedTo: userMap.elena._id },
        ],
      },
      {
        key: 'medisync',
        title: 'MediSync - Hackathon Healthcare Assistant',
        description: 'AI-assisted medical symptom triage assistant with cross-platform mobile interface and real-time telehealth chat.',
        type: 'hackathon_team',
        owner: userMap.marcus._id,
        members: [
          { user: userMap.marcus._id, role: 'lead' },
          { user: userMap.priya._id, role: 'data/ai' },
          { user: userMap.david._id, role: 'mobile' },
          { user: userMap.hassan._id, role: 'backend' },
        ],
        requiredSkills: ['Python', 'FastAPI', 'Flutter', 'PyTorch'],
        status: 'in_progress',
        tasks: [
          { title: 'Scrape and clean medical symptom dataset', description: 'Aggregate public medical ontologies and remove duplicate entity tags.', status: 'done', assignedTo: userMap.priya._id },
          { title: 'Train lightweight classification baseline model', description: 'Fine-tune a distilled transformer model for symptom severity classification.', status: 'done', assignedTo: userMap.marcus._id },
          { title: 'Build Flutter cross-platform triage UI', description: 'Create responsive questionnaires and appointment scheduling screens.', status: 'in_progress', assignedTo: userMap.david._id },
          { title: 'Implement streaming WebSocket inference API', description: 'FastAPI streaming endpoint to push conversational tokens to the mobile client.', status: 'in_progress', assignedTo: userMap.hassan._id },
          { title: 'Prepare 3-minute hackathon pitch deck & demo video', description: 'Record product walk-through showing real-time mobile symptom triage.', status: 'todo', assignedTo: userMap.marcus._id },
        ],
      },
      {
        key: 'cloudguard',
        title: 'CloudGuard - Automated Security Scanner',
        description: 'Lightweight static and dynamic vulnerability analysis tool for Docker containers and cloud infrastructure configurations.',
        type: 'study_project',
        owner: userMap.devon._id,
        members: [
          { user: userMap.devon._id, role: 'lead' },
          { user: userMap.amara._id, role: 'security' },
          { user: userMap.liam._id, role: 'backend' },
        ],
        requiredSkills: ['AWS', 'Cybersecurity', 'Docker', 'Go'],
        status: 'in_progress',
        tasks: [
          { title: 'Setup AWS IAM role assumption and test environment', description: 'Configure least-privilege sandbox accounts for security probe simulations.', status: 'done', assignedTo: userMap.devon._id },
          { title: 'Write OWASP top 10 automated test cases', description: 'Build automated payloads for XSS, SQLi, and misconfigured CORS headers.', status: 'done', assignedTo: userMap.amara._id },
          { title: 'Build containerized scanning agent in Go', description: 'Concurrent scanner binary that inspects open ports and TLS certificates.', status: 'in_progress', assignedTo: userMap.liam._id },
          { title: 'Generate PDF security audit report export', description: 'Format compliance findings with severity ratings and remediation steps.', status: 'todo', assignedTo: userMap.amara._id },
          { title: 'Add Slack webhook notification triggers', description: 'Send high-priority vulnerability alerts directly to designated Slack channels.', status: 'todo', assignedTo: userMap.devon._id },
        ],
      },
      {
        key: 'algoprep',
        title: 'AlgoPrep - Collaborative DSA Study Group',
        description: 'Structured group for cracking technical coding interviews through weekly peer mock interviews and pattern breakdowns.',
        type: 'study_project',
        owner: userMap.alex._id,
        members: [
          { user: userMap.alex._id, role: 'lead' },
          { user: userMap.hassan._id, role: 'member' },
          { user: userMap.priya._id, role: 'member' },
        ],
        requiredSkills: ['JavaScript', 'Python', 'Algorithms'],
        status: 'in_progress',
        tasks: [
          { title: 'Complete NeetCode 150 Array & Hashing section', description: 'Solve and document solutions for Two Sum, Group Anagrams, and Top K Elements.', status: 'done', assignedTo: userMap.alex._id },
          { title: 'Document Two Pointer & Sliding Window templates', description: 'Write reusable code templates for Substring with Concatenation problems.', status: 'done', assignedTo: userMap.hassan._id },
          { title: 'Solve 10 Dynamic Programming classical problems', description: 'House Robber, Coin Change, and Longest Increasing Subsequence.', status: 'in_progress', assignedTo: userMap.priya._id },
          { title: 'Conduct peer mock interview on Binary Trees', description: 'Simulate a 45-min live Google interview on Lowest Common Ancestor.', status: 'in_progress', assignedTo: userMap.alex._id },
          { title: 'Compile company-specific tagged problem list', description: 'Curate most frequent questions from Meta, Amazon, and Stripe.', status: 'todo', assignedTo: userMap.hassan._id },
        ],
      },
      {
        key: 'spatialui',
        title: 'SpatialUI - 3D Portfolio & Asset Viewer',
        description: 'Interactive WebGL and Three.js 3D web experience for showcasing creative coding experiments and 3D digital art.',
        type: 'hackathon_team',
        owner: userMap.chloe._id,
        members: [
          { user: userMap.chloe._id, role: 'lead' },
          { user: userMap.elena._id, role: 'designer' },
          { user: userMap.david._id, role: 'member' },
        ],
        requiredSkills: ['Three.js', 'React', 'UI/UX Design', 'WebGL'],
        status: 'open',
        tasks: [
          { title: 'Create 3D low-poly workspace model in Blender', description: 'Export optimized GLTF asset with bake textures and material slots.', status: 'done', assignedTo: userMap.elena._id },
          { title: 'Setup React Three Fiber scene & camera controls', description: 'Initialize Canvas, OrbitControls, and ambient environment lighting.', status: 'done', assignedTo: userMap.chloe._id },
          { title: 'Implement dynamic shadow mapping & post-processing', description: 'Add Bloom and Depth of Field effects without dropping below 60fps.', status: 'in_progress', assignedTo: userMap.chloe._id },
          { title: 'Add touch gesture camera controls for mobile devices', description: 'Smooth pinch-to-zoom and two-finger pan for iOS/Android browsers.', status: 'todo', assignedTo: userMap.david._id },
          { title: 'Optimize GLTF model compression using Draco', description: 'Reduce total 3D asset transfer size below 1.5MB for fast initial load.', status: 'todo', assignedTo: userMap.elena._id },
        ],
      },
    ];

    for (const pData of projectsData) {
      const project = await Project.create({
        title: pData.title,
        description: pData.description,
        type: pData.type,
        owner: pData.owner,
        members: pData.members,
        requiredSkills: pData.requiredSkills,
        status: pData.status,
      });

      for (const tData of pData.tasks) {
        await Task.create({
          project: project._id,
          title: tData.title,
          description: tData.description,
          status: tData.status,
          assignedTo: tData.assignedTo,
        });
      }
    }
    console.log(`✓ Seeded ${projectsData.length} projects and corresponding Kanban tasks`);

    // ── 6. Seed Study Rooms & Messages ────────────────────────────────────────
    console.log('\n[7/8] Seeding Study Rooms & Conversation History...');
    const roomsData = [
      {
        name: 'Frontend Architecture & React',
        description: 'Discussions on component design systems, performance profiling, and modern web frontend tooling.',
        createdBy: userMap.sarah._id,
        members: [userMap.sarah._id, userMap.alex._id, userMap.elena._id, userMap.chloe._id, userMap.hassan._id],
        messages: [
          { sender: userMap.sarah, text: "Hey everyone! Welcome to the Frontend Architecture room. Feel free to ask questions or share your current UI challenges.", days: 4, hours: 8 },
          { sender: userMap.alex, text: "Thanks Sarah! Question: when building dashboard widgets, do you prefer storing server state in Zustand or React Query?", days: 4, hours: 6 },
          { sender: userMap.sarah, text: "Definitely React Query (TanStack Query) for server state! It handles caching, deduplication, and background refetching automatically. Keep Zustand for purely client-side UI states like sidebar toggles and active modals.", days: 4, hours: 5 },
          { sender: userMap.elena, text: "Completely agree. Also, if you use CSS variables for design tokens, switching themes in React becomes virtually instantaneous without context re-renders.", days: 3, hours: 20 },
          { sender: userMap.chloe, text: "Has anyone here experimented with React 19's `useActionState` yet?", days: 3, hours: 14 },
          { sender: userMap.sarah, text: "Yes! It simplifies optimistic mutations significantly. You don't need boilerplate loading states anymore for form submissions.", days: 3, hours: 12 },
          { sender: userMap.hassan, text: "That sounds super helpful for our project auth flow. I'll test it out tonight.", days: 2, hours: 18 },
          { sender: userMap.alex, text: "Just pushed the new responsive charts for DevFlow! Check out the dashboard if you have a minute to review.", days: 1, hours: 22 },
          { sender: userMap.elena, text: "Looks super clean Alex! The padding and typography match our Figma specs perfectly.", days: 1, hours: 20 },
          { sender: userMap.sarah, text: "Great work team. Let's do a quick sync on Discord tomorrow evening.", days: 0, hours: 4 },
        ],
      },
      {
        name: 'Machine Learning & Python Hub',
        description: 'Exploring PyTorch architectures, Kaggle pipelines, generative AI agents, and production MLOps.',
        createdBy: userMap.marcus._id,
        members: [userMap.marcus._id, userMap.priya._id, userMap.maya._id, userMap.devon._id],
        messages: [
          { sender: userMap.marcus, text: "Welcome ML enthusiasts! Let's use this space for paper reading discussions, dataset links, and debugging model training.", days: 5, hours: 10 },
          { sender: userMap.priya, text: "Hi Marcus! I was looking into semantic chunking for RAG pipelines. Do you recommend token-based or sentence-boundary chunking?", days: 5, hours: 6 },
          { sender: userMap.marcus, text: "For technical documentation, sentence-boundary chunking with a 15% sliding window overlap preserves context best. Token chunking often slices code blocks right in the middle of functions.", days: 5, hours: 4 },
          { sender: userMap.maya, text: "I noticed that too when processing financial earnings call transcripts in Python. Switching to LangChain recursive text splitter improved retrieval accuracy by 22%.", days: 4, hours: 16 },
          { sender: userMap.devon, text: "From an infrastructure perspective, make sure you quantize models to 4-bit/8-bit if you're serving on AWS T4 GPUs. Cuts inference latency in half.", days: 3, hours: 11 },
          { sender: userMap.priya, text: "Thanks Devon! We are implementing vLLM for MediSync right now.", days: 2, hours: 15 },
          { sender: userMap.marcus, text: "The baseline model evaluation accuracy just hit 89.4% on the validation split! Super promising for our hackathon demo.", days: 1, hours: 9 },
          { sender: userMap.maya, text: "Amazing! Let me know if you need any statistical significance tests or A/B evaluation charts.", days: 0, hours: 8 },
        ],
      },
      {
        name: 'DevOps & Cloud Engineering',
        description: 'Terraform, Docker, Kubernetes, AWS architecture, and automated CI/CD pipeline automation.',
        createdBy: userMap.devon._id,
        members: [userMap.devon._id, userMap.liam._id, userMap.amara._id, userMap.sarah._id],
        messages: [
          { sender: userMap.devon, text: "Welcome! Drop your cloud infrastructure questions, Terraform snippets, and Kubernetes gotchas here.", days: 6, hours: 12 },
          { sender: userMap.liam, text: "Hey Devon! Quick question on Docker multi-stage builds for Go: is `scratch` or `alpine` better for production binaries?", days: 6, hours: 8 },
          { sender: userMap.devon, text: "`scratch` gives you the smallest possible attack surface and ~15MB image size, but make sure to copy SSL certificates (`ca-certificates.crt`) if your binary makes outbound HTTPS requests.", days: 6, hours: 6 },
          { sender: userMap.amara, text: "Also, never run the container as root! Adding a non-root user directive in Dockerfile prevents container escape vulnerabilities.", days: 5, hours: 14 },
          { sender: userMap.liam, text: "Good catch Amara. Just updated our Dockerfile with a dedicated `appuser`.", days: 4, hours: 10 },
          { sender: userMap.sarah, text: "Anyone had issues with AWS Secrets Manager rate limits during deployment surges?", days: 3, hours: 18 },
          { sender: userMap.devon, text: "Yes! Cache the secrets locally in memory with a 15-minute TTL rather than fetching on every Lambda invocation or container startup.", days: 2, hours: 13 },
          { sender: userMap.devon, text: "CloudGuard sandbox environment is ready for testing. IAM policies are locked down.", days: 0, hours: 6 },
        ],
      },
      {
        name: 'DSA & Interview Prep Room',
        description: 'Daily algorithmic problem solving, pattern memorization, and peer mock coding interviews.',
        createdBy: userMap.alex._id,
        members: [userMap.alex._id, userMap.hassan._id, userMap.priya._id, userMap.david._id],
        messages: [
          { sender: userMap.alex, text: "Welcome to DSA Prep! Goal: 1 problem a day, no exceptions. Let's conquer technical interviews together.", days: 7, hours: 14 },
          { sender: userMap.hassan, text: "Today's problem: LeetCode 200 (Number of Islands). BFS or DFS?", days: 7, hours: 10 },
          { sender: userMap.priya, text: "DFS is much fewer lines of code in Python with recursion, but watch out for recursion stack depth on massive 1000x1000 grids.", days: 7, hours: 8 },
          { sender: userMap.david, text: "In Dart/JavaScript, I usually prefer iterative BFS with a queue to avoid call stack limits.", days: 6, hours: 15 },
          { sender: userMap.alex, text: "Who wants to do a 45-min mock interview this Saturday at 2 PM?", days: 4, hours: 9 },
          { sender: userMap.hassan, text: "Count me in! I'll prepare a Graph / Topological Sort question.", days: 3, hours: 17 },
          { sender: userMap.priya, text: "I can shadow and provide feedback on communication clarity!", days: 2, hours: 11 },
          { sender: userMap.alex, text: "Awesome, scheduled! Let's get these offers 🚀", days: 0, hours: 5 },
        ],
      },
    ];

    for (const rData of roomsData) {
      const room = await Room.create({
        name: rData.name,
        description: rData.description,
        type: 'study_room',
        createdBy: rData.createdBy,
        members: rData.members,
      });

      for (const mData of rData.messages) {
        await Message.create({
          sender: mData.sender._id,
          room: room._id,
          content: mData.text,
          createdAt: daysAgo(mData.days, mData.hours),
        });
      }
    }
    console.log(`✓ Seeded ${roomsData.length} study rooms with active message histories`);

    // ── 7. Seed Community Feed Posts, Comments & Upvotes ──────────────────────
    console.log('\n[8/8] Seeding Community Feed Posts, Comments & Upvotes...');
    const postsData = [
      {
        author: userMap.sarah,
        content: "Top 5 common mistakes I see candidates make in System Design interviews (and how to avoid them):\n\n1. Jumping straight into database schemas before clarifying throughput requirements (QPS) and read/write ratios.\n2. Forgetting data replication lag when proposing multi-region Active-Active setups.\n3. Using Redis everywhere without calculating memory footprint vs cost.\n4. Ignoring failure modes: What happens when your message broker crashes or the network partitions?\n5. Not driving the conversation. The interviewer wants to collaborate with an engineer, not interrogate a textbook.\n\nTake 5 minutes upfront to define functional & non-functional requirements. It changes the whole tone of the interview!",
        tags: ['system-design', 'career-advice', 'webdev', 'architecture'],
        days: 12,
        upvoters: [userMap.alex, userMap.liam, userMap.marcus, userMap.devon, userMap.hassan, userMap.priya, userMap.maya, userMap.elena],
        comments: [
          { author: userMap.alex, text: "Point #1 is so true. I used to start diagramming immediately until my mentor pointed out I didn't even ask about expected concurrent users.", days: 11 },
          { author: userMap.liam, text: "Calculating QPS upfront makes capacity estimation so much easier. Great summary Sarah!", days: 11 },
          { author: userMap.devon, text: "Point #4 is what separates senior engineers from juniors. Always design for graceful degradation.", days: 10 },
        ],
      },
      {
        author: userMap.marcus,
        content: "For everyone asking how to break into Applied ML in 2026: focus on data engineering and eval pipelines before chasing foundation model training.\n\nIn industry, 80% of your time is spent on clean dataset curation, structured evaluation benchmarks (Ragas / LangSmith), and minimizing inference latency. A junior engineer who knows how to write fast PyTorch DataLoader pipelines and measure regression metrics is 10x more valuable than someone who just prompted an API.",
        tags: ['machine-learning', 'python', 'career-advice', 'data-science'],
        days: 10,
        upvoters: [userMap.priya, userMap.maya, userMap.sarah, userMap.devon, userMap.liam, userMap.alex],
        comments: [
          { author: userMap.priya, text: "This advice is gold. Building evaluation frameworks helped me understand model failure modes much deeper.", days: 9 },
          { author: userMap.maya, text: "Completely agree Marcus. Clean data and reproducible pipelines beat complex architectures every time.", days: 9 },
        ],
      },
      {
        author: userMap.elena,
        content: "PSA: Why your React UI doesn't look like the Figma mockups. 3 practical design token rules that solved this for our team:\n\n1. Standardize 8pt spacing units across both Figma and CSS variables (`--space-1: 0.25rem`, `--space-4: 1rem`, etc.).\n2. Never use arbitrary hex colors in component files. Use semantic naming (`--color-surface`, `--color-primary-hover`).\n3. Lock down font line-heights! A text element with `line-height: 1.5` renders very differently from default browser baselines.\n\nBridge the gap between design and engineering!",
        tags: ['design-systems', 'figma', 'react', 'webdev'],
        days: 9,
        upvoters: [userMap.chloe, userMap.alex, userMap.sarah, userMap.david, userMap.hassan],
        comments: [
          { author: userMap.chloe, text: "Semantic color tokens made our dark mode implementation take literally 15 minutes. Highly recommended!", days: 8 },
          { author: userMap.alex, text: "We just adopted this on the DevFlow project and our components feel so much more unified.", days: 8 },
        ],
      },
      {
        author: userMap.liam,
        content: "Quick DevOps tip: Multi-stage Docker builds reduced our Go backend container image from 480MB down to just 18MB! 🚀\n\nBy compiling the binary in a `golang:1.23-alpine` builder stage and copying only the compiled executable into a minimal `scratch` or `alpine` production image, we cut build upload times in CI by 70% and drastically reduced vulnerability CVE counts.",
        tags: ['docker', 'devops', 'golang', 'backend'],
        days: 8,
        upvoters: [userMap.devon, userMap.amara, userMap.sarah, userMap.hassan],
        comments: [
          { author: userMap.devon, text: "Awesome! Make sure you also include `USER nonroot` so the binary doesn't run with root privileges inside the container.", days: 7 },
          { author: userMap.amara, text: "Minimal attack surfaces make security audits so much smoother. Love to see this.", days: 7 },
        ],
      },
      {
        author: userMap.alex,
        content: "Finally wrapped up my full-stack Markdown note-taking app with real-time sync using WebSockets! 📝\n\nKey features:\n- Optimistic UI updates with instant local typing feedback\n- Operational transform conflict resolution when two devices edit simultaneously\n- Automated dark mode with smooth CSS transitions\n\nBuilding this taught me so much about race conditions and client-side caching. What was your most impactful portfolio project?",
        tags: ['react', 'webdev', 'fullstack', 'projects'],
        days: 7,
        upvoters: [userMap.sarah, userMap.elena, userMap.hassan, userMap.chloe, userMap.priya],
        comments: [
          { author: userMap.sarah, text: "Operational transforms are notoriously tricky to get right. Huge kudos Alex!", days: 6 },
          { author: userMap.hassan, text: "Looks amazing! Are you planning to write a blog post breakdown on the WebSocket architecture?", days: 6 },
        ],
      },
      {
        author: userMap.maya,
        content: "Curated list of 10 free, realistic datasets for your data analytics & SQL portfolio (that AREN'T the Titanic or Iris dataset!):\n\n1. Brazilian E-Commerce public dataset by Olist (100k real orders, reviews, geolocation)\n2. NYC Taxi & Limousine Commission Trip Data (massive time-series parquet files)\n3. Spotify 1M Playlist Dataset (clustering & recommendation systems)\n4. US Healthcare Inpatient Quality Indicators\n5. Open Food Facts Nutrition Database (multi-language cleaning practice)\n\nRecruiters want to see you clean messy, missing real-world data!",
        tags: ['sql', 'data-analytics', 'resources', 'python'],
        days: 6,
        upvoters: [userMap.priya, userMap.marcus, userMap.alex, userMap.sarah, userMap.hassan, userMap.david],
        comments: [
          { author: userMap.priya, text: "Bookmarking the Olist dataset! The multi-table schema looks great for complex SQL JOINs and cohort retention queries.", days: 5 },
          { author: userMap.marcus, text: "Great list Maya. The NYC Taxi dataset is also great for practicing Polars / DuckDB out-of-core queries.", days: 5 },
        ],
      },
      {
        author: userMap.amara,
        content: "Friendly reminder to check your CORS configuration and rate limiters! 🔒\n\nWhile reviewing open-source student apps this week, I noticed several APIs configured with `origin: '*'` alongside `credentials: true`, which allows malicious third-party origins to execute authenticated requests via stored browser cookies.\n\nAlways whitelist specific trusted domains in production and add strict rate limits on `/api/auth/login` to prevent credential stuffing.",
        tags: ['cybersecurity', 'security', 'webdev', 'backend'],
        days: 5,
        upvoters: [userMap.sarah, userMap.devon, userMap.liam, userMap.alex, userMap.hassan],
        comments: [
          { author: userMap.sarah, text: "Crucial reminder. Setting secure HTTP headers with `helmet` and `express-rate-limit` should be step 1 of any backend project.", days: 4 },
          { author: userMap.hassan, text: "Just patched our team project CORS settings based on this. Thanks Amara!", days: 4 },
        ],
      },
      {
        author: userMap.david,
        content: "Flutter vs React Native in 2026: Having shipped apps in both platforms this year, here is my honest take:\n\n- Flutter: unmatched UI rendering consistency across iOS and Android (thanks to Skia/Impeller), incredible animation developer experience, but slightly larger app binary sizes.\n- React Native: seamless access to native platform modules, easier ramp-up for React web developers, and great OTA update support with Expo.\n\nWhich mobile framework do you prefer for new side projects?",
        tags: ['flutter', 'react-native', 'mobile', 'webdev'],
        days: 5,
        upvoters: [userMap.alex, userMap.elena, userMap.chloe, userMap.hassan],
        comments: [
          { author: userMap.chloe, text: "For fast MVPs, Expo React Native has been amazing for sharing components with our Next.js web app.", days: 4 },
          { author: userMap.alex, text: "The Flutter Impeller engine rendering at consistent 120Hz on ProMotion displays is hard to beat though!", days: 4 },
        ],
      },
      {
        author: userMap.priya,
        content: "Looking for 1-2 study partners to tackle the Kaggle NLP text classification competition starting this weekend! 🤝\n\nWe will be building an ensemble pipeline with DeBERTa-v3 and LLM embedding fine-tuning. If you know basic Python and want to collaborate via GitHub, reply below or message me in the ML study room!",
        tags: ['study-group', 'machine-learning', 'python', 'hackathon'],
        days: 4,
        upvoters: [userMap.marcus, userMap.maya, userMap.alex, userMap.hassan],
        comments: [
          { author: userMap.maya, text: "I'd love to join for feature engineering and EDA analysis!", days: 3 },
          { author: userMap.marcus, text: "Feel free to ping me if your team needs help configuring multi-GPU distributed training.", days: 3 },
          { author: userMap.hassan, text: "I'm interested too! Just sent you a connection request.", days: 3 },
        ],
      },
      {
        author: userMap.hassan,
        content: "Solved my 50th LeetCode problem today! 🎉\n\nIt took 2 months of consistent daily practice (1 problem every single morning before class). Recursive tree traversals and dynamic programming memoization finally clicked for me this week.\n\nConsistency > intensity. Keep grinding everyone!",
        tags: ['dsa', 'motivation', 'algorithms', 'career-advice'],
        days: 3,
        upvoters: [userMap.alex, userMap.sarah, userMap.priya, userMap.david, userMap.elena, userMap.maya],
        comments: [
          { author: userMap.alex, text: "Huge milestone Hassan! The first 50 are the hardest. Next 50 will feel much more natural.", days: 2 },
          { author: userMap.sarah, text: "Well done! That daily discipline will pay massive dividends in your technical interviews.", days: 2 },
        ],
      },
      {
        author: userMap.chloe,
        content: "First time experimenting with custom GLSL fragment shaders in React Three Fiber! 🎨\n\nThe vector math was intimidating at first, but creating interactive raymarched lighting on the 3D canvas is ridiculously satisfying.\n\nSharing my starter code sandbox in the comments if anyone wants to experiment with interactive 3D web graphics!",
        tags: ['creative-coding', 'threejs', 'webgl', 'react'],
        days: 3,
        upvoters: [userMap.elena, userMap.alex, userMap.david, userMap.sarah],
        comments: [
          { author: userMap.elena, text: "The shader distortion effect on mouse move looks incredible Chloe! Bookmarked.", days: 2 },
        ],
      },
      {
        author: userMap.devon,
        content: "Infrastructure as Code isn't optional anymore. If you build backend APIs, learn at least basic Terraform syntax.\n\nBeing able to define your PostgreSQL database, S3 asset buckets, and VPC network in version-controlled declarative code makes environments 100% reproducible in minutes. No more manual clicking in cloud web consoles!",
        tags: ['aws', 'devops', 'cloud', 'architecture'],
        days: 2,
        upvoters: [userMap.liam, userMap.sarah, userMap.amara, userMap.alex],
        comments: [
          { author: userMap.liam, text: "Setting up staging and production with Terraform workspaces saved our team hours of manual config.", days: 1 },
        ],
      },
      {
        author: userMap.sarah,
        content: "Hosting a free 45-minute live mock technical interview & resume review session next Tuesday at 6 PM UTC in the Frontend study room! 🎓\n\nWe will cover:\n- Live coding an interactive React component with edge case handling\n- System design walkthrough of a real-time collaborative tool\n- Resume bullet point optimization using the Google XYZ formula\n\nDrop a comment with your target role to reserve a slot!",
        tags: ['mentorship', 'career-advice', 'study-group', 'webdev'],
        days: 1,
        upvoters: [userMap.alex, userMap.hassan, userMap.priya, userMap.david, userMap.elena, userMap.maya, userMap.liam],
        comments: [
          { author: userMap.alex, text: "Would love a slot! Targeting Junior Frontend / Fullstack roles for summer 2026.", days: 1 },
          { author: userMap.hassan, text: "I'd love to participate for MERN stack review! See you Tuesday.", days: 1 },
          { author: userMap.priya, text: "Count me in for the resume review portion!", days: 0 },
        ],
      },
      {
        author: userMap.alex,
        content: "What are recruiters actually looking for on junior developer GitHub profiles?\n\nAfter getting feedback from 3 tech leads, here were the top 3 items:\n\n1. A clear README with live demo link, architecture diagram, and setup instructions.\n2. Clean commit history with descriptive messages (not 'update', 'fix bug', 'test').\n3. Evidence of testing (unit tests or integration tests) — shows you think about reliability.\n\nQuality over quantity every single time.",
        tags: ['career-advice', 'webdev', 'resources', 'mentorship'],
        days: 1,
        upvoters: [userMap.sarah, userMap.maya, userMap.priya, userMap.elena, userMap.hassan],
        comments: [
          { author: userMap.sarah, text: "100% spot on Alex. A single polished project with automated tests stands out infinitely more than 10 tutorial clones.", days: 0 },
        ],
      },
    ];

    for (const pData of postsData) {
      const post = await Post.create({
        author: pData.author._id,
        content: pData.content,
        tags: pData.tags,
        upvotes: pData.upvoters.map((u) => u._id),
        commentCount: pData.comments.length,
        createdAt: daysAgo(pData.days, 4),
      });

      for (const cData of pData.comments) {
        await Comment.create({
          post: post._id,
          author: cData.author._id,
          content: cData.text,
          createdAt: daysAgo(cData.days, 2),
        });
      }
    }
    console.log(`✓ Seeded ${postsData.length} active community posts with comments and upvotes`);

    // ── 8. Seed Match Connections & Badges ─────────────────────────────────────
    console.log('\n[8.1] Seeding Peer Matching Records...');
    const matchPairs = [
      {
        userA: userMap.sarah._id,
        userB: userMap.alex._id,
        status: 'connected',
        score: 94,
        reason: 'Complementary Full-Stack React & Node skills. Sarah offers senior system design mentorship while Alex brings active frontend motivation.',
      },
      {
        userA: userMap.marcus._id,
        userB: userMap.priya._id,
        status: 'connected',
        score: 96,
        reason: 'Shared Python & Machine Learning focus. Marcus provides expert PyTorch and Kaggle research guidance for Priya NLP learning goals.',
      },
      {
        userA: userMap.devon._id,
        userB: userMap.liam._id,
        status: 'connected',
        score: 89,
        reason: 'Strong DevOps & Cloud synergy. Devon AWS and Terraform architecture pairs perfectly with Liam Go microservices and Kubernetes development.',
      },
      {
        userA: userMap.elena._id,
        userB: userMap.chloe._id,
        status: 'connected',
        score: 91,
        reason: 'Aligned Design & Creative Frontend interests. Elena UI/UX Figma design system expertise complements Chloe Three.js interactive 3D web work.',
      },
      {
        userA: userMap.alex._id,
        userB: userMap.hassan._id,
        status: 'connected',
        score: 88,
        reason: 'Both actively practicing Data Structures & Algorithms and building full-stack JavaScript applications.',
      },
      {
        userA: userMap.maya._id,
        userB: userMap.priya._id,
        status: 'connected',
        score: 87,
        reason: 'Complementary Data Science & Analytics expertise in SQL, Pandas, and machine learning pipelines.',
      },
    ];

    for (const m of matchPairs) {
      const [uA, uB] = [m.userA.toString(), m.userB.toString()].sort();
      await Match.findOneAndUpdate(
        { userA: uA, userB: uB },
        { userA: uA, userB: uB, status: m.status, matchScore: m.score, matchReason: m.reason },
        { upsert: true, new: true }
      );
    }
    console.log(`✓ Seeded ${matchPairs.length} peer match connections`);

    // ── 9. Award Gamification Badges & Finalize Ranks ──────────────────────────
    console.log('\n[8.2] Calculating & Awarding Badges to Seed Users...');
    for (const key of Object.keys(userMap)) {
      const u = userMap[key];
      await checkAndAwardBadges(u._id);
    }

    // Print summary table
    const finalUsers = await User.find({ email: { $regex: /@demo\.skillsync\.io$/i } })
      .populate('badges')
      .sort({ points: -1 });

    console.log('\n================================================================================');
    console.log('🎉 SKILLSYNC DATABASE SEEDED SUCCESSFULLY!');
    console.log('================================================================================');
    console.log(`Global Seed Password for all accounts:  ${SEED_PASSWORD}\n`);
    console.log('Rank | Name            | Role    | Points | Badges | Email');
    console.log('-----+-----------------+---------+--------+--------+-----------------------------------');
    finalUsers.forEach((u, i) => {
      const rank = `#${i + 1}`.padEnd(4);
      const name = u.name.padEnd(15);
      const role = u.role.padEnd(7);
      const pts = `${u.points} pts`.padEnd(6);
      const badges = `${u.badges?.length || 0} badges`.padEnd(8);
      console.log(`${rank} | ${name} | ${role} | ${pts} | ${badges} | ${u.email}`);
    });
    console.log('================================================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed with error:\n', error);
    process.exit(1);
  }
};

runSeed();
