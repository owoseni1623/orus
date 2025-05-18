const mongoose = require('mongoose');

const engineeringSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  projectType: {
    type: String,
    required: [true, 'Please specify project type'],
    enum: ['residential', 'commercial', 'industrial', 'infrastructure']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  images: [{
    type: String,
    required: false
  }],
  status: {
    type: String,
    enum: ['pending', 'in-review', 'approved', 'rejected'],
    default: 'pending'
  },
  replies: [{
    message: {
      type: String,
      required: true
    },
    attachments: [{
      type: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'in-review', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Engineering', engineeringSchema);