const { analyzeResume } = require('../services/resumeService');
const { awardPoints, checkAndAwardBadges } = require('../services/gamificationService');

// ─── POST /api/resume/analyze — upload + analyse PDF ────────────────────────

exports.analyzeResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF file',
      });
    }

    const analysis = await analyzeResume(req.file.buffer);

    // Award 10 points for using the resume analyser
    await awardPoints(req.user._id, 10);
    await checkAndAwardBadges(req.user._id);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (err) {
    next(err);
  }
};
