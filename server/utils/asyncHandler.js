/**
 * Async handler wrapper to catch errors in async route handlers
 * and forward them cleanly to the centralized error middleware.
 *
 * @param {Function} fn - Async express route handler function (req, res, next)
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
