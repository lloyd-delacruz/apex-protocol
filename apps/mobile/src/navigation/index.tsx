/**
 * Root Navigator
 *
 * Controls which navigator is shown based on auth + onboarding state.
 *
 *   Loading         →  SplashScreen (AP badge + spinner)
 *   No user         →  AuthNavigator      (Login)
 *   Onboarding      →  OnboardingNavigator
 *   Ready           →  MainNavigator      (Tabs)
 *
 * DEV_MODE bypasses auth and onboarding for faster iteration.
 * Toggle via src/constants/config.ts → CONFIG.DEV_MODE
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { CONFIG } from '../constants/config';
import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import MainNavigator from './MainNavigator';

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
      console.log('[RootNavigator] routing — user:', user?.id ?? null, 'onboardingComplete:', onboardingComplete, '→', !user ? 'Auth' : !onboardingComplete ? 'Onboarding' : 'Main');
    }
  }, [loading, user, onboardingComplete]);

  if (loading) return <SplashScreen />;
  if (!user) return <AuthNavigator />;
  if (!onboardingComplete) return <OnboardingNavigator />;
  return <MainNavigator />;
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
