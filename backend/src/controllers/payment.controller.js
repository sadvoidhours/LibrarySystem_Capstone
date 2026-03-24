const { body } = require('express-validator');
const Payment = require('../models/Payment');
const Borrowing = require('../models/Borrowing');
const { logAudit } = require('../services/audit.service');

const paymentValidation = [
  body('borrowingId').isMongoId(),
  body('amount').isFloat({ min: 0 }),
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

const recordPayment = async (req, res) => {
  const { borrowingId, amount, payment_method } = req.body;

  const borrowing = await Borrowing.findById(borrowingId);
  if (!borrowing) {
    return res.status(404).json({ message: 'Borrowing not found' });
  }

  if (req.user.role === 'student' && borrowing.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only settle your own payments' });
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

  return res.status(201).json(payment);
};

module.exports = { paymentValidation, myPayments, recordPayment };
