const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');
const { archiveUserRecord, isInactiveForOneYear } = require('../services/inactive-account.service');
const { serializeUser } = require('../utils/serializers');

const PTC_EMAIL_REGEX = /^[a-z]+@paterostechnologicalcollege\.edu\.ph$/;
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const registerValidation = [
  body('name').trim().notEmpty(),
  body('phone').optional().trim(),
  body('email')
    .customSanitizer(normalizeEmail)
    .matches(PTC_EMAIL_REGEX)
    .withMessage('Email must follow initials+lastname@paterostechnologicalcollege.edu.ph format'),
  body('studentIdNumber').trim().notEmpty(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['student', 'faculty'])
];

const loginValidation = [
  body('email')
    .customSanitizer(normalizeEmail)
    .matches(PTC_EMAIL_REGEX)
    .withMessage('Use your PTC email address'),
  body('password').notEmpty()
];

const register = asyncHandler(async (req, res) => {
  const { name, phone, studentIdNumber, password, role } = req.body;
  const email = normalizeEmail(req.body.email);

  const existing = await User.findOne({
    $or: [{ email }, { studentIdNumber }]
  });
  if (existing) {
    return res.status(409).json({ message: 'Email or Student ID already in use' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    phone: typeof phone === 'string' ? phone.trim() : '',
    email,
    studentIdNumber,
    passwordHash,
    role: role || 'student',
    isVerified: false,
    verificationStatus: 'pending'
  });

  user.barcodeString = user._id.toString();
  await user.save();

  return res.status(201).json({
    message: 'Registration submitted. Please wait for admin verification.',
    user: serializeUser(user)
  });
});

const login = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const email = normalizeEmail(req.body.email);

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (user.isArchived) {
    return res.status(403).json({ message: 'Account has been archived' });
  }

  if (isInactiveForOneYear(user)) {
    await archiveUserRecord(user);

    return res.status(403).json({ message: 'Account has been archived due to 1 year of inactivity' });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if ((user.role === 'student' || user.role === 'faculty') && !user.isVerified) {
    const statusMessage =
      user.verificationStatus === 'rejected'
        ? 'Your registration was rejected. Please contact the library administrator.'
        : 'Your account is pending admin verification.';

    return res.status(403).json({ message: statusMessage });
  }

  user.lastActiveAt = new Date();
  await user.save();

  const token = signToken(user);

  return res.json({
    token,
    user: serializeUser(user)
  });
});

module.exports = {
  registerValidation,
  loginValidation,
  register,
  login
};
