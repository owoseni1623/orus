const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const errorHandler = require('./middleware/error');
const morgan = require('morgan');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const fs = require('fs').promises;
const multer = require('multer');
const mongoSanitize = require('express-mongo-sanitize');
const { protect, authorize } = require('./middleware/auth');
const surveyRoutes = require('./routes/surveys');
const cofoRoute = require('./routes/cofoRoute');
const engineeringRoutes = require('./routes/engineeringRoutes');
const investmentInquiryRoutes = require('./routes/investmentInquiryRoutes');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to Database
connectDB();

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    let uploadDir = path.join(__dirname, 'uploads', 'lands');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directory:', error);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Remove path prefixes and normalize the filename
    const sanitizedName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '-');
    const filename = `${Date.now()}-${sanitizedName}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp|avif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: Images Only!'));
  }
});

app.get('/test-file-serving', (req, res) => {
  res.json({
    uploadDir: path.join(__dirname, 'uploads'),
    exists: fs.existsSync(path.join(__dirname, 'uploads')),
    files: fs.existsSync(path.join(__dirname, 'uploads')) 
      ? fs.readdirSync(path.join(__dirname, 'uploads/investment-responses')).slice(0, 5) 
      : []
  });
});

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "blob:", process.env.CLIENT_URL || 'http://localhost:5173'],
    },
  },
}));
app.use(xss());
app.use(mongoSanitize());
app.use(hpp());

// CORS Configuration
const corsOptions = {
  origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads/cofo', express.static(path.join(__dirname, 'uploads', 'cofo')));
app.use('/uploads/engineering', express.static(path.join(__dirname, 'uploads', 'engineering')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Image request logging middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api/uploads/lands')) {
    console.log('Image request:', {
      path: req.path,
      fullUrl: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  next();
});

// Block images serving route
app.use('/uploads/blocks', (req, res) => {
  try {
    // Clean up the filename by removing any path prefixes and normalizing slashes
    const rawFilename = decodeURIComponent(path.basename(req.path));
    const filename = rawFilename.replace(/^uploads[\/\\]/, ''); // Remove 'uploads/' or 'uploads\' prefix
    
    const fullPath = path.join(__dirname, 'uploads', 'blocks', filename);
    
    // Security check
    if (!fullPath.startsWith(path.join(__dirname, 'uploads', 'blocks'))) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: Invalid path'
      });
    }

    // Set headers
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cache-Control': 'public, max-age=31536000',
      'Vary': 'Origin'
    });

    // Send file
    res.sendFile(fullPath, (err) => {
      if (err) {
        console.error('Error sending file:', {
          error: err,
          filename,
          path: fullPath,
          originalPath: req.path
        });
        if (!res.headersSent) {
          res.status(404).json({
            success: false,
            message: 'Image not found'
          });
        }
      }
    });
  } catch (err) {
    console.error('Error handling image request:', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Server error while processing image request'
      });
    }
  }
});

// Properties upload route
app.use('/uploads/properties', (req, res, next) => {
  const normalizedPath = path.normalize(req.path).replace(/^(\.\.[\/\\])+/, '');
  const fullPath = path.join(__dirname, 'uploads', 'properties', normalizedPath);
  
  if (!fullPath.startsWith(path.join(__dirname, 'uploads', 'properties'))) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied: Invalid path'
    });
  }
  
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Cache-Control': 'public, max-age=31536000',
    'Vary': 'Origin'
  });
  
  next();
}, express.static(path.join(__dirname, 'uploads', 'properties')));

// Land images serving route
app.use('/uploads/lands', (req, res) => {
  try {
    // Decode and clean up the filename
    const rawFilename = decodeURIComponent(path.basename(req.path));
    const filename = rawFilename
      .replace(/^["']|["']$/g, '') // Remove extra quotes
      .replace(/^uploads[/\\]/, '') // Remove 'uploads/' or 'uploads\' prefix
      .replace(/\\/g, '/') // Normalize to forward slashes
      .split('/').pop(); // Get the actual filename

    const fullPath = path.join(__dirname, 'uploads', 'lands', filename);
    
    // Comprehensive logging
    console.log('Image Request Details:', {
      requestedFilename: filename,
      fullPath,
      fileExists: require('fs').existsSync(fullPath)
    });

    // Check if file exists
    if (!require('fs').existsSync(fullPath)) {
      console.error(`Image not found: ${fullPath}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Image not found',
        filename: filename
      });
    }

    // Set headers
    res.set({
      'Content-Type': 'image/jpeg', // or appropriate mime type
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400', // 1 day cache
    });

    // Send file
    res.sendFile(fullPath);
  } catch (err) {
    console.error('Image Serving Error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error processing image'
    });
  }
});

