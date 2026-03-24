const Book = require('../models/Book');
const User = require('../models/User');
const Borrowing = require('../models/Borrowing');
const Payment = require('../models/Payment');

const adminOverview = async (req, res) => {
  const [
    totalBooks,
    registeredUsers,
    activeBorrowings,
    pendingRequests,
    paymentAgg,
    recentTransactions
  ] = await Promise.all([
    Book.countDocuments(),
    User.countDocuments({ role: { $in: ['student', 'faculty'] } }),
    Borrowing.countDocuments({ status: { $in: ['Active', 'Overdue'] } }),
    Borrowing.countDocuments({ status: 'Pending' }),
    Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    Borrowing.find().populate('userId', 'name').populate('bookId', 'title').sort({ createdAt: -1 }).limit(10)
  ]);

  return res.json({
    totalBooks,
    registeredUsers,
    activeBorrowings,
    pendingRequests,
    totalPenalties: paymentAgg[0]?.total || 0,
    recentTransactions
  });
};

const borrowingReport = async (req, res) => {
  const items = await Borrowing.find()
    .populate('userId', 'name email role')
    .populate('bookId', 'title author')
    .sort({ createdAt: -1 });

  return res.json(items);
};

const penaltiesReport = async (req, res) => {
  const [payments, overdueItems] = await Promise.all([
    Payment.find().populate({ path: 'borrowingId', populate: [{ path: 'userId', select: 'name' }, { path: 'bookId', select: 'title' }] }).sort({ createdAt: -1 }),
    Borrowing.find({ penaltyAmount: { $gt: 0 } })
      .populate('userId', 'name')
      .populate('bookId', 'title')
      .sort({ createdAt: -1 })
  ]);

  return res.json({ payments, overdueItems });
};

module.exports = { adminOverview, borrowingReport, penaltiesReport };
