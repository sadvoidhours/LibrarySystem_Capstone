const { body } = require('express-validator');
const crypto = require('crypto');
const axios = require('axios');
const Book = require('../models/Book');
const asyncHandler = require('../utils/asyncHandler');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createBookValidation = [
  body('title').trim().notEmpty(),
  body('author').trim().notEmpty(),
  body('isbn').optional().trim(),
  body('category').optional().trim(),
  body('publication_year').optional().isInt({ min: 0 }),
  body('total_copies').optional().isInt({ min: 0 }),
  body('available_copies').optional().isInt({ min: 0 }),
  body('coverImageUrl').optional().trim(),
  body('backCoverImageUrl').optional().trim(),
  body('barcodeString').optional().trim()
];

const updateBookValidation = [
  body('title').optional().trim().notEmpty(),
  body('author').optional().trim().notEmpty(),
  body('isbn').optional().trim(),
  body('publication_year').optional().isInt({ min: 0 }),
  body('total_copies').optional().isInt({ min: 0 }),
  body('available_copies').optional().isInt({ min: 0 }),
  body('coverImageUrl').optional().trim(),
  body('backCoverImageUrl').optional().trim()
];

const BOOK_FIELDS = ['title', 'author', 'isbn', 'category', 'publication_year', 'total_copies', 'available_copies', 'coverImageUrl', 'backCoverImageUrl'];

const pickBookFields = (source) => BOOK_FIELDS.reduce((accumulator, field) => {
  if (Object.prototype.hasOwnProperty.call(source, field)) {
    accumulator[field] = source[field];
  }

  return accumulator;
}, {});

const parseCopyCount = (value, fallback) => {
  if (value === '' || value === null || value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeIsbn = (value) => String(value || '').trim().replace(/[^0-9Xx]/g, '').toUpperCase();

const pickFirst = (...values) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== '') || '';

const extractGoogleBookData = (item) => {
  const volumeInfo = item?.volumeInfo || {};
  const identifiers = Array.isArray(volumeInfo.industryIdentifiers) ? volumeInfo.industryIdentifiers : [];
  const isbn = pickFirst(
    identifiers.find((entry) => entry.type === 'ISBN_13')?.identifier,
    identifiers.find((entry) => entry.type === 'ISBN_10')?.identifier,
    volumeInfo.subtitle,
  );

  return {
    title: pickFirst(volumeInfo.title),
    author: Array.isArray(volumeInfo.authors) ? volumeInfo.authors.join(', ') : pickFirst(volumeInfo.authors),
    isbn: normalizeIsbn(isbn),
    category: Array.isArray(volumeInfo.categories) ? volumeInfo.categories[0] : pickFirst(volumeInfo.categories),
    publication_year: volumeInfo.publishedDate ? Number(String(volumeInfo.publishedDate).slice(0, 4)) || null : null,
    coverImageUrl: pickFirst(volumeInfo.imageLinks?.thumbnail, volumeInfo.imageLinks?.smallThumbnail),
    backCoverImageUrl: ''
  };
};

const extractOpenLibraryData = (data) => ({
  title: pickFirst(data?.title),
  author: Array.isArray(data?.authors) ? data.authors.map((author) => author?.name).filter(Boolean).join(', ') : '',
  isbn: normalizeIsbn(Array.isArray(data?.identifiers?.isbn_13) ? data.identifiers.isbn_13[0] : Array.isArray(data?.identifiers?.isbn_10) ? data.identifiers.isbn_10[0] : ''),
  category: Array.isArray(data?.subjects) ? data.subjects[0]?.name : '',
  publication_year: data?.publish_date ? Number(String(data.publish_date).match(/\d{4}/)?.[0]) || null : null,
  coverImageUrl: pickFirst(data?.cover?.large, data?.cover?.medium, data?.cover?.small),
  backCoverImageUrl: ''
});

const lookupByIsbnWeb = async (isbn) => {
  const normalizedIsbn = normalizeIsbn(isbn);

  if (!normalizedIsbn) {
    return null;
  }

  const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(normalizedIsbn)}&maxResults=1`;
  const openLibraryUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(normalizedIsbn)}&format=json&jscmd=data`;

  try {
    const { data } = await axios.get(googleUrl, { timeout: 8000 });
    const item = data?.items?.[0];
    if (item) {
      return extractGoogleBookData(item);
    }
  } catch (error) {
    // fallback below
  }

  try {
    const { data } = await axios.get(openLibraryUrl, { timeout: 8000 });
    const openLibraryItem = data?.[`ISBN:${normalizedIsbn}`];
    if (openLibraryItem) {
      return extractOpenLibraryData(openLibraryItem);
    }
  } catch (error) {
    // fall through
  }

  return null;
};

