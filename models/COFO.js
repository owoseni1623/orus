const mongoose = require('mongoose');

const COFOSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please provide your full name']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please provide a phone number']
  },
  propertyLocation: {
    type: String,
    required: [true, 'Please provide property location']
  },
  propertyType: {
    type: String,
    required: [true, 'Please select property type'],
    enum: ['residential', 'commercial', 'industrial']
  },
  additionalNotes: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'verified', 'approved', 'rejected'],
    default: 'pending'
  },
  currentStage: {
    type: Number,
    default: 1,
    min: 1,
    max: 4
  },
  selectedPackage: {
    type: String,
    enum: ['Standard Processing', 'Premium Express', 'VIP Acceleration'],
    required: [true, 'Please select a processing package']
  },
  documents: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('COFO', COFOSchema);