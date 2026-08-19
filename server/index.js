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
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
