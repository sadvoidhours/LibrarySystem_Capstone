const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const User = require('../models/User');
const Borrowing = require('../models/Borrowing');
const QRCode = require('qrcode');
const { sendVerificationEmail, sendRejectionEmail } = require('../services/mailtrap.service');

const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash');
  const borrowings = await Borrowing.find({ userId: req.user._id })
    .populate('bookId', 'title author coverImageUrl')
    .sort({ createdAt: -1 })
    .limit(10);

  return res.json({ user, borrowings });
};

const updateMe = async (req, res) => {
  const { name, profileImageUrl, themePreference } = req.body;

  const updates = {};

  if (typeof name === 'string' && name.trim()) {
    updates.name = name.trim();
  }

  if (typeof profileImageUrl === 'string') {
    updates.profileImageUrl = profileImageUrl.trim();
  }

  if (themePreference === 'light' || themePreference === 'dark') {
    updates.themePreference = themePreference;
  }

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true }
  ).select('-passwordHash');

  return res.json(updated);
};

const changePasswordValidation = [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
];

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  return res.json({ message: 'Password updated successfully' });
};

const myBarcodeQR = async (req, res) => {
  const user = await User.findById(req.user._id).select('barcodeString name role');

  if (!user || !user.barcodeString) {
    return res.status(404).json({ message: 'User barcode not found' });
  }

  const qrDataUrl = await QRCode.toDataURL(user.barcodeString);

  return res.json({
    barcodeString: user.barcodeString,
    qrDataUrl,
    user: {
      _id: user._id,
      name: user.name,
      role: user.role
    }
  });
};

const listPendingUsers = async (req, res) => {
  const users = await User.find({
    role: { $in: ['student', 'faculty'] },
    isVerified: false,
    verificationStatus: 'pending'
  })
    .select('-passwordHash')
    .sort({ createdAt: -1 });

  return res.json(users);
};

const verifyUser = async (req, res) => {
  const user = await User.findById(req.params.id).select('-passwordHash');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!['student', 'faculty'].includes(user.role)) {
    return res.status(400).json({ message: 'Only student/faculty accounts require verification' });
  }

  const wasPreviouslyUnverified = !user.isVerified || user.verificationStatus !== 'verified';

  user.isVerified = true;
  user.verificationStatus = 'verified';
  await user.save();

  let emailSent = false;
  if (wasPreviouslyUnverified) {
    try {
      await sendVerificationEmail(user);
      emailSent = true;
    } catch (error) {
      console.error('Failed to send verification email:', error.message);
    }
  }

  return res.json({ message: 'User verified successfully', emailSent, user });
};

const rejectUser = async (req, res) => {
  const user = await User.findById(req.params.id).select('-passwordHash');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!['student', 'faculty'].includes(user.role)) {
    return res.status(400).json({ message: 'Only student/faculty accounts can be rejected' });
  }

  user.isVerified = false;
  user.verificationStatus = 'rejected';
  await user.save();

  let emailSent = false;

  try {
    await sendRejectionEmail(user);
    emailSent = true;
  } catch (error) {
    console.error('Failed to send rejection email:', error.message);
  }

  return res.json({ message: 'User registration rejected', emailSent, user });
};

module.exports = {
  getMe,
  updateMe,
  changePasswordValidation,
  changePassword,
  myBarcodeQR,
  listPendingUsers,
  verifyUser,
  rejectUser
};
