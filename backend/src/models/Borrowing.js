const mongoose = require('mongoose');

const borrowingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    borrow_date: { type: Date, default: Date.now },
    due_date: { type: Date },
    return_date: { type: Date },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Active', 'Returned', 'Overdue'],
      default: 'Pending',
      index: true
    },
    penaltyAmount: { type: Number, default: 0 },
    remarks: { type: String, default: '' }
  },
  { timestamps: true }
);

borrowingSchema.index({ userId: 1, status: 1 });
borrowingSchema.index({ bookId: 1, status: 1 });

borrowingSchema.set('toJSON', { virtuals: true });
borrowingSchema.set('toObject', { virtuals: true });

borrowingSchema.virtual('borrowing_id').get(function borrowingId() {
  return this._id;
});

borrowingSchema.virtual('user_id').get(function userId() {
  return this.userId;
});

borrowingSchema.virtual('book_id').get(function bookId() {
  return this.bookId;
});

borrowingSchema.virtual('created_at').get(function createdAt() {
  return this.createdAt;
});

module.exports = mongoose.model('Borrowing', borrowingSchema);
