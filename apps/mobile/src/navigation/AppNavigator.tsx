import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import ProgressScreen from '../screens/ProgressScreen';
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

// ─── Navigators ───────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();


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
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root navigator ───────────────────────────────────────────────────────────

// ─── Dev Mode ─────────────────────────────────────────────────────────────────
// Set to true to bypass login & onboarding during development
const DEV_MODE = false;

export default function AppNavigator() {
  const { user, loading, onboardingComplete, loginDev, setOnboardingComplete } = useAuth();

  // Auto-login in dev mode
  React.useEffect(() => {
    if (DEV_MODE && !loading && !user) {
      loginDev();
      setOnboardingComplete(true);
    }
  }, [DEV_MODE, loading, user]);

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

  // Onboarding not complete — show onboarding
  if (!onboardingComplete) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    );
  }

  // Authenticated & Onboarding complete — show main app
  return <MainTabs />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
