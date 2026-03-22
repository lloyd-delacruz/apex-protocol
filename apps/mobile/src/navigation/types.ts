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
  Landing: undefined;
  Login: undefined;
};

export type AuthStackNavProp = NativeStackNavigationProp<AuthStackParamList>;

// ─── Onboarding Stack ─────────────────────────────────────────────────────────

export type OnboardingStackParamList = {
  OnboardingScreen: undefined;
};

export type OnboardingStackNavProp =
  NativeStackNavigationProp<OnboardingStackParamList>;

// ─── Main Tab Navigator ───────────────────────────────────────────────────────
// 5 tabs: Dashboard · Workout · Progress · Body · Log
// Targets is a stack screen nested inside the Body tab (via BodyNavigator)

export type MainTabParamList = {
  Dashboard: undefined; // Workout Prep
  Workout: NavigatorScreenParams<SessionStackParamList>; // Active Session
  Progress: undefined;  // Targets
  Body: undefined;      // Body & Measurements
  Log: undefined;       // History
};

export type MainTabNavProp = BottomTabNavigationProp<MainTabParamList>;

// ─── Nested Stack Navigators ─────────────────────────────────────────────────

export type DashboardStackParamList = {
  DashboardMain: undefined;
  PlanDetails: undefined;
};

export type SessionStackParamList = {
  WorkoutMain: undefined;
  ExerciseSelection: undefined;
};

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
  BodyMain: undefined;
  Targets: undefined;
  BodyWeightDetail: undefined;
  BodyFatDetail: undefined;
  BodyMeasurements: undefined;
  BodyPhotos: undefined;
  BodyStatistics: undefined;
  MuscleDetail: { muscleId: string; name: string; analytic?: any };
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
