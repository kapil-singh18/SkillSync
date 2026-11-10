/**
 * socket/index.js
 *
 * Attaches Socket.IO to the HTTP server.
 * Handles: auth middleware, presence tracking, DMs, rooms, typing, rate limiting.
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Connection = require('../models/Connection');
const Conversation = require('../models/Conversation');
const Room = require('../models/Room');
const Message = require('../models/Message');

// userId (string) → connected socket count
const onlineMap = new Map();

// per-socket message rate limiting
// socketId → { count, resetAt, violations }
const rateLimitMap = new Map();

const RATE_WINDOW_MS = 10 * 1000;
const RATE_MAX = 20;
const RATE_VIOLATIONS_BEFORE_DISCONNECT = 5;

// Public user fields for responses (no email, no tokens)
const USER_SELECT = 'name role headline avatarUrl';

// ── Helpers ───────────────────────────────────────────────────────────────────

const ack = (cb, payload) => { if (typeof cb === 'function') cb(payload); };

const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(String(id));

const sanitizeText = (t) => (typeof t === 'string' ? t.trim().slice(0, 2000) : '');

/** Returns true and acks error if rate limit exceeded. */
const checkRateLimit = (socket, cb) => {
  const now = Date.now();
  let rl = rateLimitMap.get(socket.id) || { count: 0, resetAt: now + RATE_WINDOW_MS, violations: 0 };

  if (now > rl.resetAt) {
    rl = { count: 0, resetAt: now + RATE_WINDOW_MS, violations: rl.violations };
  }

  rl.count++;
  rateLimitMap.set(socket.id, rl);

  if (rl.count > RATE_MAX) {
    rl.violations++;
    rateLimitMap.set(socket.id, rl);
    ack(cb, { ok: false, error: 'rate_limited' });
    if (rl.violations >= RATE_VIOLATIONS_BEFORE_DISCONNECT) {
      socket.disconnect(true);
    }
    return true;
  }
  return false;
};

/** Emit presence update to accepted connections and current room members. */
const broadcastPresence = async (io, userId, online) => {
  try {
    const connections = await Connection.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'accepted',
    }).select('requester recipient').lean();

    const peerIds = connections.map((c) =>
      String(c.requester) === String(userId) ? String(c.recipient) : String(c.requester)
    );

    const payload = { userId: String(userId), online };
    peerIds.forEach((pid) => io.to(`user:${pid}`).emit('presence:update', payload));

    // Also emit to any room this user is in (they're already in those socket rooms)
    // The rooms they joined emit to channel room:<id>, handled by socket room broadcast
  } catch {
    // Non-fatal
  }
};

/** Sort two ids to form a canonical pair. */
const sortedPair = (a, b) => [String(a), String(b)].sort();

// ── Main export ───────────────────────────────────────────────────────────────

