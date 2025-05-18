const express = require('express');
const {
  createCOFO,
  getCOFOs,
  getCOFO,
  updateCOFOStage,
  deleteCOFO,
  getMyCOFOs,
  submitDocument,
  replyToApplication
} = require('../controllers/cofoController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Base routes
router.post('/', protect, createCOFO);
router.get('/my-applications', protect, getMyCOFOs);

// Admin routes
router.get('/', protect, authorize('admin'), getCOFOs);
router.get('/:id', protect, getCOFO);
router.put('/:id/stage', protect, authorize('admin'), updateCOFOStage);
router.delete('/:id', protect, authorize('admin'), deleteCOFO);
router.post('/:id/reply', protect, authorize('admin'), replyToApplication);

// Document submission
router.post('/:id/documents', protect, submitDocument);

module.exports = router;