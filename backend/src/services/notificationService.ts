import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export const sendPushNotification = async (pushToken: string | null | undefined, title: string, body: string, data?: any) => {
  if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
    console.log(`[Push Notification] Skipped. Invalid or no token: ${pushToken}`);
    return;
  }

  const message: ExpoPushMessage = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
  };

  try {
    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];
    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }
    console.log(`[Push Notification] Sent to ${pushToken} - ${title}`);
  } catch (error) {
    console.error('[Push Notification] Error sending:', error);
  }
};
