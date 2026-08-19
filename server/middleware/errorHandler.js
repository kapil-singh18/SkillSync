const multer = require('multer');

/**
 * Centralized error handler middleware.
 * Must be registered LAST in the Express middleware chain.
 *
 * Produces a consistent JSON error response:
 * { success: false, message: string, errors?: Array, stack?: string }
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode || 500);

  // ─── Mongoose Validation Error ──────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors || {}).map((val) => val.message);
    error.message = messages.length > 0 ? messages.join(', ') : 'Validation failed';
  }

  // ─── Mongoose CastError (Bad ObjectId) ───────────────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 404;
    error.message = `Resource not found with id: ${err.value}`;
  }

  // ─── Mongoose Duplicate Key Error (code 11000) ──────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error.message = `An entry with this ${field} already exists`;
  }

  // ─── JWT Errors ─────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    error.message = 'Not authorised — invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    error.message = 'Not authorised — token expired';
  }

  // ─── Multer Upload Errors ───────────────────────────────────────────────────
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      error.message = 'File size exceeds maximum limit of 5 MB';
    } else {
      error.message = `Upload error: ${err.message}`;
    }
  }

  // ─── Log error on server (never expose stack in production) ─────────────────
  if (process.env.NODE_ENV !== 'test') {
    if (statusCode >= 500) {
      console.error(`[error] 500 Server Error on ${req.method} ${req.originalUrl}:`, err);
    }
  }

  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && isProduction ? 'Internal Server Error' : error.message || 'Server Error',
    ...(err.errors && { errors: err.errors }),
    ...(!isProduction && { stack: err.stack }),
  });
};

module.exports = errorHandler;
