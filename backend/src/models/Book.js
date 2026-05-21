const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    author: { type: String, required: true, trim: true, index: true },
    edition: { type: String, trim: true, default: '' },
    publisher: { type: String, trim: true, default: '' },
    place_of_publication: { type: String, trim: true, default: '' },
    isbn: { type: String, trim: true, default: '' },
    format: { type: String, trim: true, default: '' },
    physical_description: { type: String, trim: true, default: '' },
    subject_headings: { type: [String], default: [] },
    language: { type: String, trim: true, default: '' },
    shelf_location: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    date_added: { type: Date, default: Date.now },
    category: { type: String, trim: true, index: true },
    publication_year: { type: Number, min: 0, default: null },
    total_copies: { type: Number, required: true, min: 0, default: 1 },
    available_copies: { type: Number, required: true, min: 0, default: 1 },
    coverImageUrl: { type: String, default: '' },
    backCoverImageUrl: { type: String, default: '' },
    barcodeString: { type: String, required: false, unique: true, sparse: true, index: true }
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
