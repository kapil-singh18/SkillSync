const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

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

// ─── Trust proxy (for rate limiting when deployed behind reverse proxies like Render)
app.set('trust proxy', 1);

// ─── 1. Security Headers (Helmet) ─────────────────────────────────────────────
app.use(helmet());

// ─── 2. CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests or allowed origin matches
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// ─── 3. Rate Limiting ─────────────────────────────────────────────────────────
// Global limiter: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api', generalLimiter);

// Strict limiter for auth endpoints: 5 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login/register attempts from this IP, please try again after 15 minutes.',
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── 4. Request Body Parsers ──────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── 5. Data Sanitization & Parameter Pollution Prevention ───────────────────
app.use(mongoSanitize());
app.use(hpp());

// ─── 6. API Routes ────────────────────────────────────────────────────────────
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

// ─── 7. Centralised error handler (must be last) ──────────────────────────────
app.use(errorHandler);

module.exports = app;
