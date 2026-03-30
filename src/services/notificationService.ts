import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getCurrentUser } from '../firebase/init';
import { updateUserPushToken } from './userService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF7A00',
    });
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    console.log('[Push] Permission not granted');
    return null;
  }
  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('[Push] Got Expo push token:', token);

  // Save push token to Firestore user profile if logged in
  try {
    const user = getCurrentUser?.();
    console.log('[Push] Current user:', user);
    if (user && user.uid) {
      await updateUserPushToken(user.uid, token);
      console.log('[Push] Saved push token to Firestore for user:', user.uid);
    } else {
      console.log('[Push] No user or user.uid found, not saving token');
    }
  } catch (e) {
    console.log('[Push] Error saving push token to Firestore:', e);
  }
  return token;
}

export function addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
  return Notifications.addNotificationReceivedListener(listener);
}

export function addNotificationResponseReceivedListener(listener: (response: Notifications.NotificationResponse) => void) {
  return Notifications.addNotificationResponseReceivedListener(listener);
}