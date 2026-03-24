const Notification = require('../models/Notification');

const notifyUser = async (userId, message) => {
  return Notification.create({ userId, message });
};

module.exports = { notifyUser };
