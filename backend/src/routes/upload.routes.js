const express = require('express');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { uploadSingle, uploadImage } = require('../controllers/upload.controller');

const router = express.Router();

router.post(
  '/image',
  protect,
  authorize('student', 'faculty', 'admin', 'superadmin'),
  uploadSingle('image'),
  uploadImage
);

module.exports = router;
