const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    author: { type: String, required: true, trim: true, index: true },
    isbn: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, index: true },
    available_copies: { type: Number, required: true, min: 0, default: 1 },
    coverImageUrl: { type: String, default: '' },
    barcodeString: { type: String, required: true, unique: true, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model('Book', bookSchema);
