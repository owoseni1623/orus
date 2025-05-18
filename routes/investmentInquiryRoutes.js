const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { protect, authorize } = require('../middleware/auth');

const {
  createInvestmentInquiry,
  getInvestmentInquiries,
  getInvestmentInquiry,
  updateInquiryStatus,
  respondToInquiry,
  deleteInvestmentInquiry
} = require('../controllers/investmentInquiryController');

// Configure storage for inquiry documents
const inquiryStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/investment-inquiries');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directory:', error);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const sanitizedName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '-');
    const filename = `inquiry-${Date.now()}-${sanitizedName}`;
    cb(null, filename);
  }
});

// Configure storage for admin response images
const responseStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/investment-responses');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directory:', error);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const sanitizedName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '-');
    const filename = `response-${Date.now()}-${sanitizedName}`;
    cb(null, filename);
  }
});

// File filter for images and documents
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Error: Only images, PDFs, and office documents are allowed!'));
};

// Initialize multer for inquiry documents (max 10 files, 5MB each)
const uploadInquiryDocs = multer({
  storage: inquiryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
}).array('documents', 10);

// Initialize multer for admin response images (max 10 images, 5MB each)
const uploadResponseImages = multer({
  storage: responseStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: Only images are allowed for responses!'));
  }
}).array('responseImages', 10);

// Routes
router.route('/')
  .post((req, res, next) => {
    uploadInquiryDocs(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  }, createInvestmentInquiry)
  .get(protect, authorize('admin'), getInvestmentInquiries);

router.route('/:id')
  .get(protect, authorize('admin'), getInvestmentInquiry)
  .delete(protect, authorize('admin'), deleteInvestmentInquiry);

router.route('/:id/status')
  .put(protect, authorize('admin'), updateInquiryStatus);

router.route('/:id/respond')
  .put(protect, authorize('admin'), (req, res, next) => {
    uploadResponseImages(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  }, respondToInquiry);

module.exports = router;