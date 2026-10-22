/**
 * Seed script: creates one admin user from ADMIN_EMAIL and ADMIN_PASSWORD env vars.
 * Idempotent — safe to run multiple times.
 *
 * Usage: npm run seed:admin
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seed = async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('[seed:admin] ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('[seed:admin] Connected to MongoDB');

    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (existing) {
      if (existing.role === 'admin') {
        console.log(`[seed:admin] Admin already exists: ${ADMIN_EMAIL}`);
      } else {
        existing.role = 'admin';
        existing.isEmailVerified = true;
        await existing.save({ validateBeforeSave: false });
        console.log(`[seed:admin] Promoted existing user to admin: ${ADMIN_EMAIL}`);
      }
    } else {
      await User.create({
        name: 'Admin',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        isEmailVerified: true,
        isActive: true,
      });
      console.log(`[seed:admin] Admin user created: ${ADMIN_EMAIL}`);
    }
  } catch (err) {
    console.error('[seed:admin] Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[seed:admin] Disconnected from MongoDB');
    process.exit(0);
  }
};

seed();
