/**
 * Main Navigator
 *
 * Bottom tab navigator for authenticated + onboarded users.
 * 4 tabs: Workout · Body · Progress · Log
 *
 *   Workout  →  WorkoutNavigator  (barbell icon — stack: WorkoutHomeScreen + PlanDetails)
 *   Body     →  BodyNavigator     (body icon — stack: Body + Targets)
 *   Progress →  TargetsScreen     (disc icon)
 *   Log      →  LogScreen         (calendar icon)
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { MainTabParamList } from './types';

import WorkoutNavigator from './WorkoutNavigator';
import TargetsScreen from '../screens/targets/TargetsScreen';
import BodyNavigator from './BodyNavigator';
import LogScreen from '../screens/workout/LogScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

// ─── Tab icon map ─────────────────────────────────────────────────────────────

const TAB_ICONS: Record<
  keyof MainTabParamList,
  { active: React.ComponentProps<typeof Ionicons>['name']; inactive: React.ComponentProps<typeof Ionicons>['name'] }
> = {
  Workout:  { active: 'barbell',  inactive: 'barbell-outline' },
  Progress: { active: 'disc',     inactive: 'disc-outline' },
  Body:     { active: 'body',     inactive: 'body-outline' },
  Log:      { active: 'calendar', inactive: 'calendar-outline' },
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
          const icons = TAB_ICONS[route.name as keyof MainTabParamList];
          const name = focused ? icons.active : icons.inactive;
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Workout"
        component={WorkoutNavigator}
      />
      <Tab.Screen
        name="Body"
        component={BodyNavigator}
        options={{ tabBarLabel: 'Body' }}
      />
      <Tab.Screen 
        name="Progress"  
        component={TargetsScreen} 
        options={{ tabBarLabel: 'Targets' }} 
      />
      <Tab.Screen 
        name="Log" 
        component={LogScreen} 
      />
    </Tab.Navigator>
  );
}
