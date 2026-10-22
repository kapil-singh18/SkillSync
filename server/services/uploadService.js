const cloudinary = require('../config/cloudinary');

/**
 * Uploads an avatar buffer to Cloudinary.
 * Stores in folder "skillsync/avatars", transforms to 400x400 filled crop.
 *
 * @param {Buffer} buffer - The image buffer from multer
 * @param {string} userId - Used as the public_id for easy replacement
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadAvatar = (buffer, userId) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'skillsync/avatars',
        public_id: `user_${userId}`,
        overwrite: true,
        transformation: [
          {
            width: 400,
            height: 400,
            crop: 'fill',
            gravity: 'face',
            quality: 'auto',
            fetch_format: 'auto',
          },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });

/**
 * Deletes an image from Cloudinary by public_id.
 * Resolves silently if the image doesn't exist (safe to call on re-upload).
 *
 * @param {string} publicId
 * @returns {Promise<void>}
 */
const deleteImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('[uploadService] Failed to delete Cloudinary image:', err.message);
  }
};

module.exports = { uploadAvatar, deleteImage };
