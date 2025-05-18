const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');

// Protect middleware - Verifies JWT token
const protect = async (req, res, next) => {
  try {
    // Get token from various header formats
    const authHeader = req.headers.authorization || req.header('Authorization');
    
    // Handle different token formats
    let token;
    if (authHeader) {
      // Handle Bearer token format
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else {
        // Handle direct token format
        token = authHeader;
      }
    }

    // Also check for token in other common places
    if (!token) {
      token = req.header('x-auth-token') || req.cookies?.token;
    }

    // If still no token found
    if (!token) {
      return next(new ErrorResponse('Access denied. No token provided.', 401));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user data to request
      req.user = decoded.user || decoded; // Handle both formats
      
      // Add token to request for potential refresh logic
      req.token = token;
      
      // Proceed to next middleware/route handler
      next();
    } catch (err) {
      // Handle specific JWT errors
      if (err.name === 'TokenExpiredError') {
        return next(new ErrorResponse('Token has expired. Please log in again.', 401));
      }
      
      if (err.name === 'JsonWebTokenError') {
        return next(new ErrorResponse('Invalid token. Please log in again.', 401));
      }

      // Generic token verification error
      return next(new ErrorResponse('Invalid token. Access denied.', 401));
    }
  } catch (err) {
    // Log server-side error for debugging
    console.error('Auth Middleware Error:', err);
    return next(new ErrorResponse('Internal server error during authentication', 500));
  }
};

// Authorize middleware - Checks user roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('User not found on request. Authentication required.', 401));
    }

    // Check both role and userType
    if (!roles.includes(req.user.role) && !roles.includes(req.user.userType)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role || req.user.userType} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};


exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

module.exports = { protect, authorize };