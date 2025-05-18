const Inquiry = require('../models/Inquiry');
const { ErrorResponse } = require('../middleware/error');
const asyncHandler = require('../middleware/async');

// @desc    Create new inquiry
// @route   POST /api/inquiries
// @access  Public
exports.createInquiry = asyncHandler(async (req, res, next) => {
  const inquiry = await Inquiry.create(req.body);
  
  res.status(201).json({
    success: true,
    data: inquiry
  });
});

// @desc    Get all inquiries
// @route   GET /api/inquiries
// @access  Private
exports.getInquiries = asyncHandler(async (req, res, next) => {
  const inquiries = await Inquiry.find().sort('-createdAt');
  
  res.status(200).json({
    success: true,
    count: inquiries.length,
    data: inquiries
  });
});