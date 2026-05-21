const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    borrowingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Borrowing', required: true, unique: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    payment_date: { type: Date, default: Date.now },
    payment_due_date: { type: Date },
    payment_method: { type: String, required: true, trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

paymentSchema.virtual('payment_id').get(function paymentId() {
  return this._id;
});

paymentSchema.virtual('borrowing_id').get(function borrowingId() {
  return this.borrowingId;
});

paymentSchema.virtual('created_at').get(function createdAt() {
  return this.createdAt;
});

module.exports = mongoose.model('Payment', paymentSchema);
