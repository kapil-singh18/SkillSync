require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const morgan = require('morgan');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const healthRouter = require('./routes/health');
const authRouter = require('./routes/authRoutes');
const userRouter = require('./routes/userRoutes');

// ── Database ──────────────────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

app.use('/api', generalLimiter);

app.use(mongoSanitize());
app.use(hpp());

// ── Request logging (dev only) ────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Centralized error handler ─────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
