/**
 * Root Navigator
 *
 * Single stable Stack.Navigator at the root — screens swap based on auth state.
 * This is the React Navigation recommended auth-flow pattern.
 * Swapping entire navigator trees (Auth↔Onboarding↔Main) breaks React
 * Navigation's internal state machine; a stable root with conditional screens fixes it.
 *
 *   Loading         →  SplashScreen (AP badge + spinner, rendered outside the navigator)
 *   No user         →  "Auth"        screen  → AuthNavigator
 *   Onboarding      →  "Onboarding"  screen  → OnboardingNavigator
 *   Ready           →  "Main"        screen  → MainNavigator (tabs)
 *
 * DEV_MODE bypasses auth and onboarding for faster iteration.
 * Toggle via src/constants/config.ts → CONFIG.DEV_MODE
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { CONFIG } from '../constants/config';
import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import MainNavigator from './MainNavigator';
import type { RootNavigatorParamList } from './types';

const RootStack = createNativeStackNavigator<RootNavigatorParamList>();

// ─── Splash screen ────────────────────────────────────────────────────────────

function SplashScreen() {
  return (
    <View style={styles.splash}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>AP</Text>
      </View>
      <ActivityIndicator
        size="large"
        color={colors.brandPrimary}
        style={{ marginTop: 24 }}
      />
    </View>
  );
}

// ─── Root navigator ───────────────────────────────────────────────────────────

export default function RootNavigator() {
  const { user, loading, onboardingComplete, loginDev, setOnboardingComplete } = useAuth();

  // Dev bypass — auto-login and skip onboarding during development
  useEffect(() => {
    if (CONFIG.DEV_MODE && !loading && !user) {
      loginDev();
      setOnboardingComplete(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  useEffect(() => {
    if (!loading) {
      const dest = !user ? 'Auth' : !onboardingComplete ? 'Onboarding' : 'Main';
      console.log('[RootNavigator] routing — user:', user?.id ?? null, 'onboardingComplete:', onboardingComplete, '→', dest);
    }
  }, [loading, user, onboardingComplete]);

  // Show splash OUTSIDE the navigator so React Navigation state is not involved
  if (loading) return <SplashScreen />;

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!user ? (
        // ── Unauthenticated ────────────────────────────────────────────────
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : !onboardingComplete ? (
        // ── Authenticated, onboarding incomplete ───────────────────────────
        <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : (
        // ── Authenticated + onboarded ──────────────────────────────────────
        <RootStack.Screen name="Main" component={MainNavigator} />
      )}
    </RootStack.Navigator>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.background,
    fontSize: 24,
    fontWeight: '800',
  },
});
