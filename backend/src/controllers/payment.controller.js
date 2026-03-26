const { body } = require('express-validator');
const Payment = require('../models/Payment');
const Borrowing = require('../models/Borrowing');
const { notifyUser } = require('../services/notification.service');
const { logAudit } = require('../services/audit.service');

const paymentValidation = [
  body('borrowingId').isMongoId(),
  body('amount').isFloat({ min: 0.01 }),
  body('payment_method').trim().notEmpty()
];

const myPayments = async (req, res) => {
  const payments = await Payment.find()
    .populate({
      path: 'borrowingId',
      select: 'userId bookId status penaltyAmount due_date return_date',
      populate: [{ path: 'bookId', select: 'title author' }]
    })
    .sort({ createdAt: -1 });

  const items = payments.filter(
    (payment) => payment.borrowingId?.userId?.toString() === req.user._id.toString()
  );

  return res.json(items);
};

const listPayments = async (req, res) => {
  const payments = await Payment.find()
    .populate({
      path: 'borrowingId',
      select: 'userId bookId status penaltyAmount due_date return_date borrow_date remarks',
      populate: [
        { path: 'userId', select: 'name email role' },
        { path: 'bookId', select: 'title author' }
      ]
    })
    .populate('recordedBy', 'name email role')
    .sort({ createdAt: -1 });

  return res.json(payments);
};

const recordPayment = async (req, res) => {
  const { borrowingId, amount, payment_method } = req.body;

  const borrowing = await Borrowing.findById(borrowingId).populate('userId', 'name email');
  if (!borrowing) {
    return res.status(404).json({ message: 'Borrowing not found' });
  }

  if (borrowing.penaltyAmount <= 0) {
    return res.status(400).json({ message: 'This borrowing has no penalty due' });
  }

  const existingPayment = await Payment.findOne({ borrowingId });
  if (existingPayment) {
    return res.status(409).json({ message: 'This penalty has already been settled' });
  }

  if (req.user.role === 'student' && borrowing.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only settle your own payments' });
  }

  if (Number(amount) < Number(borrowing.penaltyAmount)) {
    return res.status(400).json({ message: 'Payment amount must cover the full penalty amount' });
  }

  const payment = await Payment.create({
    borrowingId,
    amount,
    payment_method,
    recordedBy: req.user._id
  });

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'PENALTY_PAYMENT_RECORDED',
    metadata: { paymentId: payment._id, borrowingId, amount }
  });

  try {
    await notifyUser(borrowing.userId._id || borrowing.userId, `Penalty payment recorded for ${borrowing.bookId?.title || 'a borrowing'}.`);
  } catch (error) {
    console.error('Failed to send payment notification:', error.message);
  }

  return res.status(201).json(payment);
};

module.exports = { paymentValidation, myPayments, listPayments, recordPayment };
