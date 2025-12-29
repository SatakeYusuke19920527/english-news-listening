import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'daily-news';

export async function configureNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Daily News',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function ensureNotificationPermissions() {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED) {
    return true;
  }

  const result = await Notifications.requestPermissionsAsync();
  return result.granted || result.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED;
}

export async function scheduleDailyNewsNotification(body: string) {
  await configureNotifications();
  await Notifications.cancelAllScheduledNotificationsAsync();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'New AI News arrived.',
      body,
      sound: true,
    },
    trigger: {
      hour: 1,
      minute: 0,
      repeats: true,
      channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
    },
  });
}

export async function cancelDailyNewsNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function sendTestNotification(body: string) {
  await configureNotifications();
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'New AI News arrived.',
      body,
      sound: true,
    },
    trigger: null,
  });
}
