/**
 * Body Navigator
 *
 * Stack navigator nested inside the Body tab.
 * Allows navigation from BodyScreen → TargetsScreen without leaving the tab.
 *
 *   BodyMain  →  BodyScreen     (default)
 *   Targets   →  TargetsScreen  (push on header button press)
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BodyStackParamList } from './types';

import BodyScreen from '../screens/body/BodyScreen';
import TargetsScreen from '../screens/targets/TargetsScreen';
import BodyWeightDetailScreen from '../screens/body/BodyWeightDetailScreen';
import BodyFatDetailScreen from '../screens/body/BodyFatDetailScreen';
import BodyMeasurementsScreen from '../screens/body/BodyMeasurementsScreen';
import BodyPhotosScreen from '../screens/body/BodyPhotosScreen';
import BodyStatisticsScreen from '../screens/body/BodyStatisticsScreen';

const Stack = createNativeStackNavigator<BodyStackParamList>();

export default function BodyNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="BodyMain"         component={BodyScreen} />
      <Stack.Screen name="Targets"          component={TargetsScreen} />
      <Stack.Screen name="BodyWeightDetail" component={BodyWeightDetailScreen} />
      <Stack.Screen name="BodyFatDetail"    component={BodyFatDetailScreen} />
      <Stack.Screen name="BodyMeasurements" component={BodyMeasurementsScreen} />
      <Stack.Screen name="BodyPhotos"       component={BodyPhotosScreen} />
      <Stack.Screen name="BodyStatistics"   component={BodyStatisticsScreen} />
    </Stack.Navigator>
  );
}
