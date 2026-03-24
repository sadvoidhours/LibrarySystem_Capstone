const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin', 'superadmin'],
      default: 'student',
      index: true
    },
    studentIdNumber: { type: String, unique: true, sparse: true, trim: true, index: true },
    isVerified: { type: Boolean, default: false, index: true },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      index: true
    },
    profileImageUrl: { type: String, default: '' },
    themePreference: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    barcodeString: { type: String, unique: true, sparse: true, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model('User', userSchema);
