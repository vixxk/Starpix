const asyncHandler = require('../utils/asyncHandler');
const { uploadToS3 } = require('../services/s3Service');

// @desc    Upload single media asset (image/video/frame/effect)
// @route   POST /api/uploads
// @access  Private (Admin / User)
const uploadSingleMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const folder = req.body.folder || 'media';
  const fileUrl = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype, folder);

  res.status(200).json({
    success: true,
    data: {
      url: fileUrl,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    },
  });
});

module.exports = {
  uploadSingleMedia,
};
