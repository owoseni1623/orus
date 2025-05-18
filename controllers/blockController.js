const Block = require('../models/Block');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const path = require('path');

// Helper function to clean and format image paths
const formatImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  if (typeof imagePath !== 'string') {
    if (imagePath.toString) {
      imagePath = imagePath.toString();
    } else {
      return null;
    }
  }
  
  try {
    // Ensure the path is clean and includes 'blocks/' prefix
    const cleanPath = imagePath
      .replace(/^\/+/, '')           // Remove leading slashes
      .replace(/^uploads\/+/, '')    // Remove leading 'uploads/'
      .replace(/^blocks\/+/, '');    // Remove leading 'blocks/'
    
    return `${cleanPath}`; // Return clean path without prefix
  } catch (error) {
    console.error('Error formatting image URL:', error);
    return null;
  }
};

// @desc    Get all blocks
// @route   GET /api/blocks
// @access  Public
exports.getBlocks = asyncHandler(async (req, res, next) => {
  const blocks = await Block.find();
  
  const transformedBlocks = blocks.map(block => {
    const blockObj = block.toObject();
    // Filter out null values after formatting
    blockObj.images = blockObj.images
      .map(image => formatImageUrl(image))
      .filter(image => image !== null);
    return blockObj;
  });

  res.status(200).json({
    success: true,
    count: blocks.length,
    data: transformedBlocks
  });
});


// @desc    Get single block
// @route   GET /api/blocks/:id
// @access  Public
exports.getBlock = asyncHandler(async (req, res, next) => {
  const block = await Block.findById(req.params.id);
  
  if (!block) {
    return next(new ErrorResponse(`Block not found with id of ${req.params.id}`, 404));
  }

  const blockObj = block.toObject();
  blockObj.images = blockObj.images
    .map(image => formatImageUrl(image))
    .filter(image => image !== null);
  
  res.status(200).json({
    success: true,
    data: blockObj
  });
});

// @desc    Create new block
// @route   POST /api/blocks
// @access  Private/Admin
exports.createBlock = asyncHandler(async (req, res, next) => {
  // If images are uploaded, extract their filenames
  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map(file => file.filename);
  }

  // If images are sent in the body (from frontend)
  if (req.body.images && req.body.images.length > 0) {
    // Ensure only filenames are stored, not full paths
    req.body.images = req.body.images.map(image => {
      // Extract just the filename if a full path is sent
      return image.split('/').pop() || image;
    });
  }

  const block = await Block.create(req.body);
  
  res.status(201).json({
    success: true,
    data: block
  });
});

// @desc    Update block
// @route   PUT /api/blocks/:id
// @access  Private/Admin
exports.updateBlock = asyncHandler(async (req, res, next) => {
  let block = await Block.findById(req.params.id);
  
  if (!block) {
    return next(new ErrorResponse(`Block not found with id of ${req.params.id}`, 404));
  }

  // If new images are uploaded, add them to the existing images
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map(file => file.filename);
    req.body.images = [...(block.images || []), ...newImages];
  }

  // If images are sent in the body (from frontend)
  if (req.body.images && req.body.images.length > 0) {
    // Ensure only filenames are stored, not full paths
    req.body.images = req.body.images.map(image => {
      // Extract just the filename if a full path is sent
      return image.split('/').pop() || image;
    });
  }

  block = await Block.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: block
  });
});

// @desc    Delete block
// @route   DELETE /api/blocks/:id
// @access  Private/Admin
exports.deleteBlock = asyncHandler(async (req, res, next) => {
  const block = await Block.findById(req.params.id);
  
  if (!block) {
    return next(new ErrorResponse(`Block not found with id of ${req.params.id}`, 404));
  }

  await block.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});