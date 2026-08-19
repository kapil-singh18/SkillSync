const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');
const mongoose = require('mongoose');

const PAGE_LIMIT = 50;

// ─── GET /api/chat/conversations ──────────────────────────────────────────────
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all DMs where this user is sender or receiver
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
          receiver: { $exists: true, $ne: null },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
          unread: { $sum: 1 },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
      { $limit: 30 },
    ]);

    // Populate the other user's info
    const populated = await User.populate(messages, {
      path: '_id',
      select: 'name role',
    });

    const conversations = populated.map((conv) => ({
      user: conv._id,
      lastMessage: {
        content: conv.lastMessage.content,
        createdAt: conv.lastMessage.createdAt,
        isOwn: conv.lastMessage.sender.toString() === userId.toString(),
      },
    }));

    return res.status(200).json({ success: true, conversations });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/chat/messages/:userId ──────────────────────────────────────────
const getDirectMessages = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .populate('sender', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_LIMIT)
      .limit(PAGE_LIMIT)
      .lean();

    return res.status(200).json({
      success: true,
      messages: messages.reverse(), // oldest first for display
      page,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/chat/rooms ──────────────────────────────────────────────────────
const getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({ members: req.user._id })
      .populate('createdBy', 'name')
      .sort({ updatedAt: -1 });

    return res.status(200).json({ success: true, rooms });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/chat/rooms ─────────────────────────────────────────────────────
const createRoom = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Room name is required' });
    }

    const room = await Room.create({
      name: name.trim(),
      description: description?.trim(),
      createdBy: req.user._id,
      members: [req.user._id],
    });

    await room.populate('createdBy', 'name');

    return res.status(201).json({ success: true, room });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/chat/rooms/:roomId/join ────────────────────────────────────────
const joinRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const room = await Room.findByIdAndUpdate(
      roomId,
      { $addToSet: { members: userId } },
      { new: true }
    ).populate('createdBy', 'name');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    return res.status(200).json({ success: true, room });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/chat/rooms/:roomId/messages ─────────────────────────────────────
const getRoomMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;

    // Authorization: must be a room member
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    if (!room.members.map(String).includes(userId.toString())) {
      return res.status(403).json({ success: false, message: 'Not a member of this room' });
    }

    const messages = await Message.find({ room: roomId })
      .populate('sender', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_LIMIT)
      .limit(PAGE_LIMIT)
      .lean();

    return res.status(200).json({
      success: true,
      messages: messages.reverse(),
      page,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getDirectMessages,
  getRooms,
  createRoom,
  joinRoom,
  getRoomMessages,
};
