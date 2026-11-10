/**
 * controllers/connectionController.js
 *
 * POST   /api/connections          — send a connection/mentorship request
 * GET    /api/connections          — list my connections (filtered by status/type)
 * GET    /api/connections/requests/incoming
 * GET    /api/connections/requests/outgoing
 * GET    /api/connections/status/:userId
 * PUT    /api/connections/:id/accept
 * PUT    /api/connections/:id/decline
 * PUT    /api/connections/:id/cancel
 * DELETE /api/connections/:id
 */

const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const Connection = require('../models/Connection');
const User = require('../models/User');

const DECLINE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Fields to populate on the connected user (public-safe, no email)
const USER_POPULATE = 'name role headline avatarUrl skills location';

// ── Send request ──────────────────────────────────────────────────────────────

exports.sendRequest = asyncHandler(async (req, res) => {
  const { userId, type, message = '' } = req.body;
  const me = req.user;

  // Self-request guard
  if (String(userId) === String(me._id)) {
    return res.status(400).json({ success: false, message: 'You cannot connect with yourself.' });
  }

  const connType = type === 'mentorship' ? 'mentorship' : 'peer';

  // Load target user (active, non-admin)
  const target = await User.findById(userId).select('name role isActive isEmailVerified mentorProfile');
  if (!target || !target.isActive || target.role === 'admin') {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  // Mentorship-specific guards
  if (connType === 'mentorship') {
    if (target.role !== 'mentor') {
      return res.status(400).json({ success: false, message: 'This user is not a mentor.' });
    }
    if (!target.mentorProfile?.acceptingMentees) {
      return res.status(400).json({ success: false, message: 'This mentor is not currently accepting mentees.' });
    }
  }

  // Check for existing active connection (pending or accepted) in either direction
  const existingActive = await Connection.findOne({
    $or: [
      { requester: me._id, recipient: userId, type: connType, status: { $in: ['pending', 'accepted'] } },
      { requester: userId, recipient: me._id, type: connType, status: { $in: ['pending', 'accepted'] } },
    ],
  });

  if (existingActive) {
    if (existingActive.status === 'accepted') {
      return res.status(409).json({ success: false, message: 'You are already connected with this user.' });
    }
    if (String(existingActive.requester) === String(me._id)) {
      return res.status(409).json({ success: false, message: 'You already have a pending request to this user.' });
    }
    // They already sent me a request — prompt to respond instead
    return res.status(409).json({
      success: false,
      message: 'This user already sent you a request. Check your incoming requests.',
      code: 'PENDING_INCOMING',
    });
  }

  // Check 7-day decline cooldown (they declined my previous request)
  const recentDecline = await Connection.findOne({
    requester: me._id,
    recipient: userId,
    type: connType,
    status: 'declined',
    respondedAt: { $gte: new Date(Date.now() - DECLINE_COOLDOWN_MS) },
  });

  if (recentDecline) {
    const unlocksAt = new Date(recentDecline.respondedAt.getTime() + DECLINE_COOLDOWN_MS);
    return res.status(429).json({
      success: false,
      message: `You can send another request to this user after ${unlocksAt.toLocaleDateString()}.`,
      code: 'DECLINE_COOLDOWN',
    });
  }

  const connection = await Connection.create({
    requester: me._id,
    recipient: userId,
    type: connType,
    message: (message || '').slice(0, 300),
    status: 'pending',
  });

  // TODO(Module 9 — Notifications): notify recipient that a new request was sent

  return res.status(201).json({ success: true, connection });
});

// ── List connections ───────────────────────────────────────────────────────────

exports.getConnections = asyncHandler(async (req, res) => {
  const me = req.user;
  const { status, type } = req.query;

  const filter = {
    $or: [{ requester: me._id }, { recipient: me._id }],
  };
  if (status) filter.status = status;
  if (type) filter.type = type;

  const connections = await Connection.find(filter)
    .populate('requester', USER_POPULATE)
    .populate('recipient', USER_POPULATE)
    .sort({ updatedAt: -1 })
    .lean();

  return res.status(200).json({ success: true, connections });
});

// ── Incoming pending requests ─────────────────────────────────────────────────

exports.getIncomingRequests = asyncHandler(async (req, res) => {
  const requests = await Connection.find({
    recipient: req.user._id,
    status: 'pending',
  })
    .populate('requester', USER_POPULATE)
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json({ success: true, requests });
});

// ── Outgoing pending requests ─────────────────────────────────────────────────

exports.getOutgoingRequests = asyncHandler(async (req, res) => {
  const requests = await Connection.find({
    requester: req.user._id,
    status: 'pending',
  })
    .populate('recipient', USER_POPULATE)
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json({ success: true, requests });
});

// ── Relationship status with a specific user ──────────────────────────────────

exports.getStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID.' });
  }

  const me = req.user;

  const connection = await Connection.findOne({
    $or: [
      { requester: me._id, recipient: userId },
      { requester: userId, recipient: me._id },
    ],
    status: { $in: ['pending', 'accepted'] },
  })
    .sort({ updatedAt: -1 })
    .lean();

  if (!connection) {
    return res.status(200).json({ success: true, status: 'none', connection: null });
  }

  let statusLabel;
  if (connection.status === 'accepted') {
    statusLabel = 'connected';
  } else if (String(connection.requester) === String(me._id)) {
    statusLabel = 'pending_sent';
  } else {
    statusLabel = 'pending_received';
  }

  return res.status(200).json({ success: true, status: statusLabel, connection });
});

