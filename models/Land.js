const mongoose = require('mongoose');

const landSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price']
  },
  location: {
    type: String,
    required: [true, 'Please add a location']
  },
  size: {
    type: String,
    required: [true, 'Please add land size']
  },
  type: {
    type: String,
    required: [true, 'Please specify land type'],
    enum: ['residential', 'commercial', 'agricultural']
  },
  features: [{
    type: String
  }],
  images: [{
    type: String
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Land', landSchema);