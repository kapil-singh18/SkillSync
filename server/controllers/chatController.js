/**
 * controllers/chatController.js
 *
 * REST endpoints for /api/chat:
 * - Conversations (DMs)
 * - Rooms
 * - Messages (paginated, delete)
 * - Presence
 */

const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const Conversation = require('../models/Conversation');
const Room = require('../models/Room');
const Message = require('../models/Message');
const Connection = require('../models/Connection');
const User = require('../models/User');
const { getOnlineMap } = require('../socket');

const USER_PUBLIC = 'name role headline avatarUrl';
const MAX_ROOMS_PER_USER = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────

const assertValidId = (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: 'Invalid ID.' });
    return false;
  }
  return true;
};

const hasAcceptedConnection = async (userA, userB) => {
  const conn = await Connection.findOne({
    $or: [
      { requester: userA, recipient: userB, status: 'accepted' },
      { requester: userB, recipient: userA, status: 'accepted' },
    ],
  }).lean();
  return !!conn;
};

const sortedPair = (a, b) => [String(a), String(b)].sort();

// ── Conversations ─────────────────────────────────────────────────────────────

exports.getConversations = asyncHandler(async (req, res) => {
  const userId = String(req.user._id);

  const convs = await Conversation.find({ participants: userId })
    .sort({ updatedAt: -1 })
    .lean();

  // Populate the other participant
  const result = await Promise.all(
    convs.map(async (conv) => {
      const otherId = conv.participants.find((p) => String(p) !== userId);
      const other = await User.findById(otherId).select(USER_PUBLIC).lean();
      return {
        _id: conv._id,
        other,
        lastMessage: conv.lastMessage,
        unread: conv.unread?.get ? conv.unread.get(userId) || 0 : (conv.unread?.[userId] || 0),
        updatedAt: conv.updatedAt,
      };
    })
  );

  return res.status(200).json({ success: true, conversations: result });
});

exports.getMessages = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const me = req.user;
  const { before, limit: rawLimit } = req.query;

  if (!assertValidId(userId, res)) return;

  const limit = Math.min(50, Math.max(1, parseInt(rawLimit, 10) || 30));

  if (!(await hasAcceptedConnection(me._id, userId))) {
    return res.status(403).json({ success: false, message: 'No accepted connection with this user.' });
  }

  const [pA, pB] = sortedPair(me._id, userId);
  const conv = await Conversation.findOne({ participants: [pA, pB] }).lean();
  if (!conv) return res.status(200).json({ success: true, messages: [], hasMore: false });

  const filter = { conversation: conv._id, deletedAt: null };
  if (before && mongoose.Types.ObjectId.isValid(before)) {
    const pivot = await Message.findById(before).lean();
    if (pivot) filter.createdAt = { $lt: pivot.createdAt };
  }

  const messages = await Message.find(filter)
    .populate('sender', USER_PUBLIC)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();

  // Sanitize deleted messages — blank text, keep metadata
  const safe = messages.map((m) => ({
    ...m,
    text: m.deletedAt ? '' : m.text,
    deleted: !!m.deletedAt,
  }));

  return res.status(200).json({ success: true, messages: safe.reverse(), hasMore, conversationId: String(conv._id) });
});

exports.markRead = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!assertValidId(userId, res)) return;

  const [pA, pB] = sortedPair(req.user._id, userId);
  await Conversation.updateOne(
    { participants: [pA, pB] },
    { $set: { [`unread.${req.user._id}`]: 0 } }
  );

  return res.status(200).json({ success: true });
});

// ── Rooms ─────────────────────────────────────────────────────────────────────

exports.getMyRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({
    'members.user': req.user._id,
    isArchived: false,
  })
    .select('name description tags visibility owner members lastMessageAt')
    .lean();

  const result = rooms.map((r) => ({
    ...r,
    memberCount: r.members.length,
    members: undefined, // don't expose full member list here
    inviteCode: undefined,
  }));

  return res.status(200).json({ success: true, rooms: result });
});

