const mongoose = require('mongoose');
const { body } = require('express-validator');
const Borrowing = require('../models/Borrowing');
const Book = require('../models/Book');
const User = require('../models/User');
const { calculatePenalty } = require('../services/penalty.service');
const { notifyUser } = require('../services/notification.service');
const { logAudit } = require('../services/audit.service');
const asyncHandler = require('../utils/asyncHandler');

const DEFAULT_BORROW_DAYS = Number(process.env.DEFAULT_BORROW_DAYS || 7);

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const runNonCriticalSideEffect = async (operationName, operation, meta = {}) => {
  try {
    await operation();
  } catch (error) {
    console.error(`[Borrowing] Non-critical side effect failed: ${operationName}`, {
      message: error?.message,
      ...meta
    });
  }
};

const resolveDueDays = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 60) {
    return parsed;
  }

  return DEFAULT_BORROW_DAYS;
};

const requestBorrowValidation = [
  body('bookId').isMongoId()
];

const approveRejectValidation = [
  body('dueDays').optional().isInt({ min: 1, max: 60 }),
  body('remarks').optional().isString()
];

const scanBorrowValidation = [
  body('userBarcode').notEmpty(),
  body('bookIsbn').optional().notEmpty(),
  body('bookBarcode').optional().notEmpty(),
  body('dueDays').optional().isInt({ min: 1, max: 60 })
];

const scanReturnValidation = [
  body('userBarcode').notEmpty(),
  body('bookIsbn').optional().notEmpty(),
  body('bookBarcode').optional().notEmpty()
];

const normalizeIsbn = (value) => String(value || '').replace(/[^0-9Xx]/g, '').trim();

const resolveScannedBook = async (rawValue) => {
  const normalized = String(rawValue || '').trim();
  const normalizedIsbn = normalizeIsbn(normalized);

  if (!normalized) {
    return null;
  }

  return Book.findOne({
    $or: [
      { isbn: normalizedIsbn },
      { isbn: normalized },
      { barcodeString: normalized }
    ]
  });
};

const myBorrowings = asyncHandler(async (req, res) => {
  const borrowings = await Borrowing.find({ userId: req.user._id })
    .populate('bookId', 'title author coverImageUrl barcodeString')
    .sort({ createdAt: -1 });

  return res.json(borrowings);
});

const requestBorrow = asyncHandler(async (req, res) => {
  const { bookId } = req.body;

  const book = await Book.findById(bookId);
  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }

  const existingRequest = await Borrowing.findOne({
    userId: req.user._id,
    bookId,
    status: 'Pending'
  });

  if (existingRequest) {
    return res.status(409).json({ message: 'You already have a pending request for this book' });
  }

  const borrowing = await Borrowing.create({
    userId: req.user._id,
    bookId,
    status: 'Pending'
  });

  await runNonCriticalSideEffect(
    'BORROW_REQUEST_CREATED_AUDIT',
    () =>
      logAudit({
        actorId: req.user._id,
        actorRole: req.user.role,
        action: 'BORROW_REQUEST_CREATED',
        metadata: { borrowingId: borrowing._id, bookId }
      }),
    { borrowingId: String(borrowing._id) }
  );

  return res.status(201).json(borrowing);
});

const approveBorrow = asyncHandler(async (req, res) => {
  const { dueDays, remarks = '' } = req.body;
  const resolvedDueDays = resolveDueDays(dueDays);

  const borrowing = await Borrowing.findById(req.params.id);
  if (!borrowing) {
    return res.status(404).json({ message: 'Borrowing not found' });
  }

  if (borrowing.status !== 'Pending') {
    return res.status(400).json({ message: 'Only pending requests can be approved' });
  }

  const conflictingBorrowing = await Borrowing.findOne({
    _id: { $ne: borrowing._id },
    userId: borrowing.userId,
    bookId: borrowing.bookId,
    status: { $in: ['Active', 'Overdue'] }
  });

  if (conflictingBorrowing) {
    return res.status(409).json({ message: 'This book is already borrowed by the selected user.' });
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const book = await Book.findById(borrowing.bookId).session(session);
      if (!book || book.available_copies < 1) {
        throw new Error('No available copies');
      }

      book.available_copies -= 1;
      await book.save({ session });

      borrowing.status = 'Active';
      borrowing.borrow_date = new Date();
      borrowing.due_date = new Date(Date.now() + resolvedDueDays * 24 * 60 * 60 * 1000);
      borrowing.remarks = remarks;

      try {
        await borrowing.save({ session });
      } catch (error) {
        if (error?.code === 11000) {
          throw createHttpError(409, 'This book is already borrowed by the selected user.');
        }

        throw error;
      }
    });
  } finally {
    session.endSession();
  }

  await runNonCriticalSideEffect(
    'BORROW_REQUEST_APPROVED_NOTIFICATION',
    () => notifyUser(borrowing.userId, 'Your borrow request was approved.'),
    { borrowingId: String(borrowing._id) }
  );

  await runNonCriticalSideEffect(
    'BORROW_REQUEST_APPROVED_AUDIT',
    () =>
      logAudit({
        actorId: req.user._id,
        actorRole: req.user.role,
        action: 'BORROW_REQUEST_APPROVED',
        metadata: { borrowingId: borrowing._id }
      }),
    { borrowingId: String(borrowing._id) }
  );

  return res.json(borrowing);
});

