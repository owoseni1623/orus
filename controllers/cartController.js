const mongoose = require('mongoose');
const Block = require('../models/Block');
const Cart = require('../models/Cart');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res, next) => {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate({
        path: 'items.block',
        select: 'title category size price strength images stock'
      });
    
    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: []
      });
    }
  
    // Update with current block data
    const updatedItems = [];
    for (const item of cart.items) {
      const block = await Block.findById(item.block);
      if (block && block.stock > 0) {
        item.title = block.title;
        item.category = block.category;
        item.size = block.size;
        item.price = block.price;
        item.strength = block.strength;
        item.images = block.images;
        item.stock = block.stock;
        
        // Adjust quantity if it's below minimum or exceeds stock
        if (item.quantity < 200) {
          item.quantity = 200;
        } else if (item.quantity > block.stock) {
          item.quantity = block.stock;
        }
        
        updatedItems.push(item);
      }
    }
    
    cart.items = updatedItems;
    await cart.save();
  
    res.status(200).json({
      success: true,
      data: cart
    });
  });
  
  // @desc    Add item to cart
  // @route   POST /api/cart
  // @access  Private
  exports.addToCart = asyncHandler(async (req, res, next) => {
    const { blockId, quantity = 200 } = req.body;
  
    // Validate input
    if (!blockId) {
      return next(new ErrorResponse('Please provide a block ID', 400));
    }
  
    if (!Number.isInteger(quantity)) {
      return next(new ErrorResponse('Quantity must be a whole number', 400));
    }
  
    if (quantity < 200) {
      return next(new ErrorResponse('Minimum quantity is 200 items', 400));
    }
  
    // Find block
    const block = await Block.findById(blockId);
    if (!block) {
      return next(new ErrorResponse('Block not found', 404));
    }
  
    // Find or create cart
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: []
      });
    }
  
    // Check if item exists in cart
    const itemIndex = cart.items.findIndex(item => 
      item.block.toString() === blockId
    );
  
    if (itemIndex > -1) {
      // Update existing item
      cart.items[itemIndex] = {
        ...cart.items[itemIndex],
        quantity: cart.items[itemIndex].quantity + quantity,
        price: block.price,
        stock: block.stock,
        title: block.title,
        category: block.category,
        size: block.size,
        strength: block.strength,
        images: block.images
      };
    } else {
      // Add new item
      cart.items.push({
        block: blockId,
        quantity: Math.max(200, quantity),
        title: block.title,
        category: block.category,
        size: block.size,
        price: block.price,
        strength: block.strength,
        images: block.images,
        stock: block.stock
      });
    }
  
    await cart.save();
  
    // Populate block details before sending response
    cart = await Cart.findById(cart._id).populate({
      path: 'items.block',
      select: 'title category size price strength images stock'
    });
  
    res.status(200).json({
      success: true,
      data: cart
    });
  });

// @desc    Update cart item quantity
// @route   PUT /api/cart/:blockId
// @access  Private
exports.updateCartItem = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;
  const { blockId } = req.params;

  // Validate input
  if (!mongoose.Types.ObjectId.isValid(blockId)) {
      return next(new ErrorResponse('Invalid Block ID', 400));
  }

  if (!Number.isInteger(quantity)) {
      return next(new ErrorResponse('Quantity must be a whole number', 400));
  }

  // Optional: Minimum quantity check
  if (quantity < 1) {
      return next(new ErrorResponse('Minimum quantity is 1 item', 400));
  }

  // Find the block first to ensure it exists and get its details
  const block = await Block.findById(blockId);
  if (!block) {
      return next(new ErrorResponse('Block not found', 404));
  }

  // Use findOneAndUpdate for a more efficient update
  const cart = await Cart.findOneAndUpdate(
    { 
      user: req.user.id, 
      'items.block': blockId 
    },
    { 
      $set: { 
        'items.$.quantity': Math.min(quantity, block.stock),
        'items.$.title': block.title,
        'items.$.category': block.category,
        'items.$.size': block.size,
        'items.$.price': block.price,
        'items.$.strength': block.strength,
        'items.$.images': block.images,
        'items.$.stock': block.stock
      } 
    },
    { 
      new: true,  // Return the updated document
      upsert: true,  // Create the document if it doesn't exist
      setDefaultsOnInsert: true 
    }
  );

  // Populate and return the updated cart
  const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.block',
      select: 'title category size price strength images stock'
  });

  res.status(200).json({
      success: true,
      data: populatedCart
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:blockId
// @access  Private
exports.removeFromCart = asyncHandler(async (req, res, next) => {
  const { blockId } = req.params;
  
  if (!blockId) {
    return next(new ErrorResponse('Invalid block ID', 400));
  }

  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  // Find item by block ID instead of item ID
  const itemIndex = cart.items.findIndex(item => 
    item.block.toString() === blockId.toString()
  );

  if (itemIndex === -1) {
    return next(new ErrorResponse('Item not found in cart', 404));
  }

  // Remove the item
  cart.items.splice(itemIndex, 1);
  await cart.save();

  // Populate and return the updated cart
  cart = await Cart.findById(cart._id).populate({
    path: 'items.block',
    select: 'title category size price strength images stock isAvailable'
  });

  res.status(200).json({
    success: true,
    data: cart
  });
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user.id });
  
  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  cart.items = [];
  await cart.save();

  res.status(200).json({
    success: true,
    data: { items: [] }
  });
});

module.exports = exports;