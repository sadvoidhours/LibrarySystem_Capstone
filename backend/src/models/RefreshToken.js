const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    revokedAt: { type: Date, default: null, index: true },
    expiresAt: { type: Date, required: true, index: true },
    replacedByTokenHash: { type: String, default: '' }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

refreshTokenSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);