// ── Accept ────────────────────────────────────────────────────────────────────

exports.acceptRequest = asyncHandler(async (req, res) => {
  const connection = await Connection.findById(req.params.id);
  if (!connection) {
    return res.status(404).json({ success: false, message: 'Connection not found.' });
  }
  if (String(connection.recipient) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Only the recipient can accept this request.' });
  }
  if (connection.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'This request is no longer pending.' });
  }

  connection.status = 'accepted';
  connection.respondedAt = new Date();
  await connection.save();

  // TODO(Module 9 — Notifications): notify requester that their request was accepted

  return res.status(200).json({ success: true, connection });
});

// ── Decline ───────────────────────────────────────────────────────────────────

exports.declineRequest = asyncHandler(async (req, res) => {
  const connection = await Connection.findById(req.params.id);
  if (!connection) {
    return res.status(404).json({ success: false, message: 'Connection not found.' });
  }
  if (String(connection.recipient) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Only the recipient can decline this request.' });
  }
  if (connection.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'This request is no longer pending.' });
  }

  connection.status = 'declined';
  connection.respondedAt = new Date();
  await connection.save();

  // TODO(Module 9 — Notifications): notify requester that their request was declined

  return res.status(200).json({ success: true, message: 'Request declined.' });
});

// ── Cancel ────────────────────────────────────────────────────────────────────

exports.cancelRequest = asyncHandler(async (req, res) => {
  const connection = await Connection.findById(req.params.id);
  if (!connection) {
    return res.status(404).json({ success: false, message: 'Connection not found.' });
  }
  if (String(connection.requester) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Only the requester can cancel this request.' });
  }
  if (connection.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Only pending requests can be cancelled.' });
  }

  connection.status = 'cancelled';
  await connection.save();

  return res.status(200).json({ success: true, message: 'Request cancelled.' });
});

// ── Remove accepted connection ────────────────────────────────────────────────

exports.removeConnection = asyncHandler(async (req, res) => {
  const connection = await Connection.findById(req.params.id);
  if (!connection) {
    return res.status(404).json({ success: false, message: 'Connection not found.' });
  }

  const isParty =
    String(connection.requester) === String(req.user._id) ||
    String(connection.recipient) === String(req.user._id);

  if (!isParty) {
    return res.status(403).json({ success: false, message: 'You are not part of this connection.' });
  }
  if (connection.status !== 'accepted') {
    return res.status(400).json({ success: false, message: 'Only accepted connections can be removed.' });
  }

  await connection.deleteOne();

  return res.status(200).json({ success: true, message: 'Connection removed.' });
});

