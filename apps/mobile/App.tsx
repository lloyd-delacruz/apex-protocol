import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { OnboardingProvider } from './src/context/OnboardingContext';
import { colors } from './src/theme/colors';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <OnboardingProvider>
          <NavigationContainer
            theme={{
              dark: true,
              colors: {
                primary: colors.accent,
                background: colors.background,
                card: colors.surface,
                text: colors.textPrimary,
                border: colors.border,
                notification: colors.accent,
              },
            }}
          >
            <StatusBar style="light" backgroundColor={colors.background} />
            <AppNavigator />
          </NavigationContainer>
        </OnboardingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
