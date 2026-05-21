const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    full_name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true, default: '' },
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
    expoPushToken: { type: String, default: '' },
    themePreference: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    lastActiveAt: { type: Date, default: null },
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date, default: null },
    barcodeString: { type: String, unique: true, sparse: true, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

userSchema.virtual('user_id').get(function userId() {
  return this._id;
});

userSchema.virtual('created_at').get(function createdAt() {
  return this.createdAt;
});

userSchema.virtual('fullName').get(function fullName() {
  return this.full_name || this.name;
});

userSchema.virtual('usernameOrEmail').get(function usernameOrEmail() {
  return this.username || this.email;
});

module.exports = mongoose.model('User', userSchema);
