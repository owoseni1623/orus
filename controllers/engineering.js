const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Engineering = require('../models/Engineering');

// @desc    Submit engineering consultation request
// @route   POST /api/engineering/submit
// @access  Public
exports.submitConsultation = asyncHandler(async (req, res, next) => {
  const { name, email, projectType, description } = req.body;
  
  // Handle file uploads
  const images = req.files ? req.files.map(file => file.filename) : [];

  const consultation = await Engineering.create({
    name,
    email,
    projectType,
    description,
    images
  });

  res.status(201).json({
    success: true,
    data: consultation
  });
});

// @desc    Get all consultation requests
// @route   GET /api/engineering
// @access  Private/Admin
exports.getConsultations = asyncHandler(async (req, res, next) => {
  const consultations = await Engineering.find().sort('-createdAt');

  res.status(200).json({
    success: true,
    count: consultations.length,
    data: consultations
  });
});

// @desc    Get single consultation request
// @route   GET /api/engineering/:id
// @access  Private/Admin
exports.getConsultation = asyncHandler(async (req, res, next) => {
  const consultation = await Engineering.findById(req.params.id);

  if (!consultation) {
    return next(new ErrorResponse(`Consultation not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: consultation
  });
});

// @desc    Update consultation status
// @route   PUT /api/engineering/:id
// @access  Private/Admin
exports.updateConsultation = asyncHandler(async (req, res, next) => {
  let consultation = await Engineering.findById(req.params.id);

  if (!consultation) {
    return next(new ErrorResponse(`Consultation not found with id of ${req.params.id}`, 404));
  }

  consultation = await Engineering.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: consultation
  });
});

// @desc    Delete consultation
// @route   DELETE /api/engineering/:id
// @access  Private/Admin
exports.deleteConsultation = asyncHandler(async (req, res, next) => {
  const consultation = await Engineering.findById(req.params.id);

  if (!consultation) {
    return next(new ErrorResponse(`Consultation not found with id of ${req.params.id}`, 404));
  }

  await consultation.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Reply to a consultation
// @route   POST /api/engineering/:id/reply
// @access  Private/Admin
exports.replyToConsultation = asyncHandler(async (req, res, next) => {
  const consultation = await Engineering.findById(req.params.id);

  if (!consultation) {
    return next(new ErrorResponse(`Consultation not found with id of ${req.params.id}`, 404));
  }

  const { message } = req.body;
  const attachments = req.files ? req.files.map(file => file.filename) : [];

  consultation.replies = consultation.replies || [];
  consultation.replies.push({
    message,
    attachments,
    createdAt: Date.now()
  });

  await consultation.save();

  res.status(200).json({
    success: true,
    data: consultation
  });
});

// @desc    Update consultation status only
// @route   PUT /api/engineering/:id/status
// @access  Private/Admin
exports.updateConsultationStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!status) {
    return next(new ErrorResponse('Status is required', 400));
  }

  let consultation = await Engineering.findById(req.params.id);

  if (!consultation) {
    return next(new ErrorResponse(`Consultation not found with id of ${req.params.id}`, 404));
  }

  consultation = await Engineering.findByIdAndUpdate(
    req.params.id, 
    { status }, 
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: consultation
  });
});