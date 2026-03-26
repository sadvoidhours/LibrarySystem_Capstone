const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    author: { type: String, required: true, trim: true, index: true },
    isbn: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, index: true },
    publication_year: { type: Number, min: 0, default: null },
    total_copies: { type: Number, required: true, min: 0, default: 1 },
    available_copies: { type: Number, required: true, min: 0, default: 1 },
    coverImageUrl: { type: String, default: '' },
    backCoverImageUrl: { type: String, default: '' },
    barcodeString: { type: String, required: true, unique: true, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

bookSchema.set('toJSON', { virtuals: true });
bookSchema.set('toObject', { virtuals: true });

bookSchema.virtual('book_id').get(function bookId() {
  return this._id;
});

bookSchema.virtual('created_at').get(function createdAt() {
  return this.createdAt;
});

module.exports = mongoose.model('Book', bookSchema);
