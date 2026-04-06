const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const bwipjs = require('bwip-js');
const User = require('../models/User');
const Book = require('../models/Book');
const Borrowing = require('../models/Borrowing');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const { logAudit } = require('../services/audit.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendArchiveEmail, sendRestoreEmail, sendTestEmail } = require('../services/brevo.service');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createAdminValidation = [
  body('name').trim().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['admin', 'superadmin'])
];

const buildUserSearchFilter = ({ role, verificationStatus, search, archived }) => {
  const filter = archived === 'true' ? { isArchived: true } : { isArchived: { $ne: true } };

  if (role && archived !== 'true') {
    if (role === 'staff') {
      filter.role = { $in: ['admin', 'superadmin'] };
    } else if (role === 'all') {
      filter.role = { $in: ['student', 'faculty', 'admin', 'superadmin'] };
    } else {
      filter.role = role;
    }
  }

  if (verificationStatus && archived !== 'true') {
    filter.verificationStatus = verificationStatus;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: escapeRegex(search), $options: 'i' } },
      { email: { $regex: escapeRegex(search), $options: 'i' } },
      { studentIdNumber: { $regex: escapeRegex(search), $options: 'i' } }
    ];
  }

  return filter;
};

const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const exists = await User.findOne({ email });
  if (exists && !exists.isArchived) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  if (exists && exists.isArchived) {
    await User.findByIdAndDelete(exists._id);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    isVerified: true,
    verificationStatus: 'verified'
  });

  user.barcodeString = user._id.toString();
  await user.save();

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
});

const getOverview = asyncHandler(async (req, res) => {
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
    User.countDocuments({ isArchived: { $ne: true } }),
    User.countDocuments({ role: { $in: ['admin', 'superadmin'] }, isArchived: { $ne: true } }),
    User.countDocuments({ role: { $in: ['student', 'faculty'] }, isArchived: { $ne: true } }),
    User.countDocuments({ role: 'faculty', isArchived: { $ne: true } }),
    User.countDocuments({ role: 'admin', isArchived: { $ne: true } }),
    User.countDocuments({ role: 'superadmin', isArchived: { $ne: true } }),
    User.countDocuments({ verificationStatus: 'verified', isArchived: { $ne: true } }),
    User.countDocuments({ verificationStatus: 'pending', isArchived: { $ne: true } }),
    User.countDocuments({ verificationStatus: 'rejected', isArchived: { $ne: true } }),
    User.countDocuments({ role: { $in: ['student', 'faculty'] }, verificationStatus: 'pending', isArchived: { $ne: true } }),
    Book.countDocuments(),
    Borrowing.countDocuments({ status: { $in: ['Active', 'Overdue'] } }),
    Borrowing.countDocuments({ status: 'Overdue' }),
    Borrowing.countDocuments({ status: 'Pending' }),
    Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    AuditLog.find().populate('actorId', 'name email role').sort({ createdAt: -1 }).limit(6),
    User.find({ isArchived: { $ne: true } }).select('-passwordHash').sort({ createdAt: -1 }).limit(6)
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
});

const listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role = 'all', verificationStatus, search, sort = 'newest', archived } = req.query;
  const filter = buildUserSearchFilter({ role, verificationStatus, search, archived });
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
});

const updateUserRole = asyncHandler(async (req, res) => {
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
});

const deleteBookRecord = asyncHandler(async (req, res) => {
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
});

const deleteUserRecord = asyncHandler(async (req, res) => {
  if (req.user._id.toString() === req.params.id) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }

  const archived = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { isArchived: true, archivedAt: new Date() } },
    { new: true }
  ).select('-passwordHash');

  if (!archived) {
    return res.status(404).json({ message: 'User not found' });
  }

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'USER_RECORD_ARCHIVED',
    metadata: { userId: archived._id }
  });

  try {
    await sendArchiveEmail(archived, 'Your account was archived by a superadmin.');
  } catch (error) {
    console.error('Failed to send archive email:', error.message);
  }

  return res.json({ message: 'User record archived' });
});

const restoreUserRecord = asyncHandler(async (req, res) => {
  const restored = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { isArchived: false, archivedAt: null } },
    { new: true }
  ).select('-passwordHash');

  if (!restored) {
    return res.status(404).json({ message: 'User not found' });
  }

  try {
    await sendRestoreEmail(restored);
  } catch (error) {
    console.error('Failed to send restore email:', error.message);
  }

  await logAudit({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: 'USER_RECORD_RESTORED',
    metadata: { userId: restored._id }
  });

  return res.json({ message: 'User record restored', user: restored });
});

const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, actorRole, action, search, range = 'all' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};

  if (actorRole) {
    filter.actorRole = actorRole;
  }

  if (action) {
    filter.action = { $regex: escapeRegex(action), $options: 'i' };
  }

  if (search) {
    filter.$or = [
      { action: { $regex: escapeRegex(search), $options: 'i' } },
      { actorRole: { $regex: escapeRegex(search), $options: 'i' } }
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
});

const generateBookBarcodes = asyncHandler(async (req, res) => {
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
});

const sendBrevoTest = asyncHandler(async (req, res) => {
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
      action: 'BREVO_TEST_EMAIL_SENT',
      metadata: { to }
    });

    return res.json({ message: 'Brevo test email sent', to });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to send Brevo test email' });
  }
});

module.exports = {
  createAdminValidation,
  createAdmin,
  getOverview,
  listUsers,
  updateUserRole,
  deleteBookRecord,
  deleteUserRecord,
  restoreUserRecord,
  getAuditLogs,
  generateBookBarcodes,
  sendBrevoTest
};
