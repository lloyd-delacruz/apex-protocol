/**
 * Auth Navigator
 *
 * Stack navigator for unauthenticated users.
 * Screens: Splash (as Landing), Login.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import LoginScreen from '../screens/auth/LoginScreen';
import { SplashScreen } from '../components/common/SplashScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {/* 
        The SplashScreen component is used here as the Landing screen.
        It has showButtons={true} internal default or can be passed.
      */}
      <Stack.Screen name="Landing">
        {({ navigation }) => <SplashScreen showButtons navigation={navigation} />}
      </Stack.Screen>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
