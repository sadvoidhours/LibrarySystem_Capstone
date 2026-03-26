const User = require('../models/User');
const { sendArchiveEmail } = require('./mailtrap.service');

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const getActivityAnchor = (user) => user.lastActiveAt || user.updatedAt || user.createdAt;

const isInactiveForOneYear = (user, now = Date.now()) => {
  const anchor = getActivityAnchor(user);

  if (!anchor) {
    return false;
  }

  return now - new Date(anchor).getTime() >= ONE_YEAR_MS;
};

const archiveUserRecord = async (user, reason = 'This account was archived after 1 year of inactivity.') => {
  const archived = await User.findByIdAndUpdate(
    user._id,
    { $set: { isArchived: true, archivedAt: new Date() } },
    { new: true }
  ).select('-passwordHash');

  if (!archived) {
    return null;
  }

  try {
    await sendArchiveEmail(archived, reason);
  } catch (error) {
    console.error(`Failed to send inactivity archive email to ${archived.email}:`, error.message);
  }

  return archived;
};

const archiveInactiveAccounts = async () => {
  const candidates = await User.find({
    isArchived: { $ne: true },
    $or: [
      { lastActiveAt: { $exists: true, $ne: null } },
      { updatedAt: { $exists: true } },
      { createdAt: { $exists: true } }
    ]
  }).select('-passwordHash');

  const archivedUsers = [];

  for (const user of candidates) {
    if (!isInactiveForOneYear(user)) {
      continue;
    }

    const archived = await archiveUserRecord(user);

    if (archived) {
      archivedUsers.push(archived);
    }
  }

  return archivedUsers;
};

const startInactiveAccountArchiveJob = ({ intervalMs = 24 * 60 * 60 * 1000 } = {}) => {
  const runJob = async () => {
    try {
      const archivedUsers = await archiveInactiveAccounts();

      if (archivedUsers.length > 0) {
        console.log(`Archived ${archivedUsers.length} inactive account(s) after scheduled scan.`);
      }
    } catch (error) {
      console.error('Inactive account archive job failed:', error.message);
    }
  };

  runJob();
  return setInterval(runJob, intervalMs);
};

module.exports = {
  archiveInactiveAccounts,
  archiveUserRecord,
  isInactiveForOneYear,
  startInactiveAccountArchiveJob,
};