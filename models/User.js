const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  userType: {
    type: String,
    enum: ['client', 'agent', 'admin'],
    default: 'client'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Add this to get more detailed error messages
  strict: true
});

// Pre-save middleware to log user creation
UserSchema.pre('save', function(next) {
  console.log('Attempting to save user:', {
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    userType: this.userType
  });
  next();
});

// Post-save middleware to confirm user creation
UserSchema.post('save', function(doc) {
  console.log('User saved successfully:', {
    id: doc._id,
    firstName: doc.firstName,
    email: doc.email
  });
});

module.exports = mongoose.model('User', UserSchema);