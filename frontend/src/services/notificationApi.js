import API from './api';

export const getVapidPublicKey = async () => {
  const response = await API.get('/notifications/vapid-public-key');
  return response.data.publicKey;
};

export const subscribeToPush = async (subscription) => {
  const response = await API.post('/notifications/subscribe', { subscription });
  return response.data;
};

export const unsubscribeFromPush = async () => {
  const response = await API.post('/notifications/unsubscribe');
  return response.data;
};

export const updateNotificationPreferences = async (dailyReminderTime) => {
  const response = await API.put('/notifications/preferences', { dailyReminderTime });
  return response.data;
};
