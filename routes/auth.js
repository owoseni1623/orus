const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile 
} = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middleware/validation');
const { protect } = require('../middleware/auth');  // Changed this line to destructure protect

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', registerValidation, registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', loginValidation, loginUser);

// @route   GET /api/auth/me
// @desc    Get logged in user details
router.get('/me', protect, getUserProfile);  // Changed authMiddleware to protect

module.exports = router;