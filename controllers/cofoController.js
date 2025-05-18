const COFO = require('../models/COFO');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer storage
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'cofo');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cofo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf|avif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpeg, .jpg, .png, .pdf, and .avif files are allowed'));
    }
  }
}).array('documents', 10); // Allow up to 10 files

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// @desc    Create a new COFO application with documents
// @route   POST /api/v1/cofo
// @access  Private
exports.createCOFO = asyncHandler(async (req, res, next) => {
  try {
    // Handle file upload with multer
    await new Promise((resolve, reject) => {
      upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
          reject(new ErrorResponse(`Multer upload error: ${err.message}`, 400));
        } else if (err) {
          reject(new ErrorResponse(err.message, 400));
        }
        resolve();
      });
    });

    // Log received data for debugging
    console.log('Received form data:', req.body);
    console.log('Received files:', req.files);

    // Extract form data
    const {
      fullName,
      email,
      phoneNumber,
      propertyLocation,
      propertyType,
      selectedPackage,
      additionalNotes,
      user
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !phoneNumber || !propertyLocation || !propertyType || !selectedPackage) {
      return next(new ErrorResponse('Please provide all required fields', 400));
    }

    // Create documents array from uploaded files
    const documents = req.files ? req.files.map(file => ({
      name: file.originalname,
      url: `/uploads/cofo/${file.filename}`,
      uploadedAt: Date.now(),
      uploadedBy: user // Use the user ID from the form data
    })) : [];

    // Create COFO application
    const cofo = await COFO.create({
      fullName,
      email,
      phoneNumber,
      propertyLocation,
      propertyType,
      selectedPackage,
      additionalNotes: additionalNotes || '',
      status: 'pending',
      currentStage: 1,
      user, // Use the user ID from the form data
      documents
    });

    res.status(201).json({
      success: true,
      data: cofo
    });

  } catch (error) {
    console.error('COFO creation error:', error);
    next(error);
  }
});

// @desc    Get all COFO applications
// @route   GET /api/v1/cofo
// @access  Private/Admin
exports.getCOFOs = asyncHandler(async (req, res, next) => {
  try {
    const cofos = await COFO.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email');

    res.status(200).json({
      success: true,
      count: cofos.length,
      data: cofos
    });
  } catch (error) {
    console.error('Error in getCOFOs:', error);
    next(error);
  }
});

// @desc    Get single COFO application
// @route   GET /api/v1/cofo/:id
// @access  Private
exports.getCOFO = asyncHandler(async (req, res, next) => {
  const cofo = await COFO.findById(req.params.id).populate('user', 'name email');

  if (!cofo) {
    return next(new ErrorResponse(`COFO not found with id of ${req.params.id}`, 404));
  }

  // Check if user is owner or admin
  if (cofo.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access this COFO', 401));
  }

  res.status(200).json({
    success: true,
    data: cofo
  });
});

// @desc    Update COFO application stage and status
// @route   PUT /api/v1/cofo/:id/stage
// @access  Private/Admin
exports.updateCOFOStage = asyncHandler(async (req, res, next) => {
  try {
    const { status, currentStage } = req.body;
    let cofo = await COFO.findById(req.params.id);

    if (!cofo) {
      return next(new ErrorResponse(`COFO not found with id of ${req.params.id}`, 404));
    }

    // Update COFO
    cofo = await COFO.findByIdAndUpdate(
      req.params.id,
      { status, currentStage },
      {
        new: true,
        runValidators: true
      }
    );

    // Send email notification about status change
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: cofo.email,
        subject: 'COFO Application Status Update',
        html: `
          <h1>Application Status Update</h1>
          <p>Dear ${cofo.fullName},</p>
          <p>Your Certificate of Occupancy application has been updated:</p>
          <ul>
            <li>Current Stage: ${currentStage}</li>
            <li>Status: ${status}</li>
          </ul>
          <p>We will continue to keep you updated on any changes.</p>
          <p>Best regards,<br>Admin Team</p>
        `
      });
    } catch (error) {
      console.error('Email sending error:', error);
    }

    res.status(200).json({
      success: true,
      data: cofo
    });
  } catch (error) {
    console.error('Error updating COFO stage:', error);
    next(error);
  }
});

// @desc    Delete COFO application
// @route   DELETE /api/v1/cofo/:id
// @access  Private/Admin
exports.deleteCOFO = asyncHandler(async (req, res, next) => {
  const cofo = await COFO.findById(req.params.id);

  if (!cofo) {
    return next(new ErrorResponse(`COFO not found with id of ${req.params.id}`, 404));
  }

  await cofo.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get logged in user's COFO applications
// @route   GET /api/v1/cofo/my-applications
// @access  Private
exports.getMyCOFOs = asyncHandler(async (req, res, next) => {
  const cofos = await COFO.find({ user: req.user.id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: cofos.length,
    data: cofos
  });
});

// @desc    Submit document for COFO application
// @route   POST /api/v1/cofo/:id/documents
// @access  Private
exports.submitDocument = asyncHandler(async (req, res, next) => {
  const cofo = await COFO.findById(req.params.id);

  if (!cofo) {
    return next(new ErrorResponse(`COFO not found with id of ${req.params.id}`, 404));
  }

  // Check if user is owner
  if (cofo.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to submit documents for this COFO', 401));
  }

  // Add document to COFO
  cofo.documents.push({
    name: req.body.name,
    url: req.body.url
  });

  await cofo.save();

  res.status(200).json({
    success: true,
    data: cofo
  });
});

exports.replyToApplication = asyncHandler(async (req, res, next) => {
    try {
      const { message } = req.body;
      const cofo = await COFO.findById(req.params.id);
  
      if (!cofo) {
        return next(new ErrorResponse(`COFO not found with id of ${req.params.id}`, 404));
      }
  
      // Send email reply
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: cofo.email,
        subject: 'Reply to Your COFO Application',
        html: `
          <h1>COFO Application Update</h1>
          <p>Dear ${cofo.fullName},</p>
          <p>${message}</p>
          <p>Best regards,<br>Admin Team</p>
        `
      });
  
      res.status(200).json({
        success: true,
        message: 'Reply sent successfully'
      });
    } catch (error) {
      console.error('Error sending reply:', error);
      next(error);
    }
  });