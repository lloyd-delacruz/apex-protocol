import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SessionStackParamList } from './types';
import WorkoutScreen from '../screens/workout/WorkoutScreen';
import ExerciseSelectionScreen from '../screens/workout/ExerciseSelectionScreen';

const Stack = createNativeStackNavigator<SessionStackParamList>();

export default function SessionNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="WorkoutMain" component={WorkoutScreen} />
      <Stack.Screen name="ExerciseSelection" component={ExerciseSelectionScreen} />
    </Stack.Navigator>
  );
}
