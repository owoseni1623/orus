const Property = require('../models/Property');
const asyncHandler = require('express-async-handler');

// @desc    Get all properties
// @route   GET /api/properties
exports.getProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find().sort('-createdAt');
  res.json(properties);
});

// @desc    Get single property
// @route   GET /api/properties/:id
exports.getProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }
  res.json(property);
});

// @desc    Create property
// @route   POST /api/properties
// In your property controller:
exports.createProperty = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      price,
      location,
      bedrooms,
      bathrooms,
      area,
      type,
      yearBuilt,
      features,
      images,
      isAvailable
    } = req.body;

    // Clean up image paths to only store filenames
    const processedImages = images.map(image => {
      if (image.startsWith('http://') || image.startsWith('https://')) {
        return image;
      }
      // Extract just the filename, removing any path prefixes
      return image.split(/[\/\\]/).pop();
    });

    const property = await Property.create({
      title,
      price,
      location,
      bedrooms,
      bathrooms,
      area,
      type,
      yearBuilt,
      features: Array.isArray(features) ? features : [],
      images: processedImages,
      isAvailable: isAvailable ?? true
    });

    res.status(201).json({
      success: true,
      data: property
    });
  } catch (error) {
    console.error('Property creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update property
// @route   PUT /api/properties/:id
exports.updateProperty = asyncHandler(async (req, res) => {
  let property = await Property.findById(req.params.id);

  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  property = await Property.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: property
  });
});

// @desc    Delete property
// @route   DELETE /api/properties/:id
exports.deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  await property.deleteOne();
  res.json({ 
    success: true,
    message: 'Property removed' 
  });
});

// @desc    Search properties
// @route   GET /api/properties/search
exports.searchProperties = asyncHandler(async (req, res) => {
  const { minPrice, maxPrice, bedrooms, location } = req.query;

  let query = {};

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = minPrice;
    if (maxPrice) query.price.$lte = maxPrice;
  }

  if (bedrooms) {
    query.bedrooms = bedrooms;
  }

  if (location) {
    query.location = { $regex: location, $options: 'i' };
  }

  const properties = await Property.find(query).sort('-createdAt');
  res.json({
    success: true,
    count: properties.length,
    data: properties
  });
});