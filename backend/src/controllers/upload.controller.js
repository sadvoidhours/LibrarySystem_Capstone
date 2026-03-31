const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder = req.query.folder || req.body.folder || 'ptc-library';

    return {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    };
  }
});

const upload = multer({ storage });

const uploadSingle = (fieldName = 'image') => upload.single(fieldName);

const uploadImage = asyncHandler((req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }

  return res.json({
    url: req.file.path,
    public_id: req.file.filename
  });
});

module.exports = { uploadSingle, uploadImage };
