const Borrowing = require('../models/Borrowing');
const Payment = require('../models/Payment');
const Book = require('../models/Book');
const User = require('../models/User');
const { notifyUser } = require('./notification.service');
const { sendBorrowingDueReminderEmail, sendPenaltyDueReminderEmail } = require('./brevo.service');
const { sendExpoPushNotification } = require('./expo-push.service');

// include 0 to represent same-day reminders (due today)
const REMINDER_WINDOWS = [0, 1];

const runNonCriticalSideEffect = async (label, operation, meta = {}) => {
  try {
    await operation();
  } catch (error) {
    console.error(`[Borrowing Reminder] ${label} failed:`, {
      message: error?.message,
      ...meta
    });
  }
};

const buildDueMessage = (bookTitle, dueDate, daysRemaining) => {
  const due = new Date(dueDate);
  if (daysRemaining === 0) {
    const dueTime = due.toLocaleTimeString();
    return `Reminder: ${bookTitle} is due today at ${dueTime}. Please return it before the deadline. Note: same-day late returns are charged hourly.`;
  }

  const dueLabel = due.toLocaleDateString();
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
    .populate('userId', 'name email expoPushToken')
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
    try {
      const notification = await notifyUser(
        borrowing.userId._id,
        message,
        {
          type: 'due-reminder',
          dedupeKey: `due-reminder:${borrowing._id}:${diffDays}`,
          metadata: { borrowingId: borrowing._id, daysRemaining: diffDays }
        }
      );

      await runNonCriticalSideEffect('EMAIL_DUE_REMINDER', () =>
        sendBorrowingDueReminderEmail({
          user: borrowing.userId,
          bookTitle: borrowing.bookId?.title,
          dueDate: borrowing.due_date,
          daysRemaining: diffDays
        }),
      { borrowingId: String(borrowing._id) });

      await runNonCriticalSideEffect('PUSH_DUE_REMINDER', () =>
        sendExpoPushNotification({
          to: borrowing.userId?.expoPushToken,
          title: 'Book due soon',
          body: message,
          data: { type: 'due-reminder', borrowingId: String(borrowing._id) }
        }),
      { borrowingId: String(borrowing._id) });

      results.push({ borrowingId: borrowing._id, notificationId: notification?._id, daysRemaining: diffDays });
    } catch (error) {
      console.error('Failed to send due reminder notification:', {
        message: error?.message,
        borrowingId: String(borrowing._id),
        userId: String(borrowing.userId?._id || borrowing.userId),
        daysRemaining: diffDays,
      });
    }
  }

  return results;
};

const sendOverdueNotifications = async (now = new Date()) => {
  const borrowings = await Borrowing.find({
    status: 'Active',
    due_date: { $lt: now }
  })
    .populate('bookId', 'title barcodeString')
    .populate('userId', 'name email expoPushToken')
    .sort({ due_date: 1 });

  const results = [];

  for (const borrowing of borrowings) {
    if (!borrowing.due_date) {
      continue;
    }

    borrowing.status = 'Overdue';
    await borrowing.save();

    const message = buildOverdueMessage(borrowing.bookId?.title || 'Book', borrowing.due_date);
    try {
      const notification = await notifyUser(
        borrowing.userId._id,
        message,
        {
          type: 'overdue-notice',
          dedupeKey: `overdue:${borrowing._id}`,
          metadata: { borrowingId: borrowing._id }
        }
      );

      await runNonCriticalSideEffect('PUSH_OVERDUE_NOTICE', () =>
        sendExpoPushNotification({
          to: borrowing.userId?.expoPushToken,
          title: 'Book overdue',
          body: message,
          data: { type: 'overdue-notice', borrowingId: String(borrowing._id) }
        }),
      { borrowingId: String(borrowing._id) });

      results.push({ borrowingId: borrowing._id, notificationId: notification?._id });
    } catch (error) {
      console.error('Failed to send overdue notification:', {
        message: error?.message,
        borrowingId: String(borrowing._id),
        userId: String(borrowing.userId?._id || borrowing.userId),
      });
    }
  }

  return results;
};

