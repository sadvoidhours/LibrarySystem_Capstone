const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

const PTC_EMAIL_REGEX = /^[a-z]+@paterostechnologicalcollege\.edu\.ph$/;
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const registerValidation = [
  body('name').trim().notEmpty(),
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

const register = async (req, res) => {
  const { name, studentIdNumber, password, role } = req.body;
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
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      studentIdNumber: user.studentIdNumber,
      role: user.role,
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus,
      profileImageUrl: user.profileImageUrl,
      themePreference: user.themePreference,
      barcodeString: user.barcodeString
    }
  });
};

const login = async (req, res) => {
  const { password } = req.body;
  const email = normalizeEmail(req.body.email);

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
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

  const token = signToken(user);

  return res.json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      studentIdNumber: user.studentIdNumber,
      role: user.role,
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus,
      profileImageUrl: user.profileImageUrl,
      themePreference: user.themePreference,
      barcodeString: user.barcodeString
    }
  });
};

module.exports = {
  registerValidation,
  loginValidation,
  register,
  login
};
