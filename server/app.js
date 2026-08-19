const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const userRoutes = require('./routes/userRoutes');
const matchRoutes = require('./routes/matchRoutes');
const chatRoutes = require('./routes/chatRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const roadmapRoutes = require('./routes/roadmapRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const postRoutes = require('./routes/postRoutes');
const gamificationRoutes = require('./routes/gamificationRoutes');
const resumeRoutes = require('./routes/resumeRoutes');

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/resume', resumeRoutes);

// ─── Centralised error handler (must be last) ─────────────────────────────────
app.use(errorHandler);

module.exports = app;
