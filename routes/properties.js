const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');  // Changed this line to destructure protect
const upload = require('../middleware/upload');

// Import Property Controller
const {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  searchProperties
} = require('../controllers/propertyController');

// @route   GET /api/properties
// @desc    Get all properties
// @access  Public
router.get('/', getProperties);

// @route   GET /api/properties/search
// @desc    Search properties
// @access  Public
router.get('/search', searchProperties);

// @route   GET /api/properties/:id
// @desc    Get single property
// @access  Public
router.get('/:id', getProperty);

// @route   POST /api/properties
// @desc    Create a property
// @access  Private
router.post('/', protect, upload.array('images', 5), createProperty);

// @route   PUT /api/properties/:id
// @desc    Update property
// @access  Private
router.put('/:id', protect, updateProperty);

// @route   DELETE /api/properties/:id
// @desc    Delete property
// @access  Private
router.delete('/:id', protect, deleteProperty);

module.exports = router;