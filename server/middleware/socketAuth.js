const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authenticates a Socket.io connection using the JWT passed in handshake auth.
 * Sets socket.user on success; calls next(err) on failure.
 */
const socketAuth = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: no token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new Error('Authentication error: user not found'));
    }

    socket.user = user;
    next();
  } catch {
    next(new Error('Authentication error: invalid token'));
  }
};

module.exports = socketAuth;
