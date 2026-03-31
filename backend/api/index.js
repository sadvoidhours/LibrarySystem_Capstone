require('dotenv').config();

const app = require('../src/app');
const connectDB = require('../src/config/db');
const { validateEnv } = require('../src/config/env');
const { archiveInactiveAccounts } = require('../src/services/inactive-account.service');
const { runBorrowingReminderJobs } = require('../src/services/borrowing-reminder.service');

validateEnv();
const cronPath = '/api/cron/archive-inactive-accounts';
const dueReminderPath = '/api/cron/due-reminders';
const overdueNoticePath = '/api/cron/overdue-notices';

module.exports = async (req, res) => {
  await connectDB();

  const requestPath = (req.url || '').split('?')[0];

  if (requestPath === cronPath) {
    if (req.headers['x-vercel-cron'] !== '1') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const archivedUsers = await archiveInactiveAccounts();

    return res.json({
      message: 'Inactive account archive job completed',
      archivedCount: archivedUsers.length
    });
  }

  if (requestPath === dueReminderPath || requestPath === overdueNoticePath) {
    if (req.headers['x-vercel-cron'] !== '1') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const result = await runBorrowingReminderJobs();

    return res.json({
      message: 'Borrowing reminder jobs completed',
      dueReminders: result.dueReminders,
      overdueNotices: result.overdueNotices
    });
  }

  return app(req, res);
};