const rejectBorrow = asyncHandler(async (req, res) => {
  const { remarks = '' } = req.body;
  const borrowing = await Borrowing.findById(req.params.id);

  if (!borrowing) {
    return res.status(404).json({ message: 'Borrowing not found' });
  }

  if (borrowing.status !== 'Pending') {
    return res.status(400).json({ message: 'Only pending requests can be rejected' });
  }

  borrowing.status = 'Rejected';
  borrowing.remarks = remarks;
  await borrowing.save();

  await runNonCriticalSideEffect(
    'BORROW_REQUEST_REJECTED_NOTIFICATION',
    () => notifyUser(borrowing.userId, 'Your borrow request was rejected.'),
    { borrowingId: String(borrowing._id) }
  );

  await runNonCriticalSideEffect(
    'BORROW_REQUEST_REJECTED_AUDIT',
    () =>
      logAudit({
        actorId: req.user._id,
        actorRole: req.user.role,
        action: 'BORROW_REQUEST_REJECTED',
        metadata: { borrowingId: borrowing._id }
      }),
    { borrowingId: String(borrowing._id) }
  );

  return res.json(borrowing);
});

const scanBorrow = asyncHandler(async (req, res) => {
  const userBarcodeValue = String(req.body.userBarcode || '').trim();
  const bookScanValue = String(req.body.bookIsbn || req.body.bookBarcode || '').trim();
  const { dueDays } = req.body;
  const resolvedDueDays = resolveDueDays(dueDays);

  const user = await User.findOne({ barcodeString: userBarcodeValue });
  const book = await resolveScannedBook(bookScanValue);

  if (!user) {
    return res.status(404).json({ message: 'User barcode not found' });
  }

  if (!book) {
    return res.status(404).json({ message: 'Book ISBN not found' });
  }

  const existingBorrowing = await Borrowing.findOne({
    userId: user._id,
    bookId: book._id,
    status: { $in: ['Active', 'Overdue'] }
  })
    .populate('userId', 'name email role barcodeString')
    .populate('bookId', 'title author barcodeString');

  if (existingBorrowing) {
    return res.status(200).json({
      borrowing: existingBorrowing,
      message: 'This book is already borrowed by the selected user.'
    });
  }

  const session = await mongoose.startSession();
  let borrowing;

  try {
    await session.withTransaction(async () => {
      const updatedBook = await Book.findOneAndUpdate(
        { _id: book._id, available_copies: { $gt: 0 } },
        { $inc: { available_copies: -1 } },
        { new: true, session }
      );

      if (!updatedBook) {
        throw createHttpError(400, 'No available copies for this book');
      }

      try {
        borrowing = await Borrowing.create(
          [
            {
              userId: user._id,
              bookId: book._id,
              status: 'Active',
              borrow_date: new Date(),
              due_date: new Date(Date.now() + resolvedDueDays * 24 * 60 * 60 * 1000)
            }
          ],
          { session }
        );
      } catch (error) {
        if (error?.code === 11000) {
          throw createHttpError(409, 'This book is already borrowed by the selected user.');
        }

        throw error;
      }
    });
  } finally {
    session.endSession();
  }

  await runNonCriticalSideEffect(
    'SCAN_BORROW_NOTIFICATION',
    () => notifyUser(user._id, `Book borrowed: ${book.title}. Due date assigned.`),
    { userId: String(user._id), bookId: String(book._id) }
  );

  await runNonCriticalSideEffect(
    'SCAN_BORROW_AUDIT',
    () =>
      logAudit({
        actorId: req.user._id,
        actorRole: req.user.role,
        action: 'SCAN_BORROW_EXECUTED',
        metadata: { userId: user._id, bookId: book._id }
      }),
    { userId: String(user._id), bookId: String(book._id) }
  );

  return res.status(201).json(borrowing[0]);
});