exports.discoverRooms = asyncHandler(async (req, res) => {
  const { q = '', page: rawPage = 1 } = req.query;
  const page = Math.max(1, parseInt(rawPage, 10));
  const limit = 20;

  const filter = { visibility: 'public', isArchived: false };
  if (q.trim()) filter.name = { $regex: q.trim(), $options: 'i' };

  const total = await Room.countDocuments(filter);
  const rooms = await Room.find(filter)
    .select('name description tags members lastMessageAt')
    .sort({ lastMessageAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const result = rooms.map((r) => ({
    _id: r._id,
    name: r.name,
    description: r.description,
    tags: r.tags,
    memberCount: r.members.length,
    lastMessageAt: r.lastMessageAt,
  }));

  return res.status(200).json({ success: true, rooms: result, total, page, totalPages: Math.ceil(total / limit) });
});

exports.createRoom = asyncHandler(async (req, res) => {
  const { name, description = '', tags = [], visibility = 'public', maxMembers = 30 } = req.body;
  const userId = req.user._id;

  // Enforce per-user room limit
  const ownedCount = await Room.countDocuments({ owner: userId, isArchived: false });
  if (ownedCount >= MAX_ROOMS_PER_USER) {
    return res.status(400).json({ success: false, message: `You can own at most ${MAX_ROOMS_PER_USER} rooms.` });
  }

  const roomData = {
    name: name.trim(),
    description: (description || '').trim().slice(0, 300),
    tags: (tags || []).slice(0, 5).map((t) => String(t).trim().slice(0, 30)),
    visibility,
    owner: userId,
    maxMembers: Math.min(50, Math.max(2, parseInt(maxMembers, 10) || 30)),
    members: [{ user: userId, role: 'owner', joinedAt: new Date() }],
  };

  if (visibility === 'private') {
    let code;
    let attempts = 0;
    do {
      code = Room.generateInviteCode();
      const existing = await Room.findOne({ inviteCode: code }).lean();
      if (!existing) break;
      attempts++;
    } while (attempts < 10);
    roomData.inviteCode = code;
  }

  const room = await Room.create(roomData);
  return res.status(201).json({ success: true, room: { ...room.toObject(), inviteCode: room.inviteCode } });
});

exports.getRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!assertValidId(id, res)) return;

  const room = await Room.findById(id).lean();
  if (!room || room.isArchived) return res.status(404).json({ success: false, message: 'Room not found.' });

  const userId = String(req.user._id);
  const isMember = room.members.some((m) => String(m.user) === userId);

  if (!isMember && room.visibility === 'private') {
    return res.status(403).json({ success: false, message: 'Private room.' });
  }

  // Populate members with public fields
  const memberIds = room.members.map((m) => m.user);
  const users = await User.find({ _id: { $in: memberIds } }).select(USER_PUBLIC).lean();
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

  const isOwner = String(room.owner) === userId;

  return res.status(200).json({
    success: true,
    room: {
      _id: room._id,
      name: room.name,
      description: room.description,
      tags: room.tags,
      visibility: room.visibility,
      owner: room.owner,
      maxMembers: room.maxMembers,
      lastMessageAt: room.lastMessageAt,
      isArchived: room.isArchived,
      // Only expose invite code to owner
      inviteCode: isOwner && room.visibility === 'private' ? room.inviteCode : undefined,
      members: room.members.map((m) => ({
        user: userMap[String(m.user)] || { _id: m.user },
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    },
  });
});

exports.joinRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!assertValidId(id, res)) return;

  const room = await Room.findById(id);
  if (!room || room.isArchived) return res.status(404).json({ success: false, message: 'Room not found.' });
  if (room.visibility === 'private') return res.status(403).json({ success: false, message: 'Private room. Use an invite code to join.' });

  const userId = String(req.user._id);
  const isMember = room.members.some((m) => String(m.user) === userId);
  if (isMember) return res.status(400).json({ success: false, message: 'Already a member.' });
  if (room.members.length >= room.maxMembers) return res.status(400).json({ success: false, message: 'Room is full.' });

  room.members.push({ user: req.user._id, role: 'member', joinedAt: new Date() });
  await room.save();

  return res.status(200).json({ success: true, message: 'Joined room.' });
});

exports.joinByCode = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') return res.status(400).json({ success: false, message: 'Invite code required.' });

  const room = await Room.findOne({ inviteCode: code.toUpperCase().trim(), isArchived: false });
  if (!room) return res.status(404).json({ success: false, message: 'Invalid invite code.' });

  const userId = String(req.user._id);
  const isMember = room.members.some((m) => String(m.user) === userId);
  if (isMember) return res.status(400).json({ success: false, message: 'Already a member.' });
  if (room.members.length >= room.maxMembers) return res.status(400).json({ success: false, message: 'Room is full.' });

  room.members.push({ user: req.user._id, role: 'member', joinedAt: new Date() });
  await room.save();

  return res.status(200).json({ success: true, roomId: String(room._id), message: 'Joined room.' });
});

exports.leaveRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!assertValidId(id, res)) return;

  const room = await Room.findById(id);
  if (!room || room.isArchived) return res.status(404).json({ success: false, message: 'Room not found.' });

  const userId = String(req.user._id);
  const member = room.members.find((m) => String(m.user) === userId);
  if (!member) return res.status(400).json({ success: false, message: 'Not a member.' });
  if (member.role === 'owner') return res.status(400).json({ success: false, message: 'Transfer ownership or delete the room before leaving.' });

  room.members = room.members.filter((m) => String(m.user) !== userId);
  await room.save();

  return res.status(200).json({ success: true, message: 'Left room.' });
});

