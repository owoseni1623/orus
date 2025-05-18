const mongoose = require('mongoose');

const BlockSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Please specify the category'],
    enum: [
      'Solid Blocks',
      'Aerated Blocks',
      'Paving Blocks',
      'Hollow Blocks',
      'Special Blocks',
      'Architectural Blocks',
      'Sustainable Blocks',
      'Heavy-Duty Blocks'
    ]
  },
  size: {
    type: String,
    required: [true, 'Please specify the size']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price']
  },
  strength: {
    type: String,
    required: [true, 'Please specify the strength class']
  },
  features: [{
    type: String,
    required: true
  }],
  applications: [{
    type: String,
    required: true
  }],
  images: [{
    type: String,
    required: [true, 'Please add at least one image']
  }],
  technicalSpecs: {
    dimensions: {
      type: String,
      required: [true, 'Please specify dimensions']
    },
    weight: {
      type: String,
      required: [true, 'Please specify weight']
    },
    compressionStrength: {
      type: String,
      required: [true, 'Please specify compression strength']
    },
    waterAbsorption: {
      type: String,
      required: [true, 'Please specify water absorption']
    },
    thermalConductivity: {
      type: String,
      required: [true, 'Please specify thermal conductivity']
    }
  },
  stock: {
    type: Number,
    required: [true, 'Please specify stock quantity'],
    default: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add virtual for full image URLs
BlockSchema.virtual('fullImages').get(function() {
  if (!this.images) return [];
  const baseUrl = process.env.SERVER_URL || 'http://localhost:3000';
  return this.images.map(image => `${baseUrl}/uploads/blocks/${image}`);
});

// Update timestamp on save
BlockSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Block', BlockSchema);