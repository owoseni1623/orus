const express = require('express');
const router = express.Router();
const {
  getBlocks,
  getBlock,
  createBlock,
  updateBlock,
  deleteBlock
} = require('../controllers/blockController');

const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for block image uploads
const blockStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/blocks'));
  },
  filename: function (req, file, cb) {
    cb(null, `block-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const uploadBlocks = multer({
  storage: blockStorage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: Images Only!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Define routes
router.route('/')
  .get(getBlocks)
  .post(
    protect, 
    authorize('admin'), 
    uploadBlocks.array('images', 5),  // Allow up to 5 images
    createBlock
  );

router.route('/:id')
  .get(getBlock)
  .put(
    protect, 
    authorize('admin'), 
    uploadBlocks.array('images', 5), 
    updateBlock
  )
  .delete(protect, authorize('admin'), deleteBlock);

module.exports = router;