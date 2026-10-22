/**
 * Wraps an async route handler and forwards any thrown errors to Express's
 * next() error middleware, removing the need for try/catch in every controller.
 *
 * @param {Function} fn - Async route handler (req, res, next)
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
