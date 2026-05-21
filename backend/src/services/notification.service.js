const Notification = require('../models/Notification');

const notifyUser = async (userId, message, options = {}) => {
  const { dedupeKey, type = 'general', metadata = {} } = options;

  if (!userId || !message) {
    const err = new Error('Notification requires userId and message');
    console.error('Notification creation failed: missing input', {
      userId: String(userId || ''),
      hasMessage: Boolean(message),
    });
    throw err;
  }

  try {
    if (dedupeKey) {
      const existing = await Notification.findOne({ userId, dedupeKey });
      if (existing) {
        return existing;
      }
    }

    return await Notification.create({
      userId,
      message: String(message).trim(),
      type,
      metadata,
      ...(dedupeKey ? { dedupeKey } : {}),
    });
  } catch (error) {
    console.error('Notification creation failed:', {
      message: error?.message,
      userId: String(userId),
      type,
      dedupeKey,
    });
    throw error;
  }
};

module.exports = { notifyUser };