const _createSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
    // Both transports so it works behind proxies (Render etc.)
    transports: ['websocket', 'polling'],
  });

  // ── Auth middleware ──────────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('AUTH_REQUIRED'));

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return next(new Error('INVALID_TOKEN'));
      }

      const user = await User.findById(decoded.id).select('name role isActive isEmailVerified');
      if (!user || !user.isActive || !user.isEmailVerified) {
        return next(new Error('UNAUTHORIZED'));
      }

      socket.user = user;
      next();
    } catch {
      next(new Error('AUTH_ERROR'));
    }
  });

  // ── Connection handler ───────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = String(socket.user._id);

    // Join personal channel
    socket.join(`user:${userId}`);

    // Presence tracking
    const prevCount = onlineMap.get(userId) || 0;
    onlineMap.set(userId, prevCount + 1);
    if (prevCount === 0) {
      broadcastPresence(io, userId, true);
    }

    // ── room:join ─────────────────────────────────────────────────────────────
    socket.on('room:join', async ({ roomId } = {}, cb) => {
      try {
        if (!isValidObjectId(roomId)) return ack(cb, { ok: false, error: 'invalid_room_id' });

        const room = await Room.findById(roomId).lean();
        if (!room || room.isArchived) return ack(cb, { ok: false, error: 'room_not_found' });

        const isMember = room.members.some((m) => String(m.user) === userId);
        if (!isMember) return ack(cb, { ok: false, error: 'not_a_member' });

        socket.join(`room:${roomId}`);
        ack(cb, { ok: true });
      } catch {
        ack(cb, { ok: false, error: 'server_error' });
      }
    });

    // ── room:leave ────────────────────────────────────────────────────────────
    socket.on('room:leave', ({ roomId } = {}, cb) => {
      if (isValidObjectId(roomId)) socket.leave(`room:${roomId}`);
      ack(cb, { ok: true });
    });

    // ── dm:send ───────────────────────────────────────────────────────────────
    socket.on('dm:send', async ({ toUserId, text, clientId } = {}, cb) => {
      try {
        if (checkRateLimit(socket, cb)) return;

        if (!isValidObjectId(toUserId)) return ack(cb, { ok: false, error: 'invalid_user_id' });
        const cleanText = sanitizeText(text);
        if (!cleanText) return ack(cb, { ok: false, error: 'empty_message' });

        // Check accepted connection in either direction
        const conn = await Connection.findOne({
          $or: [
            { requester: userId, recipient: toUserId, status: 'accepted' },
            { requester: toUserId, recipient: userId, status: 'accepted' },
          ],
        }).lean();
        if (!conn) return ack(cb, { ok: false, error: 'no_connection' });

        // Deduplication by clientId
        if (clientId) {
          const dup = await Message.findOne({ sender: userId, clientId: String(clientId) }).lean();
          if (dup) {
            return ack(cb, { ok: true, data: dup, duplicate: true });
          }
        }

        const [pA, pB] = sortedPair(userId, toUserId);

        // Find or create conversation
        let conv = await Conversation.findOneAndUpdate(
          { participants: [pA, pB] },
          { $setOnInsert: { participants: [pA, pB] } },
          { upsert: true, new: true }
        );

        // Save message
        const msg = await Message.create({
          conversation: conv._id,
          sender: userId,
          text: cleanText,
          clientId: clientId ? String(clientId).slice(0, 100) : undefined,
        });

        // Update conversation lastMessage + unread
        const preview = cleanText.slice(0, 100);
        const unreadKey = `unread.${toUserId}`;
        await Conversation.updateOne(
          { _id: conv._id },
          {
            $set: { lastMessage: { text: preview, sender: userId, createdAt: msg.createdAt } },
            $inc: { [unreadKey]: 1 },
          }
        );

        const populated = await msg.populate('sender', USER_SELECT);
        const payload = { message: populated, conversationId: String(conv._id) };

        // Emit to both personal channels
        io.to(`user:${userId}`).to(`user:${toUserId}`).emit('dm:new', payload);

        // TODO(Module 9 — Notifications): notify recipient of new DM

        ack(cb, { ok: true, data: populated });
      } catch {
        ack(cb, { ok: false, error: 'server_error' });
      }
    });

    // ── room:send ─────────────────────────────────────────────────────────────
    socket.on('room:send', async ({ roomId, text, clientId } = {}, cb) => {
      try {
        if (checkRateLimit(socket, cb)) return;

        if (!isValidObjectId(roomId)) return ack(cb, { ok: false, error: 'invalid_room_id' });
        const cleanText = sanitizeText(text);
        if (!cleanText) return ack(cb, { ok: false, error: 'empty_message' });

        // Re-verify membership
        const room = await Room.findById(roomId).lean();
        if (!room || room.isArchived) return ack(cb, { ok: false, error: 'room_not_found' });
        const isMember = room.members.some((m) => String(m.user) === userId);
        if (!isMember) return ack(cb, { ok: false, error: 'not_a_member' });

        // Deduplication
        if (clientId) {
          const dup = await Message.findOne({ sender: userId, clientId: String(clientId) }).lean();
          if (dup) return ack(cb, { ok: true, data: dup, duplicate: true });
        }

        const msg = await Message.create({
          room: roomId,
          sender: userId,
          text: cleanText,
          clientId: clientId ? String(clientId).slice(0, 100) : undefined,
        });

        await Room.updateOne({ _id: roomId }, { $set: { lastMessageAt: msg.createdAt } });

        const populated = await msg.populate('sender', USER_SELECT);
        const payload = { message: populated, roomId };

        io.to(`room:${roomId}`).emit('room:new', payload);

        // TODO(Module 9 — Notifications): notify room members who are offline

        ack(cb, { ok: true, data: populated });
      } catch {
        ack(cb, { ok: false, error: 'server_error' });
      }
    });

    // ── typing ────────────────────────────────────────────────────────────────
    socket.on('typing', async ({ scope, targetId, isTyping } = {}) => {
      try {
        if (!['dm', 'room'].includes(scope)) return;
        if (!isValidObjectId(targetId)) return;

        const payload = { userId, isTyping: Boolean(isTyping) };

        if (scope === 'dm') {
          // Verify connection
          const conn = await Connection.findOne({
            $or: [
              { requester: userId, recipient: targetId, status: 'accepted' },
              { requester: targetId, recipient: userId, status: 'accepted' },
            ],
          }).lean();
          if (!conn) return;
          socket.to(`user:${targetId}`).emit('typing', { scope: 'dm', fromUserId: userId, isTyping: Boolean(isTyping) });
        } else {
          // Verify room membership
          const room = await Room.findById(targetId).lean();
          if (!room) return;
          const isMember = room.members.some((m) => String(m.user) === userId);
          if (!isMember) return;
          socket.to(`room:${targetId}`).emit('typing', { scope: 'room', roomId: targetId, fromUserId: userId, isTyping: Boolean(isTyping) });
        }
      } catch {
        // non-fatal
      }
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      rateLimitMap.delete(socket.id);

      const count = (onlineMap.get(userId) || 1) - 1;
      if (count <= 0) {
        onlineMap.delete(userId);
        broadcastPresence(io, userId, false);
      } else {
        onlineMap.set(userId, count);
      }
    });
  });

  return io;
};

/** Helpers exposed to REST controllers */
const getOnlineMap = () => onlineMap;

let _io = null;
const getIo = () => _io;

// Store io reference after init
const _initSocket = (httpServer) => {
  _io = _createSocketServer(httpServer);
  return _io;
};

module.exports = { initSocket: _initSocket, getOnlineMap, getIo };

