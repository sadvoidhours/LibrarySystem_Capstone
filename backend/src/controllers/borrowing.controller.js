const mongoose = require('mongoose');
const { body } = require('express-validator');
const Borrowing = require('../models/Borrowing');
const Book = require('../models/Book');
const User = require('../models/User');
const { calculatePenalty } = require('../services/penalty.service');
const { notifyUser } = require('../services/notification.service');
const { logAudit } = require('../services/audit.service');

const requestBorrowValidation = [
  body('bookId').isMongoId()
];

const approveRejectValidation = [
  body('dueDays').optional().isInt({ min: 1, max: 60 }),
  body('remarks').optional().isString()
];

const scanBorrowValidation = [
  body('userBarcode').notEmpty(),
  body('bookBarcode').notEmpty(),
  body('dueDays').optional().isInt({ min: 1, max: 60 })
];

const scanReturnValidation = [
  body('userBarcode').notEmpty(),
  body('bookBarcode').notEmpty()
];

const myBorrowings = async (req, res) => {
  const borrowings = await Borrowing.find({ userId: req.user._id })
    .populate('bookId', 'title author coverImageUrl barcodeString')
    .sort({ createdAt: -1 });

  return res.json(borrowings);
};

const requestBorrow = async (req, res) => {
  const { bookId } = req.body;

  const book = await Book.findById(bookId);
  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }

  const borrowing = await Borrowing.create({
    userId: req.user._id,
    bookId,
    status: 'Pending'
  });

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'BORROW_REQUEST_CREATED',
    metadata: { borrowingId: borrowing._id, bookId }
  });

  return res.status(201).json(borrowing);
};

const approveBorrow = async (req, res) => {
  const { dueDays = 7, remarks = '' } = req.body;

  const borrowing = await Borrowing.findById(req.params.id);
  if (!borrowing) {
    return res.status(404).json({ message: 'Borrowing not found' });
  }

  if (borrowing.status !== 'Pending') {
    return res.status(400).json({ message: 'Only pending requests can be approved' });
  }

  const session = await mongoose.startSession();

  await session.withTransaction(async () => {
    const book = await Book.findById(borrowing.bookId).session(session);
    if (!book || book.available_copies < 1) {
      throw new Error('No available copies');
    }

    book.available_copies -= 1;
    await book.save({ session });

    borrowing.status = 'Active';
    borrowing.borrow_date = new Date();
    borrowing.due_date = new Date(Date.now() + Number(dueDays) * 24 * 60 * 60 * 1000);
    borrowing.remarks = remarks;
    await borrowing.save({ session });
  });

  session.endSession();

  await notifyUser(borrowing.userId, 'Your borrow request was approved.');

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'BORROW_REQUEST_APPROVED',
    metadata: { borrowingId: borrowing._id }
  });

  return res.json(borrowing);
};

const rejectBorrow = async (req, res) => {
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

  await notifyUser(borrowing.userId, 'Your borrow request was rejected.');

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'BORROW_REQUEST_REJECTED',
    metadata: { borrowingId: borrowing._id }
  });

  return res.json(borrowing);
};

const scanBorrow = async (req, res) => {
  const { userBarcode, bookBarcode, dueDays = 7 } = req.body;

  const user = await User.findOne({ barcodeString: userBarcode });
  const book = await Book.findOne({ barcodeString: bookBarcode });

  if (!user || !book) {
    return res.status(404).json({ message: 'User or book barcode not found' });
  }

  if (book.available_copies < 1) {
    return res.status(400).json({ message: 'No available copies for this book' });
  }

  const session = await mongoose.startSession();
  let borrowing;

  await session.withTransaction(async () => {
    book.available_copies -= 1;
    await book.save({ session });

    borrowing = await Borrowing.create(
      [
        {
          userId: user._id,
          bookId: book._id,
          status: 'Active',
          borrow_date: new Date(),
          due_date: new Date(Date.now() + Number(dueDays) * 24 * 60 * 60 * 1000)
        }
      ],
      { session }
    );
  });

  session.endSession();

  await notifyUser(user._id, `Book borrowed: ${book.title}. Due date assigned.`);

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'SCAN_BORROW_EXECUTED',
    metadata: { userId: user._id, bookId: book._id }
  });

  return res.status(201).json(borrowing[0]);
};

const scanReturn = async (req, res) => {
  const { userBarcode, bookBarcode } = req.body;

  const user = await User.findOne({ barcodeString: userBarcode });
  const book = await Book.findOne({ barcodeString: bookBarcode });

  if (!user || !book) {
    return res.status(404).json({ message: 'User or book barcode not found' });
  }

  const borrowing = await Borrowing.findOne({
    userId: user._id,
    bookId: book._id,
    status: { $in: ['Active', 'Overdue'] }
  }).sort({ createdAt: -1 });

  if (!borrowing) {
    return res.status(404).json({ message: 'No active borrowing found for this user and book' });
  }

  const returnDate = new Date();
  const penaltyAmount = calculatePenalty(borrowing.due_date, returnDate);

  const session = await mongoose.startSession();

  await session.withTransaction(async () => {
    book.available_copies += 1;
    await book.save({ session });

    borrowing.return_date = returnDate;
    borrowing.penaltyAmount = penaltyAmount;
    borrowing.status = 'Returned';
    await borrowing.save({ session });
  });

  session.endSession();

  const message =
    penaltyAmount > 0
      ? `Returned book: ${book.title}. Penalty incurred: ₱${penaltyAmount}.`
      : `Returned book: ${book.title}. No penalty.`;

  await notifyUser(user._id, message);

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'SCAN_RETURN_EXECUTED',
    metadata: { borrowingId: borrowing._id, penaltyAmount }
  });

  return res.json({ borrowing, penaltyAmount });
};

const pendingBorrowings = async (req, res) => {
  const items = await Borrowing.find({ status: 'Pending' })
    .populate('userId', 'name email role')
    .populate('bookId', 'title author barcodeString')
    .sort({ createdAt: -1 });

  return res.json(items);
};

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
