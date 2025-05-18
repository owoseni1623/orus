const express = require('express');
const { 
  createInquiry,
  getInquiries
} = require('../controllers/inquiryController');

const router = express.Router();

router.route('/')
  .get(getInquiries)
  .post(createInquiry);

module.exports = router;