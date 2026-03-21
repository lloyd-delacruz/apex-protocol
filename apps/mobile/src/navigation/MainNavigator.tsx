/**
 * Main Navigator
 *
 * Bottom tab navigator for authenticated + onboarded users.
- * 5 tabs: Workout · Progress · Body · Log
- *
- *   Workout    →  DashboardScreen   (barbell icon - renamed from Dashboard)
- *   Session    →  WorkoutScreen     (flash icon - renamed from Workout)
- *   Targets    →  ProgressScreen    (disc icon - renamed from Progress)
- *   Body       →  BodyNavigator     (body icon — stack: Body + Targets)
- *   Log        →  LogScreen         (calendar icon)
- */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { MainTabParamList } from './types';

import WorkoutNavigator from './WorkoutNavigator';
import SessionNavigator from './SessionNavigator';
import ProgressScreen from '../screens/progress/ProgressScreen';
import BodyNavigator from './BodyNavigator';
import LogScreen from '../screens/workout/LogScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

// ─── Tab icon map ─────────────────────────────────────────────────────────────

const TAB_ICONS: Record<
  keyof MainTabParamList,
  { active: React.ComponentProps<typeof Ionicons>['name']; inactive: React.ComponentProps<typeof Ionicons>['name'] }
> = {
  Dashboard: { active: 'barbell',     inactive: 'barbell-outline' },
  Workout:   { active: 'flash',       inactive: 'flash-outline' },
  Progress:  { active: 'disc',        inactive: 'disc-outline' },
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
      <Tab.Screen name="Dashboard" component={WorkoutNavigator} options={{ tabBarLabel: 'Workout' }} />
      <Tab.Screen name="Workout"   component={SessionNavigator} options={{ tabBarLabel: 'Session' }} />
      <Tab.Screen name="Progress"  component={ProgressScreen} options={{ tabBarLabel: 'Targets' }} />
      <Tab.Screen
        name="Body"
        component={BodyNavigator}
        options={{ tabBarLabel: 'Body' }}
      />
      <Tab.Screen name="Log"       component={LogScreen} />
    </Tab.Navigator>
  );
}
