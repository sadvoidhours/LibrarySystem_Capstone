const axios = require('axios');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const normalizeExpoToken = (token) => {
  const value = String(token || '').trim();
  if (!value) {
    return null;
  }

  return value;
};

const sendExpoPushNotification = async ({ to, title, body, data = {} }) => {
  const token = normalizeExpoToken(to);
  if (!token) {
    return null;
  }

  const payload = {
    to: token,
    title: String(title || 'PTC Library'),
    body: String(body || ''),
    data,
    sound: 'default',
  };

  const response = await axios.post(EXPO_PUSH_URL, payload, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  return response.data;
};

module.exports = { sendExpoPushNotification };
