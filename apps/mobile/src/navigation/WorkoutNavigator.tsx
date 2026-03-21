import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardStackParamList } from './types';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import PlanDetailsScreen from '../screens/workout/PlanDetailsScreen';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export default function WorkoutNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
      <Stack.Screen name="PlanDetails" component={PlanDetailsScreen} />
    </Stack.Navigator>
  );
}
