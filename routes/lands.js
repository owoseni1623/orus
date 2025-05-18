const express = require('express');
const router = express.Router();
const { 
  getLands, 
  getLand, 
  createLand, 
  updateLand, 
  deleteLand,
  searchLands,
  fixImagePaths
} = require('../controllers/landController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getLands)
  .post(protect, authorize('admin'), createLand);

router.route('/search')
  .get(searchLands);

router.route('/:id')
  .get(getLand)
  .put(protect, authorize('admin'), updateLand)
  .delete(protect, authorize('admin'), deleteLand);

  router.route('/fix-image-paths')
  .get(protect, authorize('admin'), fixImagePaths);

module.exports = router;