const scanReturn = asyncHandler(async (req, res) => {
  const userBarcodeValue = String(req.body.userBarcode || '').trim();
  const bookScanValue = String(req.body.bookIsbn || req.body.bookBarcode || '').trim();

  const user = await User.findOne({ barcodeString: userBarcodeValue });
  const book = await resolveScannedBook(bookScanValue);

  if (!user) {
    return res.status(404).json({ message: 'User barcode not found' });
  }

  if (!book) {
    return res.status(404).json({ message: 'Book ISBN not found' });
  }

  let borrowing = await Borrowing.findOne({
    userId: user._id,
    bookId: book._id,
    status: { $in: ['Active', 'Overdue'] }
  }).sort({ createdAt: -1 });

  if (!borrowing) {
    const lastReturnedBorrowing = await Borrowing.findOne({
      userId: user._id,
      bookId: book._id,
      status: 'Returned'
    })
      .sort({ updatedAt: -1 })
      .populate('userId', 'name email role barcodeString')
      .populate('bookId', 'title author barcodeString');

    if (lastReturnedBorrowing) {
      return res.status(200).json({
        borrowing: lastReturnedBorrowing,
        penaltyAmount: lastReturnedBorrowing.penaltyAmount || 0,
        message: 'This book has already been returned.'
      });
    }

    return res.status(404).json({ message: 'No active borrowing found for this user and book' });
  }

  const returnDate = new Date();
  const penaltyAmount = calculatePenalty(borrowing.due_date, returnDate);

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const updatedBorrowing = await Borrowing.findOneAndUpdate(
        {
          _id: borrowing._id,
          status: { $in: ['Active', 'Overdue'] }
        },
        {
          $set: {
            return_date: returnDate,
            penaltyAmount,
            status: 'Returned'
          }
        },
        { new: true, session }
      );

      if (!updatedBorrowing) {
        throw createHttpError(409, 'This book has already been returned.');
      }

      const updatedBook = await Book.findOneAndUpdate(
        { _id: book._id },
        { $inc: { available_copies: 1 } },
        { new: true, session }
      );

      if (!updatedBook) {
        throw createHttpError(500, 'Unable to update book availability.');
      }

      borrowing = updatedBorrowing;
    });
  } finally {
    session.endSession();
  }

  const message =
    penaltyAmount > 0
      ? `Returned book: ${book.title}. Penalty incurred: ₱${penaltyAmount}.`
      : `Returned book: ${book.title}. No penalty.`;

  await runNonCriticalSideEffect(
    'SCAN_RETURN_NOTIFICATION',
    () => notifyUser(user._id, message),
    { userId: String(user._id), borrowingId: String(borrowing._id) }
  );

  await runNonCriticalSideEffect(
    'SCAN_RETURN_AUDIT',
    () =>
      logAudit({
        actorId: req.user._id,
        actorRole: req.user.role,
        action: 'SCAN_RETURN_EXECUTED',
        metadata: { borrowingId: borrowing._id, penaltyAmount }
      }),
    { borrowingId: String(borrowing._id) }
  );

  return res.json({ borrowing, penaltyAmount });
});

const pendingBorrowings = asyncHandler(async (req, res) => {
  const items = await Borrowing.find({ status: 'Pending' })
    .populate('userId', 'name email role')
    .populate('bookId', 'title author barcodeString')
    .sort({ createdAt: -1 });

  return res.json(items);
});

module.exports = {
  requestBorrowValidation,
  approveRejectValidation,
  scanBorrowValidation,
  scanReturnValidation,
  myBorrowings,
  requestBorrow,
  approveBorrow,
  rejectBorrow,
  scanBorrow,
  scanReturn,
  pendingBorrowings
};
