import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RootNavigator from './src/navigation';
import { AuthProvider } from './src/context/AuthContext';
import { OnboardingProvider } from './src/context/OnboardingContext';
import { colors } from './src/theme/colors';

export default function App() {
  const [isResetting, setIsResetting] = useState(false);

  // ─── Development Reset Logic ───────────────────────────────────────────────
  // If EXPO_PUBLIC_DEV_RESET is true in .env, clear all storage on startup.
  useEffect(() => {
    async function handleReset() {
      if (__DEV__ && process.env.EXPO_PUBLIC_DEV_RESET === 'true') {
        setIsResetting(true);
        console.log('[App] DEV_RESET is true. Clearing AsyncStorage...');
        try {
          await AsyncStorage.clear();
          console.log('[App] AsyncStorage cleared successfully.');
        } catch (err) {
          console.error('[App] Failed to clear AsyncStorage:', err);
        } finally {
          setIsResetting(false);
        }
      }
    }
    handleReset();
  }, []);

  if (isResetting) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
        <Text style={{ color: colors.textPrimary, marginTop: 20, fontWeight: 'bold' }}>DEV RESET ACTIVE</Text>
        <Text style={{ color: colors.textMuted, marginTop: 10 }}>Clearing state...</Text>
      </View>
    );
  }

  return (
    // Dark root view prevents white flash before NavigationContainer theme is applied
    <View style={styles.darkRoot}>
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
            <RootNavigator />
          </NavigationContainer>
        </OnboardingProvider>
      </AuthProvider>
    </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  darkRoot: {
    flex: 1,
    backgroundColor: '#06060A',
  },
});