exports.updateRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!assertValidId(id, res)) return;

  const room = await Room.findById(id);
  if (!room || room.isArchived) return res.status(404).json({ success: false, message: 'Room not found.' });
  if (String(room.owner) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Only the owner can edit this room.' });

  const { name, description, tags, maxMembers } = req.body;
  if (name) room.name = name.trim().slice(0, 60);
  if (description !== undefined) room.description = description.trim().slice(0, 300);
  if (tags) room.tags = tags.slice(0, 5).map((t) => String(t).trim().slice(0, 30));
  if (maxMembers) room.maxMembers = Math.min(50, Math.max(room.members.length, parseInt(maxMembers, 10)));

  await room.save();
  return res.status(200).json({ success: true, room });
});

exports.removeMember = asyncHandler(async (req, res) => {
  const { id, userId: targetId } = req.params;
  if (!assertValidId(id, res) || !assertValidId(targetId, res)) return;

  const room = await Room.findById(id);
  if (!room || room.isArchived) return res.status(404).json({ success: false, message: 'Room not found.' });
  if (String(room.owner) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Only the owner can remove members.' });
  if (String(targetId) === String(req.user._id)) return res.status(400).json({ success: false, message: 'Cannot remove yourself.' });

  const before = room.members.length;
  room.members = room.members.filter((m) => String(m.user) !== String(targetId));
  if (room.members.length === before) return res.status(404).json({ success: false, message: 'Member not found.' });

  await room.save();

  // Force the removed user's sockets out of the room channel
  // This is handled via getIo() if needed; here we just respond
  return res.status(200).json({ success: true, message: 'Member removed.' });
});

exports.archiveRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!assertValidId(id, res)) return;

  const room = await Room.findById(id);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
  if (String(room.owner) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Only the owner can archive this room.' });

  room.isArchived = true;
  await room.save();

  return res.status(200).json({ success: true, message: 'Room archived.' });
});

// ── Room messages ─────────────────────────────────────────────────────────────

exports.getRoomMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { before, limit: rawLimit } = req.query;
  if (!assertValidId(id, res)) return;

  const limit = Math.min(50, Math.max(1, parseInt(rawLimit, 10) || 30));
  const userId = String(req.user._id);

  const room = await Room.findById(id).lean();
  if (!room || room.isArchived) return res.status(404).json({ success: false, message: 'Room not found.' });
  if (!room.members.some((m) => String(m.user) === userId)) return res.status(403).json({ success: false, message: 'Members only.' });

  const filter = { room: id, deletedAt: null };
  if (before && mongoose.Types.ObjectId.isValid(before)) {
    const pivot = await Message.findById(before).lean();
    if (pivot) filter.createdAt = { $lt: pivot.createdAt };
  }

  const messages = await Message.find(filter)
    .populate('sender', USER_PUBLIC)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();

  const safe = messages.map((m) => ({ ...m, text: m.deletedAt ? '' : m.text, deleted: !!m.deletedAt }));
  return res.status(200).json({ success: true, messages: safe.reverse(), hasMore });
});

// ── Delete message ────────────────────────────────────────────────────────────

exports.deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!assertValidId(id, res)) return;

  const msg = await Message.findById(id);
  if (!msg || msg.deletedAt) return res.status(404).json({ success: false, message: 'Message not found.' });

  const userId = String(req.user._id);
  const isSender = String(msg.sender) === userId;

  // Room owners can delete any message in their room
  let isRoomOwner = false;
  if (msg.room) {
    const room = await Room.findById(msg.room).lean();
    if (room && String(room.owner) === userId) isRoomOwner = true;
  }

  if (!isSender && !isRoomOwner) {
    return res.status(403).json({ success: false, message: 'Not permitted to delete this message.' });
  }

  msg.deletedAt = new Date();
  msg.text = '';
  await msg.save();

  // Emit to affected channel
  const { getIo } = require('../socket');
  const io = getIo();
  if (io) {
    const channel = msg.conversation ? `conv:${msg.conversation}` : `room:${msg.room}`;
    io.to(channel).emit('message:deleted', { messageId: String(msg._id) });
  }

  return res.status(200).json({ success: true, message: 'Message deleted.' });
});

// ── Presence ──────────────────────────────────────────────────────────────────

exports.getPresence = asyncHandler(async (req, res) => {
  const { ids } = req.query;
  if (!ids) return res.status(200).json({ success: true, presence: {} });

  const idList = String(ids).split(',').filter(mongoose.Types.ObjectId.isValid).slice(0, 100);
  const onlineMap = getOnlineMap();

  const presence = {};
  idList.forEach((id) => { presence[id] = onlineMap.has(id); });

  return res.status(200).json({ success: true, presence });
});

