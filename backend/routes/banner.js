const express = require('express');
const Banner = require('../models/Banner');
const { authenticateSuperAdmin } = require('../middleware/auth');
const { uploadBannerImage, uploadBannerVideo, extractPublicId } = require('../utils/cloudinary');

const router = express.Router();

// Public: Get active banner (optionally by placement)
router.get('/', async (req, res) => {
  try {
    const { placement } = req.query;

    const query = { isActive: true };
    if (placement && placement !== 'all') {
      query.$or = [{ placement }, { placement: 'all' }];
    }

    const banner = await Banner.findOne(query).sort({ updatedAt: -1 });
    if (!banner) {
      return res.json({ success: true, data: null });
    }

    return res.json({ success: true, data: banner });
  } catch (err) {
    console.error('Get banner error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Super Admin: Upload/replace banner (image or video)
router.post('/', authenticateSuperAdmin, async (req, res) => {
  try {
    // Detect content-type via multer choices
    const runUpload = () => new Promise((resolve, reject) => {
      // first try image
      uploadBannerImage(req, res, (err) => {
        if (!err && req.file) return resolve({ type: 'image' });
        // fallback to video
        uploadBannerVideo(req, res, (err2) => {
          if (err2 || !req.file) return reject(err2 || new Error('No file provided'));
          return resolve({ type: 'video' });
        });
      });
    });

    const { type } = await runUpload();

    const { placement = 'all', isActive = 'true', title = '' } = req.body;

    const payload = {
      title,
      url: req.file?.path,
      type,
      placement,
      isActive: String(isActive) !== 'false',
      metadata: {
        publicId: req.file?.filename,
        format: req.file?.mimetype,
        width: req.file?.width,
        height: req.file?.height,
        duration: req.file?.duration,
      },
    };

    // Upsert latest banner for the placement
    const saved = await Banner.findOneAndUpdate(
      { placement },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, message: 'Banner saved', data: saved });
  } catch (err) {
    console.error('Upload banner error:', err);
    res.status(400).json({ success: false, message: err?.message || 'Failed to upload banner' });
  }
});

module.exports = router;