// Upload routes
app.post('/api/upload/properties', protect, authorize('admin'), upload.array('images', 5), async (req, res) => {
  try {
    const urls = req.files.map(file => file.filename);
    res.status(200).json({ 
      success: true, 
      urls 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
});

app.post('/api/upload/lands', protect, authorize('admin'), upload.array('images', 5), async (req, res) => {
  try {
    const urls = req.files.map(file => file.filename);
    res.status(200).json({ 
      success: true, 
      urls 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
});

// Maintenance routes
app.get('/api/maintenance/fix-image-paths', protect, async (req, res) => {
  try {
    const Land = require('./models/Land');
    const lands = await Land.find({});
    let updated = 0;
    
    for (let land of lands) {
      if (land.images && land.images.length > 0) {
        const fixedImages = land.images.map(image => {
          // Normalize to forward slashes and remove any 'uploads/' prefix
          return image.replace(/\\/g, '/').replace(/^uploads[/\\]/, '');
        });
        
        await Land.findByIdAndUpdate(land._id, { images: fixedImages });
        updated++;
      }
    }
    
    res.json({ 
      success: true, 
      message: `Updated ${updated} land records successfully` 
    });
  } catch (error) {
    console.error('Error fixing paths:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Serve investment inquiry documents
app.use('/uploads/investment-inquiries', protect, authorize('admin'), (req, res, next) => {
  const normalizedPath = path.normalize(req.path).replace(/^(\.\.[\/\\])+/, '');
  const fullPath = path.join(__dirname, 'uploads', 'investment-inquiries', normalizedPath);
  
  if (!fullPath.startsWith(path.join(__dirname, 'uploads', 'investment-inquiries'))) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied: Invalid path'
    });
  }
  
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Vary': 'Origin'
  });
  
  next();
}, express.static(path.join(__dirname, 'uploads', 'investment-inquiries')));

// Serve investment response images
app.use('/uploads/investment-responses', (req, res, next) => {
  const normalizedPath = path.normalize(req.path).replace(/^(\.\.[\/\\])+/, '');
  const fullPath = path.join(__dirname, 'uploads', 'investment-responses', normalizedPath);
  
  if (!fullPath.startsWith(path.join(__dirname, 'uploads', 'investment-responses'))) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied: Invalid path'
    });
  }
  
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Cache-Control': 'public, max-age=31536000',
    'Vary': 'Origin'
  });
  
  next();
}, express.static(path.join(__dirname, 'uploads', 'investment-responses')));

// Placeholder image endpoint
app.get('/api/placeholder/:width/:height', (req, res) => {
  const placeholder = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': placeholder.length,
    'Cache-Control': 'public, max-age=31536000',
    'Access-Control-Allow-Origin': '*',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Vary': 'Origin'
  });
  res.end(placeholder);
});

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/lands', require('./routes/lands'));
app.use('/api/blocks', require('./routes/blocks'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/surveys', require('./routes/surveys'));
app.use('/api/v1/cofo', require('./routes/cofoRoute'));
app.use('/api/engineering', require('./routes/engineeringRoutes'));
app.use('/api/investment-inquiries', investmentInquiryRoutes);

// Handle undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot find ${req.originalUrl} on this server`
  });
});

// Error Handler Middleware
app.use(errorHandler);

// Ensure required directories exist
async function ensureDirectories() {
  const dirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads', 'blocks'),
    path.join(__dirname, 'uploads', 'properties'),
    path.join(__dirname, 'uploads', 'lands'),
    path.join(__dirname, 'uploads', 'engineering'),
    path.join(__dirname, 'uploads', 'investment-inquiries'),
    path.join(__dirname, 'uploads', 'investment-responses')
  ];
  
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }
}

// Port configuration
const PORT = process.env.PORT || 3000;

// Start Server
const server = app.listen(PORT, async () => {
  await ensureDirectories();
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = server;