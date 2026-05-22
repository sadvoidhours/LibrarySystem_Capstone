const Book = require('../models/Book');
const User = require('../models/User');
const Borrowing = require('../models/Borrowing');
const Payment = require('../models/Payment');
const asyncHandler = require('../utils/asyncHandler');
const { resolvePagination } = require('../utils/pagination');

const adminOverview = asyncHandler(async (req, res) => {
  const [
    totalBooks,
    registeredUsers,
    activeBorrowings,
    pendingRequests,
    paymentAgg,
    recentTransactions
  ] = await Promise.all([
    Book.countDocuments(),
    User.countDocuments({ role: { $in: ['student', 'faculty'] }, isArchived: { $ne: true } }),
    Borrowing.countDocuments({ status: { $in: ['Active', 'Overdue'] } }),
    Borrowing.countDocuments({ status: 'Pending' }),
    Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    Borrowing.find().populate('userId', 'name').populate('bookId', 'title').sort({ createdAt: -1 }).limit(10)
  ]);

  // Count borrowings that were returned early (return_date < due_date)
  // and those returned exactly on-time (same calendar day)
  const returnedAgg = await Borrowing.aggregate([
    { $match: { status: 'Returned', return_date: { $exists: true }, due_date: { $exists: true } } },
    {
      $project: {
        isEarly: { $lt: ['$return_date', '$due_date'] },
        returnDay: { $dateToString: { format: '%Y-%m-%d', date: '$return_date' } },
        dueDay: { $dateToString: { format: '%Y-%m-%d', date: '$due_date' } }
      }
    },
    {
      $group: {
        _id: null,
        early: { $sum: { $cond: ['$isEarly', 1, 0] } },
        onTime: { $sum: { $cond: [{ $eq: ['$returnDay', '$dueDay'] }, 1, 0] } }
      }
    }
  ]);

  const earlyReturns = returnedAgg[0]?.early || 0;
  const onTimeReturns = returnedAgg[0]?.onTime || 0;

  return res.json({
    totalBooks,
    registeredUsers,
    activeBorrowings,
    pendingRequests,
    totalPenalties: paymentAgg[0]?.total || 0,
    recentTransactions,
    earlyReturns,
    onTimeReturns
  });
});

const borrowingReport = asyncHandler(async (req, res) => {
  const { page, limit, skip } = resolvePagination(req.query, { defaultLimit: 50, maxLimit: 200 });
  const wantsPaginatedResponse = typeof req.query.page !== 'undefined' || typeof req.query.limit !== 'undefined';
  const [items, total] = await Promise.all([
    Borrowing.find()
      .populate('userId', 'name email role')
      .populate('bookId', 'title author')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Borrowing.countDocuments(),
  ]);

  if (!wantsPaginatedResponse) {
    return res.json(items);
  }

  return res.json({ items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
});

const penaltiesReport = asyncHandler(async (req, res) => {
  const { page, limit, skip } = resolvePagination(req.query, { defaultLimit: 50, maxLimit: 200 });
  const wantsPaginatedResponse = typeof req.query.page !== 'undefined' || typeof req.query.limit !== 'undefined';
  const [payments, overdueItems] = await Promise.all([
    Payment.find()
      .populate({ path: 'borrowingId', populate: [{ path: 'userId', select: 'name' }, { path: 'bookId', select: 'title' }] })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Borrowing.find({ penaltyAmount: { $gt: 0 } })
      .populate('userId', 'name')
      .populate('bookId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
  ]);

  const [paymentsTotal, overdueItemsTotal] = await Promise.all([
    Payment.countDocuments(),
    Borrowing.countDocuments({ penaltyAmount: { $gt: 0 } })
  ]);

  if (!wantsPaginatedResponse) {
    return res.json({ payments, overdueItems });
  }

  return res.json({
    payments,
    overdueItems,
    page,
    limit,
    totals: { payments: paymentsTotal, overdueItems: overdueItemsTotal }
  });
});

module.exports = { adminOverview, borrowingReport, penaltiesReport };
