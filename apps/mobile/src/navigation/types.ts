/**
 * Navigation — Type Definitions
 *
 * Defines typed param lists for every navigator in the app.
 * Import these in screens to get type-safe navigation calls.
 *
 * Usage:
 *   const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
 *   navigation.navigate('Workout');
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// ─── Auth Stack ───────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
};

export type AuthStackNavProp = NativeStackNavigationProp<AuthStackParamList>;

// ─── Onboarding Stack ─────────────────────────────────────────────────────────

export type OnboardingStackParamList = {
  Onboarding: undefined;
};

export type OnboardingStackNavProp =
  NativeStackNavigationProp<OnboardingStackParamList>;

// ─── Main Tab Navigator ───────────────────────────────────────────────────────
// 4 tabs matching screenshot reference: Workout · Body · Targets · Log

export type MainTabParamList = {
  Workout: undefined;
  Body: undefined;
  Targets: undefined;
  Log: undefined;
};

export type MainTabNavProp = BottomTabNavigationProp<MainTabParamList>;

// ─── Nested Stack Navigators (future deep screens) ───────────────────────────

export type WorkoutStackParamList = {
  Workout: undefined;
  Log: undefined;
  ExerciseDetail: { exerciseId: string };
};

export type ProgressStackParamList = {
  Progress: undefined;
  ExerciseHistory: { exerciseId: string; exerciseName: string };
};

export type BodyStackParamList = {
  Body: undefined;
  MetricsHistory: undefined;
};

export type TargetsStackParamList = {
  Targets: undefined;
};

// ─── Root Navigator ───────────────────────────────────────────────────────────

export type RootNavigatorParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
