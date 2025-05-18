const express = require('express');
const {
  submitConsultation,
  getConsultations,
  getConsultation,
  updateConsultation,
  deleteConsultation,
  replyToConsultation,
  updateConsultationStatus
} = require('../controllers/engineering');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'engineering');
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `engineering-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|avif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: Images Only!'));
  }
});

router.post('/submit', upload.array('images', 5), submitConsultation);
router.get('/', protect, authorize('admin'), getConsultations);
router.get('/:id', protect, authorize('admin'), getConsultation);
router.put('/:id', protect, authorize('admin'), updateConsultation);
router.delete('/:id', protect, authorize('admin'), deleteConsultation);
router.post('/:id/reply', protect, authorize('admin'), upload.array('attachments', 5), replyToConsultation);
router.put('/:id/status', protect, authorize('admin'), updateConsultationStatus);

module.exports = router;