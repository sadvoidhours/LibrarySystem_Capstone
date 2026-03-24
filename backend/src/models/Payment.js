const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    borrowingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Borrowing', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    payment_date: { type: Date, default: Date.now },
    payment_method: { type: String, required: true, trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
