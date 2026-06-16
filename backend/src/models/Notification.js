const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, default: 'general', index: true },
    message: { type: String, required: true, trim: true },
    is_read: { type: Boolean, default: false, index: true },
    dedupeKey: { type: String, default: '', sparse: true, index: true },
    metadata: { type: Object, default: {} }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

notificationSchema.virtual('notification_id').get(function notificationId() {
  return this._id;
});

notificationSchema.virtual('user_id').get(function userId() {
  return this.userId;
});

notificationSchema.virtual('timestamp').get(function timestamp() {
  return this.createdAt;
});

module.exports = mongoose.model('Notification', notificationSchema);
