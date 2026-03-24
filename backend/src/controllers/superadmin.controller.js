const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const bwipjs = require('bwip-js');
const User = require('../models/User');
const Book = require('../models/Book');
const Borrowing = require('../models/Borrowing');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const { logAudit } = require('../services/audit.service');
const { sendTestEmail } = require('../services/mailtrap.service');

const createAdminValidation = [
  body('name').trim().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['admin', 'superadmin'])
];

const buildUserSearchFilter = ({ role, verificationStatus, search }) => {
  const filter = {};

  if (role) {
    if (role === 'staff') {
      filter.role = { $in: ['admin', 'superadmin'] };
    } else if (role === 'all') {
      filter.role = { $in: ['student', 'faculty', 'admin', 'superadmin'] };
    } else {
      filter.role = role;
    }
  }

  if (verificationStatus) {
    filter.verificationStatus = verificationStatus;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { studentIdNumber: { $regex: search, $options: 'i' } }
    ];
  }

  return filter;
};

const createAdmin = async (req, res) => {
  const { name, email, password, role } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    barcodeString: '',
    isVerified: true,
    verificationStatus: 'verified'
  });

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'ADMIN_ACCOUNT_CREATED',
    metadata: { createdUserId: user._id, role }
  });

  return res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  });
};

const getOverview = async (req, res) => {
  const [
    totalUsers,
    staffUsers,
    studentUsers,
    facultyUsers,
    adminUsers,
    superadminUsers,
    verifiedUsers,
    pendingUsers,
    rejectedUsers,
    pendingApprovals,
    totalBooks,
    activeBorrowings,
    overdueBorrowings,
    pendingBorrowings,
    paymentsAgg,
    recentAuditLogs,
    recentUsers
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: { $in: ['admin', 'superadmin'] } }),
    User.countDocuments({ role: { $in: ['student', 'faculty'] } }),
    User.countDocuments({ role: 'faculty' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'superadmin' }),
    User.countDocuments({ verificationStatus: 'verified' }),
    User.countDocuments({ verificationStatus: 'pending' }),
    User.countDocuments({ verificationStatus: 'rejected' }),
    User.countDocuments({ role: { $in: ['student', 'faculty'] }, verificationStatus: 'pending' }),
    Book.countDocuments(),
    Borrowing.countDocuments({ status: { $in: ['Active', 'Overdue'] } }),
    Borrowing.countDocuments({ status: 'Overdue' }),
    Borrowing.countDocuments({ status: 'Pending' }),
    Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    AuditLog.find().populate('actorId', 'name email role').sort({ createdAt: -1 }).limit(6),
    User.find().select('-passwordHash').sort({ createdAt: -1 }).limit(6)
  ]);

  return res.json({
    totalUsers,
    staffUsers,
    studentUsers,
    facultyUsers,
    adminUsers,
    superadminUsers,
    verifiedUsers,
    pendingUsers,
    rejectedUsers,
    pendingApprovals,
    totalBooks,
    activeBorrowings,
    overdueBorrowings,
    pendingBorrowings,
    totalPayments: paymentsAgg[0]?.total || 0,
    recentAuditLogs,
    recentUsers
  });
};

const listUsers = async (req, res) => {
  const { page = 1, limit = 20, role = 'all', verificationStatus, search, sort = 'newest' } = req.query;
  const filter = buildUserSearchFilter({ role, verificationStatus, search });
  const skip = (Number(page) - 1) * Number(limit);

  let sortQuery = { createdAt: -1 };
  if (sort === 'oldest') {
    sortQuery = { createdAt: 1 };
  } else if (sort === 'name') {
    sortQuery = { name: 1 };
  } else if (sort === 'email') {
    sortQuery = { email: 1 };
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select('-passwordHash')
      .sort(sortQuery)
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter)
  ]);

  return res.json({ items, page: Number(page), limit: Number(limit), total });
};

const updateUserRole = async (req, res) => {
  const { role } = req.body;
  const updated = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-passwordHash');

  if (!updated) {
    return res.status(404).json({ message: 'User not found' });
  }

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'USER_ROLE_UPDATED',
    metadata: { targetUserId: updated._id, role }
  });

  return res.json(updated);
};

const deleteBookRecord = async (req, res) => {
  const deleted = await Book.findByIdAndDelete(req.params.id);

  if (!deleted) {
    return res.status(404).json({ message: 'Book not found' });
  }

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'BOOK_RECORD_DELETED',
    metadata: { bookId: deleted._id }
  });

  return res.json({ message: 'Book record deleted' });
};

const deleteUserRecord = async (req, res) => {
  if (req.user._id.toString() === req.params.id) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }

  const deleted = await User.findByIdAndDelete(req.params.id);

  if (!deleted) {
    return res.status(404).json({ message: 'User not found' });
  }

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'USER_RECORD_DELETED',
    metadata: { userId: deleted._id }
  });

  return res.json({ message: 'User record deleted' });
};

const getAuditLogs = async (req, res) => {
  const { page = 1, limit = 20, actorRole, action, search, range = 'all' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};

  if (actorRole) {
    filter.actorRole = actorRole;
  }

  if (action) {
    filter.action = { $regex: action, $options: 'i' };
  }

  if (search) {
    filter.$or = [
      { action: { $regex: search, $options: 'i' } },
      { actorRole: { $regex: search, $options: 'i' } }
    ];
  }

  const now = new Date();
  if (range && range !== 'all') {
    const start = new Date(now);

    if (range === '24h') {
      start.setDate(start.getDate() - 1);
    } else if (range === '7d') {
      start.setDate(start.getDate() - 7);
    } else if (range === '30d') {
      start.setDate(start.getDate() - 30);
    } else if (range === '90d') {
      start.setDate(start.getDate() - 90);
    }

    filter.createdAt = { $gte: start };
  }

  const [items, total] = await Promise.all([
    AuditLog.find(filter).populate('actorId', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    AuditLog.countDocuments(filter)
  ]);

  return res.json({ items, page: Number(page), limit: Number(limit), total });
};

const generateBookBarcodes = async (req, res) => {
  const { bookIds = [] } = req.body;

  const books = await Book.find({ _id: { $in: bookIds } });

  const results = await Promise.all(
    books.map(async (book) => {
      const png = await bwipjs.toBuffer({
        bcid: 'code128',
        text: book.barcodeString,
        scale: 2,
        height: 10,
        includetext: true,
        textxalign: 'center'
      });

      return {
        bookId: book._id,
        title: book.title,
        barcodeString: book.barcodeString,
        pngBase64: png.toString('base64')
      };
    })
  );

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'BATCH_BOOK_BARCODES_GENERATED',
    metadata: { count: results.length }
  });

  return res.json(results);
};

const sendMailtrapTest = async (req, res) => {
  const to = req.body.to || req.user.email;
  const { subject, message } = req.body;

  try {
    await sendTestEmail({
      to,
      subject,
      message,
    });

    await logAudit({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'MAILTRAP_TEST_EMAIL_SENT',
      metadata: { to }
    });

    return res.json({ message: 'Mailtrap test email sent', to });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to send Mailtrap test email' });
  }
};

module.exports = {
  createAdminValidation,
  createAdmin,
  getOverview,
  listUsers,
  updateUserRole,
  deleteBookRecord,
  deleteUserRecord,
  getAuditLogs,
  generateBookBarcodes,
  sendMailtrapTest
};
