require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const socketAuth = require('./middleware/socketAuth');
const registerSocketHandlers = require('./socket/index');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  // ── Wrap Express with an HTTP server ─────────────────────────
  const httpServer = http.createServer(app);

  // ── Socket.io ────────────────────────────────────────────────
  const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:3000',
  ].filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(socketAuth);
  registerSocketHandlers(io);

  // Expose io instance for controllers that need to emit
  app.set('io', io);

  httpServer.listen(PORT, () => {
    console.log(`[server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
};

startServer();
