const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT for the given userId.
 * @param {string} userId
 * @returns {string}
 */
const generateJWT = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set.');
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Generates a cryptographically secure random token and its SHA-256 hash.
 * Store only the hash in the database; send the raw token to the user.
 *
 * @returns {{ raw: string, hashed: string }}
 */
const generateRandomToken = () => {
  const raw = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hashed };
};

/**
 * Hashes a raw token string with SHA-256 for DB lookup.
 * @param {string} rawToken
 * @returns {string}
 */
const hashToken = (rawToken) =>
  crypto.createHash('sha256').update(rawToken).digest('hex');

module.exports = { generateJWT, generateRandomToken, hashToken };
