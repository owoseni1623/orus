const path = require('path');

/**
 * Adds full image URLs to block documents
 * @param {Object|Array} blocks - Single block object or array of block objects
 * @param {Object} req - Express request object
 * @returns {Object|Array} Blocks with full image URLs
 */
const addFullImageUrls = (blocks, req) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  const processBlock = (block) => {
    const blockObj = block.toObject ? block.toObject() : { ...block };
    
    if (blockObj.images && Array.isArray(blockObj.images)) {
      blockObj.images = blockObj.images.map(image => {
        // Handle different image path scenarios
        if (image.startsWith('http')) {
          return image;
        }
        
        // Clean the image path
        const cleanPath = image.replace(/^\/+/, '');
        return `${baseUrl}/uploads/blocks/${cleanPath}`;
      });
    }
    
    return blockObj;
  };
  
  if (Array.isArray(blocks)) {
    return blocks.map(processBlock);
  }
  
  return processBlock(blocks);
};

/**
 * Validates image file types
 * @param {File} file - Upload file object
 * @returns {Boolean} Whether file is valid
 */
const isValidImageType = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return allowedTypes.includes(file.mimetype);
};

/**
 * Generates a unique filename for uploaded images
 * @param {String} originalname - Original filename
 * @returns {String} Unique filename
 */
const generateUniqueFileName = (originalname) => {
  const timestamp = Date.now();
  const extension = path.extname(originalname);
  const basename = path.basename(originalname, extension);
  return `${basename}-${timestamp}${extension}`;
};

module.exports = {
  addFullImageUrls,
  isValidImageType,
  generateUniqueFileName
};