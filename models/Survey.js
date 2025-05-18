const mongoose = require('mongoose');

const SurveySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
      'Please provide a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  landLocation: {
    type: String,
    required: [true, 'Please provide land location'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  additionalDetails: {
    type: String,
    maxlength: [500, 'Additional details cannot exceed 500 characters']
  },
  images: [{
    type: String,
    maxlength: [200, 'Image path cannot exceed 200 characters']
  }],
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  adminReply: {
    message: String,
    images: [{
      type: String,
      maxlength: [200, 'Image path cannot exceed 200 characters']
    }],
    sentAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Survey', SurveySchema);