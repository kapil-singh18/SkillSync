const express = require('express');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    res.status(200).json({ success: true, message: 'Server is healthy' });
  })
);

module.exports = router;
