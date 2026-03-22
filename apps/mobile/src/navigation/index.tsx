/**
 * Root Navigator
 *
 * Single stable Stack.Navigator at the root — screens swap based on auth state.
 * This is the React Navigation recommended auth-flow pattern.
 *
 *   Loading         →  SplashScreen (Premium animated screen)
 *   No user         →  "Auth"        screen  → AuthNavigator
 *   Onboarding      →  "Onboarding"  screen  → OnboardingNavigator
 *   Ready           →  "Main"        screen  → MainNavigator (tabs)
 */

import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { CONFIG } from '../constants/config';
import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import MainNavigator from './MainNavigator';
import { SplashScreen } from '../components/common/SplashScreen';
import type { RootNavigatorParamList } from './types';

const RootStack = createNativeStackNavigator<RootNavigatorParamList>();

// ─── Root navigator ───────────────────────────────────────────────────────────

export default function RootNavigator() {
  const { user, loading, onboardingComplete, loginDev, setOnboardingComplete } = useAuth();
  
  // Custom display state to ensure splash screen is visible for at least 3 seconds
  const [isSplashLoading, setIsSplashLoading] = useState(true);
  const [hasResetDev, setHasResetDev] = useState(false);

  useEffect(() => {
    // We want the premium splash to show for at least 3 seconds
    const timer = setTimeout(() => {
      if (!loading) {
        setIsSplashLoading(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [loading]);

  // Second effect: if auth restore finishes AFTER the 3s timer already fired,
  // the first timer's condition (!loading) was false at fire time so splash stayed.
  // Once loading finishes, give a small delay for a smooth transition then dismiss.
  useEffect(() => {
    if (!loading && isSplashLoading) {
      const timer = setTimeout(() => {
        setIsSplashLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, isSplashLoading]);

  // Dev bypass — forces onboarding to show on every app start.
  // If no user yet: auto-login with dev mock (onboardingComplete=false).
  // If a real session was somehow restored: reset onboardingComplete to false.
  // Toggle CONFIG.DEV_MODE in constants/config.ts.
  useEffect(() => {
    if (!CONFIG.DEV_MODE || loading || hasResetDev) return;
    
    if (!user) {
      console.log('[RootNavigator] DEV_MODE — Auto-logging in dev mock user');
      loginDev();
    } else if (onboardingComplete) {
      console.log('[RootNavigator] DEV_MODE — Forcing onboarding to false for fresh start');
      setOnboardingComplete(false);
    }
    
    setHasResetDev(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, onboardingComplete, hasResetDev]);

  useEffect(() => {
    if (!loading && !isSplashLoading) {
      const dest = !user ? 'Auth' : !onboardingComplete ? 'Onboarding' : 'Main';
      console.log('[RootNavigator] routing — user:', user?.id ?? null, 'onboardingComplete:', onboardingComplete, '→', dest);
    }
  }, [loading, isSplashLoading, user, onboardingComplete]);

  // Show splash if either auth is loading OR our minimum display timer is active
  if (loading || isSplashLoading) {
    return <SplashScreen />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!user ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : !onboardingComplete ? (
        <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : (
        <RootStack.Screen name="Main" component={MainNavigator} />
      )}
    </RootStack.Navigator>
  );
}
