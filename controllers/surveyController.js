const Survey = require('../models/Survey');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const nodemailer = require('nodemailer');
const path = require('path');

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// @desc    Create a new survey request
// @route   POST /api/surveys
// @access  Public
exports.createSurveyRequest = asyncHandler(async (req, res, next) => {
  try {
    console.log('Received survey request:', req.body);

    const { name, email, phone, landLocation } = req.body;
    
    if (!name || !email || !phone || !landLocation) {
      return next(new ErrorResponse('Please provide all required fields', 400));
    }

    // Handle uploaded images
    const images = req.files ? req.files.map(file => file.filename) : [];

    // Create survey with images
    const survey = await Survey.create({
      name,
      email,
      phone,
      landLocation,
      additionalDetails: req.body.additionalDetails || '',
      images,
      status: 'Pending'
    });

    console.log('Survey created successfully:', survey);

    res.status(201).json({
      success: true,
      data: survey
    });
  } catch (error) {
    console.error('Survey creation error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return next(new ErrorResponse(messages, 400));
    }

    next(error);
  }
});

// @desc    Get all survey requests
// @route   GET /api/surveys
// @access  Private/Admin
exports.getSurveyRequests = asyncHandler(async (req, res, next) => {
  try {
    const surveys = await Survey.find().sort({ createdAt: -1 });

    console.log('Surveys fetched:', surveys);

    res.status(200).json({
      success: true,
      count: surveys.length,
      data: surveys
    });
  } catch (error) {
    console.error('Error in getSurveyRequests:', error);
    next(error);
  }
});

// @desc    Get single survey request
// @route   GET /api/surveys/:id
// @access  Private/Admin
exports.getSurveyRequest = asyncHandler(async (req, res, next) => {
  const survey = await Survey.findById(req.params.id);

  if (!survey) {
    return next(
      new ErrorResponse(`Survey not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: survey
  });
});

// @desc    Update survey request
// @route   PUT /api/surveys/:id
// @access  Private/Admin
exports.updateSurveyRequest = asyncHandler(async (req, res, next) => {
  let survey = await Survey.findById(req.params.id);

  if (!survey) {
    return next(
      new ErrorResponse(`Survey not found with id of ${req.params.id}`, 404)
    );
  }

  survey = await Survey.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: survey
  });
});

// @desc    Reply to survey request
// @route   POST /api/surveys/:id/reply
// @access  Private/Admin
exports.replySurveyRequest = asyncHandler(async (req, res, next) => {
  const { message } = req.body;
  
  let survey = await Survey.findById(req.params.id);

  if (!survey) {
    return next(
      new ErrorResponse(`Survey not found with id of ${req.params.id}`, 404)
    );
  }

  // Handle admin reply images
  const replyImages = req.files ? req.files.map(file => file.filename) : [];

  // Update survey with admin reply including images
  survey = await Survey.findByIdAndUpdate(
    req.params.id, 
    { 
      adminReply: {
        message,
        images: replyImages,
        sentAt: new Date()
      },
      status: 'Completed' 
    }, 
    {
      new: true,
      runValidators: true
    }
  );

  // Send email with images
  try {
    const imageAttachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      path: file.path,
      cid: file.filename // Content ID for embedding in HTML
    })) : [];

    const imageHtml = replyImages.map(img => 
      `<img src="cid:${img}" style="max-width: 100%; margin: 10px 0;" />`
    ).join('');

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'your-email@example.com',
      to: survey.email,
      subject: 'Survey Request Response',
      html: `
        <h1>Survey Request Response</h1>
        <p>Dear ${survey.name},</p>
        <p>${message}</p>
        ${imageHtml}
        <p>Best regards,<br>Admin Team</p>
      `,
      attachments: imageAttachments
    });
  } catch (error) {
    console.error('Email sending error:', error);
  }

  res.status(200).json({
    success: true,
    data: survey
  });
});