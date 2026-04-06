const express = require('express');

const { asyncHandler } = require('../utils/asyncHandler');
const { authorizeCronRequest } = require('../middlewares/cron.middleware');
const { archiveInactiveAccounts } = require('../services/inactive-account.service');
const { runBorrowingReminderJobs } = require('../services/borrowing-reminder.service');

const router = express.Router();

router.get(
  '/archive-inactive-accounts',
  authorizeCronRequest,
  asyncHandler(async (req, res) => {
    const archivedUsers = await archiveInactiveAccounts();

    return res.json({
      message: 'Inactive account archive job completed',
      archivedCount: archivedUsers.length
    });
  })
);

const handleBorrowingReminderJobs = asyncHandler(async (req, res) => {
  const result = await runBorrowingReminderJobs();

  return res.json({
    message: 'Borrowing reminder jobs completed',
    dueReminders: result.dueReminders,
    overdueNotices: result.overdueNotices
  });
});

router.get('/due-reminders', authorizeCronRequest, handleBorrowingReminderJobs);
router.get('/overdue-notices', authorizeCronRequest, handleBorrowingReminderJobs);

module.exports = router;