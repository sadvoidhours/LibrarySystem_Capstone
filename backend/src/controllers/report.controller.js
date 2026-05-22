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
  const filter = String(req.query.filter || '').toLowerCase();
  let items = [];
  let total = 0;

  if (filter === 'early' || filter === 'on-time') {
    // Use aggregation to compare return_date and due_date
    const baseMatch = { status: 'Returned', return_date: { $exists: true }, due_date: { $exists: true } };

    if (filter === 'early') {
      const matchEarly = { $expr: { $lt: ['$return_date', '$due_date'] } };
      const countAgg = await Borrowing.aggregate([{ $match: baseMatch }, { $match: matchEarly }, { $count: 'total' }]);
      total = countAgg[0]?.total || 0;

      const pipeline = [
        { $match: baseMatch },
        { $match: matchEarly },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'books', localField: 'bookId', foreignField: '_id', as: 'book' } },
        { $unwind: { path: '$book', preserveNullAndEmptyArrays: true } },
        { $project: { userId: { _id: '$user._id', name: '$user.name', email: '$user.email' }, bookId: { _id: '$book._id', title: '$book.title', author: '$book.author' }, borrow_date: 1, due_date: 1, return_date: 1, status: 1, penaltyAmount: 1, createdAt: 1, updatedAt: 1 } }
      ];

      items = await Borrowing.aggregate(pipeline);
    } else {
      // on-time: same calendar day
      const projectDates = {
        $project: {
          userId: 1,
          bookId: 1,
          borrow_date: 1,
          due_date: 1,
          return_date: 1,
          status: 1,
          penaltyAmount: 1,
          createdAt: 1,
          updatedAt: 1,
          returnDay: { $dateToString: { format: '%Y-%m-%d', date: '$return_date' } },
          dueDay: { $dateToString: { format: '%Y-%m-%d', date: '$due_date' } }
        }
      };

      const matchOnTime = { $expr: { $eq: ['$returnDay', '$dueDay'] } };
      const countAgg = await Borrowing.aggregate([{ $match: baseMatch }, projectDates, { $match: matchOnTime }, { $count: 'total' }]);
      total = countAgg[0]?.total || 0;

      const pipeline = [
        { $match: baseMatch },
        projectDates,
        { $match: matchOnTime },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'books', localField: 'bookId', foreignField: '_id', as: 'book' } },
        { $unwind: { path: '$book', preserveNullAndEmptyArrays: true } },
        { $project: { userId: { _id: '$user._id', name: '$user.name', email: '$user.email' }, bookId: { _id: '$book._id', title: '$book.title', author: '$book.author' }, borrow_date: 1, due_date: 1, return_date: 1, status: 1, penaltyAmount: 1, createdAt: 1, updatedAt: 1 } }
      ];

      items = await Borrowing.aggregate(pipeline);
    }
  } else if (filter === 'overdue') {
    total = await Borrowing.countDocuments({ status: 'Overdue' });
    items = await Borrowing.find({ status: 'Overdue' })
      .populate('userId', 'name email role')
      .populate('bookId', 'title author')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  } else if (filter) {
    // treat any other filter as a status
    total = await Borrowing.countDocuments({ status: new RegExp('^' + filter + '$', 'i') });
    items = await Borrowing.find({ status: new RegExp('^' + filter + '$', 'i') })
      .populate('userId', 'name email role')
      .populate('bookId', 'title author')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  } else {
    // default: return all
    const [found, cnt] = await Promise.all([
      Borrowing.find()
        .populate('userId', 'name email role')
        .populate('bookId', 'title author')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Borrowing.countDocuments(),
    ]);
    items = found;
    total = cnt;
  }

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

const borrowingCounts = asyncHandler(async (req, res) => {
  // Compute counts for UI filter chips: pending, active, overdue, returned, rejected, settled, early, onTime
  const [pending, active, overdue, returned, rejected, paymentsDistinct, total] = await Promise.all([
    Borrowing.countDocuments({ status: 'Pending' }),
    Borrowing.countDocuments({ status: 'Active' }),
    Borrowing.countDocuments({ status: 'Overdue' }),
    Borrowing.countDocuments({ status: 'Returned' }),
    Borrowing.countDocuments({ status: 'Rejected' }),
    Payment.distinct('borrowingId'),
    Borrowing.countDocuments()
  ]);

  const settled = Array.isArray(paymentsDistinct) ? paymentsDistinct.length : 0;

  // early/on-time
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

  const early = returnedAgg[0]?.early || 0;
  const onTime = returnedAgg[0]?.onTime || 0;

  return res.json({
    total,
    pending,
    active,
    overdue,
    returned,
    rejected,
    settled,
    early,
    onTime
  });
});

module.exports = { adminOverview, borrowingReport, penaltiesReport, borrowingCounts };
