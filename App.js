import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { CourseProvider } from './src/context/CourseContext';
import { ChatProvider } from './src/context/ChatContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';

// Suppress specific warnings in development
LogBox.ignoreLogs([
  'AsyncStorage has been extracted',
  'Setting a timer',
  'VirtualizedLists should never be nested',
]);

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <CourseProvider>
            <ChatProvider>
              <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
              <AppNavigator />
            </ChatProvider>
          </CourseProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
