import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { api } from '../config/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({});

export const useNotifications = () => useContext(NotificationContext);

// Helper to safely load notification modules
let Notifications = null;
let Device = null;
let Constants = null;
let isNativeReady = false;

try {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
    Constants = require('expo-constants');
    isNativeReady = true;
  }
} catch (e) {
  console.log('Notification modules not available:', e.message);
  isNativeReady = false;
}

// Configure foreground notification display
if (isNativeReady && Notifications?.setNotificationHandler) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    // Safe to ignore
  }
}

async function registerForPushNotificationsAsync() {
  if (!isNativeReady) return null;

  try {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6C5CE7',
        sound: 'default',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    const projectId = Constants?.default?.expoConfig?.extra?.eas?.projectId
      || Constants?.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    console.log('Expo push token:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.log('Push notification setup error:', error.message);
    return null;
  }
}

export const NotificationProvider = ({ children, navigationRef }) => {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  // Register for push notifications when user logs in
  useEffect(() => {
    if (!user || !isNativeReady) return;

    const register = async () => {
      registerForPushNotificationsAsync()
        .then(async (token) => {
          if (token) {
            setExpoPushToken(token);
            try {
              await api.put('/auth/push-token', { pushToken: token });
              console.log('Push token saved to DB');
            } catch (e) {
              console.log('Failed to save push token to DB:', e);
            }
          }
        })
        .catch((error) => {
          console.log('Failed to get push token (Missing Firebase config?):', error);
        });
    };

    register();
  }, [user]);

  // Set up notification listeners
  useEffect(() => {
    if (!isNativeReady || !Notifications) return;

    try {
      notificationListener.current = Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log('Notification received:', notification?.request?.content?.title);
        }
      );

      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response?.notification?.request?.content?.data;

          if (data?.type === 'chat' && navigationRef?.current) {
            const nav = navigationRef.current;
            if (user?.role === 'admin') {
              nav.navigate('AdminChatDetail', {
                conversationId: data.conversationId,
                userName: data.userName || 'Student',
              });
            } else {
              nav.navigate('Support');
            }
          }
        }
      );
    } catch (e) {
      console.log('Notification listener error:', e.message);
    }

    return () => {
      try {
        notificationListener.current?.remove?.();
        responseListener.current?.remove?.();
      } catch (e) {
        // Safe to ignore
      }
    };
  }, [user, navigationRef]);

  return (
    <NotificationContext.Provider value={{ expoPushToken }}>
      {children}
    </NotificationContext.Provider>
  );
};
