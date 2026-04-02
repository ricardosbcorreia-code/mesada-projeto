import React from 'react';
import { registerRootComponent } from 'expo';
import { AuthProvider } from './src/store/AuthContext';
import AppNavigation from './src/navigation/AppNavigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar barStyle="dark-content" />
        <AppNavigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);

