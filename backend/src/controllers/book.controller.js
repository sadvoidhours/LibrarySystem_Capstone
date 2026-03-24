const { body } = require('express-validator');
const Book = require('../models/Book');

const createBookValidation = [
  body('title').trim().notEmpty(),
  body('author').trim().notEmpty(),
  body('category').optional().trim(),
  body('available_copies').isInt({ min: 0 }),
  body('barcodeString').trim().notEmpty()
];

const updateBookValidation = [
  body('title').optional().trim().notEmpty(),
  body('author').optional().trim().notEmpty(),
  body('available_copies').optional().isInt({ min: 0 })
];

const listBooks = async (req, res) => {
  const { page = 1, limit = 10, q = '', category = '' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = {
    ...(q
      ? {
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { author: { $regex: q, $options: 'i' } }
          ]
        }
      : {}),
    ...(category ? { category: { $regex: `^${category}$`, $options: 'i' } } : {})
  };

  const [items, total] = await Promise.all([
    Book.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Book.countDocuments(query)
  ]);

  return res.json({ items, page: Number(page), limit: Number(limit), total });
};

const createBook = async (req, res) => {
  const book = await Book.create(req.body);
  return res.status(201).json(book);
};

const updateBook = async (req, res) => {
  const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }

  return res.json(book);
};

const deleteBook = async (req, res) => {
  const deleted = await Book.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: 'Book not found' });
  }

  return res.json({ message: 'Book deleted' });
};

module.exports = {
  createBookValidation,
  updateBookValidation,
  listBooks,
  createBook,
  updateBook,
  deleteBook
};
