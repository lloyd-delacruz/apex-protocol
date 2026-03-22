import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WorkoutStackParamList } from './types';
import WorkoutHomeScreen from '../screens/workout/WorkoutHomeScreen';
import PlanDetailsScreen from '../screens/workout/PlanDetailsScreen';

const Stack = createNativeStackNavigator<WorkoutStackParamList>();

export default function WorkoutNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="WorkoutMain" component={WorkoutHomeScreen} />
      <Stack.Screen name="PlanDetails" component={PlanDetailsScreen} />
    </Stack.Navigator>
  );
}
