const multer = require('multer');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        Object.assign(new Error('Only JPEG, PNG, and WebP images are allowed.'), {
          status: 400,
        })
      );
    }
    cb(null, true);
  },
});

/**
 * Multer middleware for avatar field.
 * Wraps multer errors into the centralized error format (400).
 */
const uploadAvatarMiddleware = (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File is too large. Maximum size is 2 MB.',
      });
    }

    return res.status(err.status || 400).json({
      success: false,
      message: err.message || 'File upload error.',
    });
  });
};

module.exports = { uploadAvatarMiddleware };
