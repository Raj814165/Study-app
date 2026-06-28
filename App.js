import React, { useRef } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { CourseProvider } from './src/context/CourseContext';
import { ChatProvider } from './src/context/ChatContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';

// Suppress specific warnings in development
LogBox.ignoreLogs([
  'AsyncStorage has been extracted',
  'Setting a timer',
  'VirtualizedLists should never be nested',
]);

export default function App() {
  const navigationRef = useRef(null);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <CourseProvider>
            <ChatProvider>
              <NotificationProvider navigationRef={navigationRef}>
                <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
                <AppNavigator navigationRef={navigationRef} />
              </NotificationProvider>
            </ChatProvider>
          </CourseProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
