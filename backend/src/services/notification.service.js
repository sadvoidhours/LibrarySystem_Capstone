const Notification = require('../models/Notification');

const notifyUser = async (userId, message, options = {}) => {
  const { dedupeKey } = options;

  if (dedupeKey) {
    const existing = await Notification.findOne({ userId, dedupeKey });
    if (existing) {
      return existing;
    }
  }

  return Notification.create({ userId, message, ...(dedupeKey ? { dedupeKey } : {}) });
};

module.exports = { notifyUser };
