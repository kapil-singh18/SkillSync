/**
 * Seed script for badges — run once to populate the Badge collection.
 * Usage: node utils/seedBadges.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Badge = require('../models/Badge');
const connectDB = require('../config/db');

const BADGES = [
  {
    name: 'First Post',
    description: 'Published your first community post',
    iconUrl: '📝',
    criteria: 'Create 1 post in the community feed',
  },
  {
    name: 'Conversationalist',
    description: 'Left 10 comments on community posts',
    iconUrl: '💬',
    criteria: 'Write 10 comments',
  },
  {
    name: 'Helpful Hand',
    description: 'Received 10 upvotes on your posts',
    iconUrl: '👍',
    criteria: 'Accumulate 10 upvotes across all posts',
  },
  {
    name: 'Team Player',
    description: 'Joined your first project team',
    iconUrl: '🤝',
    criteria: 'Be a member of at least 1 project',
  },
  {
    name: 'Quiz Ace',
    description: 'Scored 80%+ on a skill assessment',
    iconUrl: '🏆',
    criteria: 'Score at least 80% on any assessment',
  },
  {
    name: 'Roadmap Pioneer',
    description: 'Generated your first learning roadmap',
    iconUrl: '🗺️',
    criteria: 'Create 1 AI-generated roadmap',
  },
  {
    name: 'Rising Star',
    description: 'Earned 100 points',
    iconUrl: '⭐',
    criteria: 'Accumulate 100 points',
  },
  {
    name: 'Mentor',
    description: 'Helped 5 different users in chat',
    iconUrl: '🎓',
    criteria: 'Chat with 5 unique users',
  },
  {
    name: 'Explorer',
    description: 'Completed 5 skill assessments',
    iconUrl: '🧭',
    criteria: 'Complete 5 assessments',
  },
  {
    name: 'Community Leader',
    description: 'Earned 500 points and 5 badges',
    iconUrl: '👑',
    criteria: 'Have at least 500 points and 5 badges',
  },
];

const seed = async () => {
  try {
    await connectDB();
    console.log('[seedBadges] Connected to MongoDB');

    // Upsert each badge by name so the script is idempotent
    for (const badge of BADGES) {
      await Badge.findOneAndUpdate(
        { name: badge.name },
        { $set: badge },
        { upsert: true, new: true }
      );
    }

    console.log(`[seedBadges] ✓ Seeded ${BADGES.length} badges`);
    process.exit(0);
  } catch (err) {
    console.error('[seedBadges] Error:', err);
    process.exit(1);
  }
};

seed();
