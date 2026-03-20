/**
 * Main Navigator
 *
 * Bottom tab navigator for authenticated + onboarded users.
 * 5 tabs: Dashboard · Workout · Progress · Body · Log
 *
 *   Dashboard  →  DashboardScreen   (home icon)
 *   Workout    →  WorkoutScreen     (barbell icon)
 *   Progress   →  ProgressScreen    (trending-up icon)
 *   Body       →  BodyNavigator     (body icon — stack: Body + Targets)
 *   Log        →  LogScreen         (calendar icon)
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { MainTabParamList } from './types';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import WorkoutScreen from '../screens/workout/WorkoutScreen';
import ProgressScreen from '../screens/progress/ProgressScreen';
import BodyNavigator from './BodyNavigator';
import LogScreen from '../screens/workout/LogScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

// ─── Tab icon map ─────────────────────────────────────────────────────────────

const TAB_ICONS: Record<
  keyof MainTabParamList,
  { active: React.ComponentProps<typeof Ionicons>['name']; inactive: React.ComponentProps<typeof Ionicons>['name'] }
> = {
  Dashboard: { active: 'home',        inactive: 'home-outline' },
  Workout:   { active: 'barbell',     inactive: 'barbell-outline' },
  Progress:  { active: 'trending-up', inactive: 'trending-up-outline' },
  Body:      { active: 'body',        inactive: 'body-outline' },
  Log:       { active: 'calendar',    inactive: 'calendar-outline' },
};

// ─── Navigator ────────────────────────────────────────────────────────────────

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = TAB_ICONS[route.name];
          const name = focused ? icons.active : icons.inactive;
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Workout"   component={WorkoutScreen} />
      <Tab.Screen name="Progress"  component={ProgressScreen} />
      <Tab.Screen
        name="Body"
        component={BodyNavigator}
        options={{ tabBarLabel: 'Body' }}
      />
      <Tab.Screen name="Log"       component={LogScreen} />
    </Tab.Navigator>
  );
}
