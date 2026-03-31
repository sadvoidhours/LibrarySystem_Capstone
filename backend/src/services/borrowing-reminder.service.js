const Borrowing = require('../models/Borrowing');
const Book = require('../models/Book');
const User = require('../models/User');
const { notifyUser } = require('./notification.service');

const REMINDER_WINDOWS = [3, 1];

const buildDueMessage = (bookTitle, dueDate, daysRemaining) => {
  const dueLabel = new Date(dueDate).toLocaleDateString();
  const dayLabel = daysRemaining === 1 ? '1 day' : `${daysRemaining} days`;
  return `Reminder: ${bookTitle} is due in ${dayLabel} on ${dueLabel}. Please return or renew it soon.`;
};

const buildOverdueMessage = (bookTitle, dueDate) => {
  const dueLabel = new Date(dueDate).toLocaleDateString();
  return `Overdue notice: ${bookTitle} was due on ${dueLabel}. Please return it as soon as possible.`;
};

const sendDueDateReminders = async (now = new Date()) => {
  const borrowings = await Borrowing.find({
    status: 'Active',
    due_date: { $exists: true, $ne: null }
  })
    .populate('bookId', 'title barcodeString')
    .populate('userId', 'name email')
    .sort({ due_date: 1 });

  const results = [];

  for (const borrowing of borrowings) {
    if (!borrowing.due_date) {
      continue;
    }

    const diffDays = Math.ceil((new Date(borrowing.due_date).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    if (!REMINDER_WINDOWS.includes(diffDays)) {
      continue;
    }

    const message = buildDueMessage(borrowing.bookId?.title || 'Book', borrowing.due_date, diffDays);
    const notification = await notifyUser(
      borrowing.userId._id,
      message,
      {
        type: 'due-reminder',
        dedupeKey: `due-reminder:${borrowing._id}:${diffDays}`
      }
    );

    results.push({ borrowingId: borrowing._id, notificationId: notification?._id, daysRemaining: diffDays });
  }

  return results;
};

const sendOverdueNotifications = async (now = new Date()) => {
  const borrowings = await Borrowing.find({
    status: 'Active',
    due_date: { $lt: now }
  })
    .populate('bookId', 'title barcodeString')
    .populate('userId', 'name email')
    .sort({ due_date: 1 });

  const results = [];

  for (const borrowing of borrowings) {
    if (!borrowing.due_date) {
      continue;
    }

    borrowing.status = 'Overdue';
    await borrowing.save();

    const message = buildOverdueMessage(borrowing.bookId?.title || 'Book', borrowing.due_date);
    const notification = await notifyUser(
      borrowing.userId._id,
      message,
      {
        type: 'overdue-notice',
        dedupeKey: `overdue:${borrowing._id}`
      }
    );

    results.push({ borrowingId: borrowing._id, notificationId: notification?._id });
  }

  return results;
};

const runBorrowingReminderJobs = async (now = new Date()) => {
  const [dueReminders, overdueNotices] = await Promise.all([
    sendDueDateReminders(now),
    sendOverdueNotifications(now)
  ]);

  return {
    dueReminders: dueReminders.length,
    overdueNotices: overdueNotices.length
  };
};

const startBorrowingReminderJobs = ({ intervalMs = 60 * 60 * 1000 } = {}) => {
  const runJob = async () => {
    try {
      const result = await runBorrowingReminderJobs();
      if (result.dueReminders || result.overdueNotices) {
        console.log(`Borrowing reminder job completed. Due reminders: ${result.dueReminders}, overdue notices: ${result.overdueNotices}.`);
      }
    } catch (error) {
      console.error('Borrowing reminder job failed:', error.message);
    }
  };

  runJob();
  return setInterval(runJob, intervalMs);
};

module.exports = {
  runBorrowingReminderJobs,
  sendDueDateReminders,
  sendOverdueNotifications,
  startBorrowingReminderJobs
};