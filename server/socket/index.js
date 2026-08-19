const Message = require('../models/Message');
const Room = require('../models/Room');

/**
 * Registers all Socket.io event handlers.
 * @param {import('socket.io').Server} io
 */
const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // Each user joins their own private room for targeted DMs
    socket.join(`user:${userId}`);

    // ── Direct Messages ───────────────────────────────────────
    socket.on('send_direct_message', async ({ receiverId, content }) => {
      if (!receiverId || !content?.trim()) return;

      try {
        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          content: content.trim(),
        });

        const populated = await message.populate('sender', 'name');

        // Emit to receiver if online
        io.to(`user:${receiverId}`).emit('new_direct_message', populated);
        // Echo back to sender (for multi-tab support)
        socket.emit('new_direct_message', populated);
      } catch {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ── Room Messages ─────────────────────────────────────────
    socket.on('send_room_message', async ({ roomId, content }) => {
      if (!roomId || !content?.trim()) return;

      try {
        // Verify sender is a room member
        const room = await Room.findById(roomId);
        if (!room || !room.members.map(String).includes(userId)) {
          return socket.emit('error', { message: 'Not a member of this room' });
        }

        const message = await Message.create({
          sender: userId,
          room: roomId,
          content: content.trim(),
        });

        const populated = await message.populate('sender', 'name');

        // Emit to everyone in the socket room
        io.to(`room:${roomId}`).emit('new_room_message', populated);
      } catch {
        socket.emit('error', { message: 'Failed to send room message' });
      }
    });

    // ── Join / leave socket rooms ─────────────────────────────
    socket.on('join_room', async ({ roomId }) => {
      if (!roomId) return;
      const room = await Room.findById(roomId).catch(() => null);
      if (room && room.members.map(String).includes(userId)) {
        socket.join(`room:${roomId}`);
      }
    });

    socket.on('leave_room', ({ roomId }) => {
      if (roomId) socket.leave(`room:${roomId}`);
    });

    // ── Typing indicators ─────────────────────────────────────
    socket.on('typing', ({ receiverId, roomId }) => {
      const payload = { userId, name: socket.user.name };
      if (receiverId) io.to(`user:${receiverId}`).emit('typing', payload);
      if (roomId) socket.to(`room:${roomId}`).emit('typing', { ...payload, roomId });
    });

    socket.on('stop_typing', ({ receiverId, roomId }) => {
      const payload = { userId };
      if (receiverId) io.to(`user:${receiverId}`).emit('stop_typing', payload);
      if (roomId) socket.to(`room:${roomId}`).emit('stop_typing', { ...payload, roomId });
    });

    socket.on('disconnect', () => {
      // No-op — socket.io auto-cleans the rooms
    });
  });
};

module.exports = registerSocketHandlers;