const buildPenaltyDueMessage = (bookTitle, dueDate) => {
  const dueLabel = new Date(dueDate).toLocaleDateString();
  return `Penalty payment for ${bookTitle} is due on ${dueLabel}. Please settle before the deadline.`;
};

const sendPenaltyDueReminders = async (now = new Date()) => {
  const borrowings = await Borrowing.find({
    status: 'Returned',
    penaltyAmount: { $gt: 0 },
    penalty_due_date: { $exists: true, $ne: null }
  })
    .populate('bookId', 'title barcodeString')
    .populate('userId', 'name email expoPushToken')
    .sort({ penalty_due_date: 1 });

  if (!borrowings.length) {
    return [];
  }

  const borrowingIds = borrowings.map((item) => item._id);
  const payments = await Payment.find({ borrowingId: { $in: borrowingIds } }).select('borrowingId');
  const settled = new Set(payments.map((payment) => String(payment.borrowingId)));

  const results = [];

  for (const borrowing of borrowings) {
    if (settled.has(String(borrowing._id))) {
      continue;
    }

    const diffDays = Math.ceil((new Date(borrowing.penalty_due_date).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    if (!REMINDER_WINDOWS.includes(diffDays)) {
      continue;
    }

    const message = buildPenaltyDueMessage(borrowing.bookId?.title || 'borrowing', borrowing.penalty_due_date);

    try {
      const notification = await notifyUser(
        borrowing.userId._id,
        message,
        {
          type: 'penalty-due-reminder',
          dedupeKey: `penalty-due:${borrowing._id}:${diffDays}`,
          metadata: { borrowingId: borrowing._id, daysRemaining: diffDays }
        }
      );

      await runNonCriticalSideEffect('EMAIL_PENALTY_DUE', () =>
        sendPenaltyDueReminderEmail({
          user: borrowing.userId,
          bookTitle: borrowing.bookId?.title,
          dueDate: borrowing.penalty_due_date,
          amount: Number(borrowing.penaltyAmount || 0)
        }),
      { borrowingId: String(borrowing._id) });

      await runNonCriticalSideEffect('PUSH_PENALTY_DUE', () =>
        sendExpoPushNotification({
          to: borrowing.userId?.expoPushToken,
          title: 'Penalty payment due soon',
          body: message,
          data: { type: 'penalty-due-reminder', borrowingId: String(borrowing._id) }
        }),
      { borrowingId: String(borrowing._id) });

      results.push({ borrowingId: borrowing._id, notificationId: notification?._id, daysRemaining: diffDays });
    } catch (error) {
      console.error('Failed to send penalty due reminder notification:', {
        message: error?.message,
        borrowingId: String(borrowing._id),
        userId: String(borrowing.userId?._id || borrowing.userId),
        daysRemaining: diffDays,
      });
    }
  }

  return results;
};

const runBorrowingReminderJobs = async (now = new Date()) => {
  const [dueReminders, overdueNotices, penaltyDueReminders] = await Promise.all([
    sendDueDateReminders(now),
    sendOverdueNotifications(now),
    sendPenaltyDueReminders(now)
  ]);

  return {
    dueReminders: dueReminders.length,
    overdueNotices: overdueNotices.length,
    penaltyDueReminders: penaltyDueReminders.length
  };
};

const startBorrowingReminderJobs = ({ intervalMs = 60 * 60 * 1000 } = {}) => {
  const runJob = async () => {
    try {
      const result = await runBorrowingReminderJobs();
      if (result.dueReminders || result.overdueNotices || result.penaltyDueReminders) {
        console.log(`Borrowing reminder job completed. Due reminders: ${result.dueReminders}, overdue notices: ${result.overdueNotices}, penalty due reminders: ${result.penaltyDueReminders}.`);
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
  sendPenaltyDueReminders,
  startBorrowingReminderJobs
};