const generateBookBarcode = (isbn) => {
  const normalizedIsbn = normalizeIsbn(isbn);
  const suffix = crypto.randomUUID().split('-')[0].toUpperCase();
  return normalizedIsbn ? `ISBN-${normalizedIsbn}-${suffix}` : `BOOK-${suffix}`;
};

const normalizeCopyCounts = (totalCopies, availableCopies) => {
  const normalizedTotal = Number.isFinite(totalCopies) ? Math.max(0, totalCopies) : 1;
  const normalizedAvailable = Number.isFinite(availableCopies) ? Math.max(0, availableCopies) : normalizedTotal;

  return {
    total_copies: Math.max(normalizedTotal, normalizedAvailable),
    available_copies: Math.min(Math.max(normalizedAvailable, 0), Math.max(normalizedTotal, normalizedAvailable))
  };
};

const normalizeBook = (book) => {
  const copyCounts = normalizeCopyCounts(Number(book.total_copies), Number(book.available_copies));

  return {
    ...book.toObject ? book.toObject() : book,
    ...copyCounts
  };
};

const listBooks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, q = '', category = '' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = {
    ...(q
      ? {
          $or: [
              { title: { $regex: escapeRegex(q), $options: 'i' } },
              { author: { $regex: escapeRegex(q), $options: 'i' } }
          ]
        }
      : {}),
    ...(category ? { category: { $regex: `^${escapeRegex(category)}$`, $options: 'i' } } : {})
  };

  const [items, total] = await Promise.all([
    Book.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Book.countDocuments(query)
  ]);

  return res.json({ items: items.map(normalizeBook), page: Number(page), limit: Number(limit), total });
});

const lookupBookByIsbn = asyncHandler(async (req, res) => {
  const isbn = normalizeIsbn(req.query.isbn || req.body.isbn);

  if (!isbn) {
    return res.status(400).json({ message: 'ISBN is required' });
  }

  const existingBook = await Book.findOne({ isbn }).lean();
  if (existingBook) {
    return res.json({
      source: 'library',
      book: normalizeBook(existingBook),
      found: true
    });
  }

  const webBook = await lookupByIsbnWeb(isbn);
  if (!webBook) {
    return res.status(404).json({ message: 'No book details found for that ISBN' });
  }

  return res.json({
    source: 'web',
    book: webBook,
    found: true
  });
});

const createBook = asyncHandler(async (req, res) => {
  const requestedTotal = parseCopyCount(req.body.total_copies, 1);
  const requestedAvailable = parseCopyCount(req.body.available_copies, requestedTotal);
  const copyCounts = normalizeCopyCounts(
    requestedTotal,
    requestedAvailable
  );

  const payload = {
    ...pickBookFields(req.body),
    publication_year: parseCopyCount(req.body.publication_year, null),
    ...copyCounts,
    coverImageUrl: req.body.coverImageUrl || '',
    backCoverImageUrl: req.body.backCoverImageUrl || '',
    barcodeString: String(req.body.barcodeString || '').trim() || generateBookBarcode(req.body.isbn)
  };

  const book = await Book.create(payload);
  return res.status(201).json(book);
});

const updateBook = asyncHandler(async (req, res) => {
  const payload = pickBookFields(req.body);
  const currentBook = await Book.findById(req.params.id);

  if (!currentBook) {
    return res.status(404).json({ message: 'Book not found' });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'publication_year')) {
    payload.publication_year = parseCopyCount(req.body.publication_year, null);
  }

  const nextTotal = Object.prototype.hasOwnProperty.call(req.body, 'total_copies')
    ? parseCopyCount(req.body.total_copies, currentBook.total_copies)
    : currentBook.total_copies;
  const nextAvailable = Object.prototype.hasOwnProperty.call(req.body, 'available_copies')
    ? parseCopyCount(req.body.available_copies, currentBook.available_copies)
    : currentBook.available_copies;

  const copyCounts = normalizeCopyCounts(nextTotal, nextAvailable);

  payload.total_copies = copyCounts.total_copies;
  payload.available_copies = copyCounts.available_copies;

  if (Object.prototype.hasOwnProperty.call(req.body, 'coverImageUrl')) {
    payload.coverImageUrl = req.body.coverImageUrl || '';
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'backCoverImageUrl')) {
    payload.backCoverImageUrl = req.body.backCoverImageUrl || '';
  }

  const book = await Book.findByIdAndUpdate(req.params.id, payload, { new: true });
  return res.json(book);
});

const deleteBook = asyncHandler(async (req, res) => {
  const deleted = await Book.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: 'Book not found' });
  }

  return res.json({ message: 'Book deleted' });
});

module.exports = {
  createBookValidation,
  updateBookValidation,
  listBooks,
  lookupBookByIsbn,
  createBook,
  updateBook,
  deleteBook
};
