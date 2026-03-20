/**
 * Main Navigator
 *
 * Bottom tab navigator for authenticated + onboarded users.
 * 4 tabs matching the reference screenshot design:
 *   Workout  →  WorkoutScreen  (barbell icon)
 *   Body     →  BodyScreen     (body/person icon)
 *   Targets  →  TargetsScreen  (target icon)
 *   Log      →  LogScreen      (calendar icon)
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { MainTabParamList } from './types';

import WorkoutScreen from '../screens/workout/WorkoutScreen';
import BodyScreen from '../screens/body/BodyScreen';
import TargetsScreen from '../screens/targets/TargetsScreen';
import LogScreen from '../screens/workout/LogScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

// ─── Tab icon map ─────────────────────────────────────────────────────────────

const TAB_ICONS: Record<
  keyof MainTabParamList,
  { active: React.ComponentProps<typeof Ionicons>['name']; inactive: React.ComponentProps<typeof Ionicons>['name'] }
> = {
  Workout: { active: 'barbell',    inactive: 'barbell-outline' },
  Body:    { active: 'body',       inactive: 'body-outline' },
  Targets: { active: 'radio-button-on', inactive: 'radio-button-off-outline' },
  Log:     { active: 'calendar',   inactive: 'calendar-outline' },
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
      <Tab.Screen name="Workout" component={WorkoutScreen} />
      <Tab.Screen name="Body"    component={BodyScreen} />
      <Tab.Screen name="Targets" component={TargetsScreen} />
      <Tab.Screen name="Log"     component={LogScreen} />
    </Tab.Navigator>
  );
}
