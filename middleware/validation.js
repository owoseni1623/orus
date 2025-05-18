const { body } = require('express-validator');

exports.registerValidation = [
  body('firstName')
    .trim()
    .not().isEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters long'),
  
  body('lastName')
    .trim()
    .not().isEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters long'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .not().isEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9]{10,14}$/)
    .withMessage('Phone number must be between 10-14 digits'),
  
  body('password')
    .not().isEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must include uppercase, lowercase, number, and special character'),
  
  body('userType')
    .optional()
    .isIn(['client', 'agent', 'admin'])
    .withMessage('Invalid user type')
];

exports.loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('password')
    .not().isEmpty()
    .withMessage('Password is required')
];