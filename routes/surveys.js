const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const {
  createSurveyRequest,
  getSurveyRequests,
  getSurveyRequest,
  updateSurveyRequest,
  replySurveyRequest
} = require('../controllers/surveyController');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const upload = multer({
  storage: multer.diskStorage({
    destination: async function (req, file, cb) {
      const uploadDir = path.join(__dirname, '..', 'uploads', 'surveys');
      try {
        await fs.mkdir(uploadDir, { recursive: true });
      } catch (error) {
        console.error('Error creating directory:', error);
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const sanitizedName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '-');
      const filename = `${Date.now()}-${sanitizedName}`;
      cb(null, filename);
    }
  }),
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp|avif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: Images Only!'));
  }
});

// Public route for creating survey request
router.route('/')
  .post(upload.array('images', 10), createSurveyRequest)
  .get(protect, authorize('admin'), getSurveyRequests);

// Admin routes for managing survey requests
router.route('/:id')
  .get(protect, authorize('admin'), getSurveyRequest)
  .put(protect, authorize('admin'), updateSurveyRequest);

// Route for admin to reply to survey request
router.route('/:id/reply')
  .post(protect, authorize('admin'), upload.array('images', 10), replySurveyRequest);

module.exports = router;