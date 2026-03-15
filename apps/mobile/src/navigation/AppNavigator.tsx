import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import ProgressScreen from '../screens/ProgressScreen';
import LoginScreen from '../screens/LoginScreen';

// ─── Navigators ───────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Tab icons ────────────────────────────────────────────────────────────────

const HomeIcon = ({ focused, color }: { focused: boolean; color: string }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
    <View style={styles.svgPlaceholder}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  </View>
);

const BoltIcon = ({ focused, color }: { focused: boolean; color: string }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
    <Text style={{ color, fontSize: 18 }}>⚡</Text>
  </View>
);

const ChartIcon = ({ focused, color }: { focused: boolean; color: string }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
    <Text style={{ color, fontSize: 18 }}>📊</Text>
  </View>
);

// ─── Main tab navigator ───────────────────────────────────────────────────────

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <HomeIcon focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <BoltIcon focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <ChartIcon focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root navigator ───────────────────────────────────────────────────────────

export default function AppNavigator() {
  const { user, loading } = useAuth();

  // Show a splash/loading screen while restoring session
  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingBadge}>
          <Text style={styles.loadingBadgeText}>AP</Text>
        </View>
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 24 }} />
      </View>
    );
  }

  // Not authenticated — show login
  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  // Authenticated — show main app
  return <MainTabs />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 28,
    borderRadius: 8,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(0, 194, 255, 0.08)',
  },
  svgPlaceholder: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 14,
    height: 14,
    gap: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 1,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBadgeText: { color: colors.background, fontSize: 24, fontWeight: '800' },
});
