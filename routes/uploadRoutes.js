const express = require('express');
const router = express.Router();
const upload = require('../utils/fileUpload');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin'), upload.array('images', 10), async (req, res) => {
  try {
    const urls = req.files.map(file => `/uploads/${file.filename}`);
    res.status(200).json({ success: true, urls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;