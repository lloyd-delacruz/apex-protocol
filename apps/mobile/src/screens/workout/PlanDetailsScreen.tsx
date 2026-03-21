import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { useTodayWorkout } from '../../hooks/useWorkout';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DashboardStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<DashboardStackParamList>;

export default function PlanDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { data: todayWorkout, loading } = useTodayWorkout();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  const programName = todayWorkout?.program?.name || 'No Active Program';
  const totalWeeks = todayWorkout?.program?.totalWeeks || 0;
  
  // Dummy split data since we don't have a direct endpoint for full split yet
  // In a real app, we'd fetch program.programMonths -> programWeeks -> workoutDays
  const workoutDays = todayWorkout?.workoutDay ? [todayWorkout.workoutDay] : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Program</Text>
          <View style={styles.programCard}>
            <View style={styles.programIcon}>
              <Ionicons name="trophy" size={24} color={colors.brandPrimary} />
            </View>
            <View style={styles.programInfo}>
              <Text style={styles.programName}>{programName}</Text>
              <Text style={styles.programSubtitle}>{totalWeeks} Weeks • Full Body Split</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Workout Split</Text>
            <TouchableOpacity>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          {workoutDays.length > 0 ? (
            workoutDays.map((day, idx) => (
              <View key={day.id || idx} style={styles.dayCard}>
                <View style={styles.dayNumber}>
                  <Text style={styles.dayNumberText}>{idx + 1}</Text>
                </View>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayTitle}>{day.workoutType}</Text>
                  <Text style={styles.daySubtitle}>{day.phase}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No workout days found for this program.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <TouchableOpacity style={styles.preferenceRow}>
            <Ionicons name="calendar-outline" size={22} color={colors.brandPrimary} />
            <Text style={styles.preferenceLabel}>Training Days</Text>
            <Text style={styles.preferenceValue}>Mon, Wed, Fri</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.preferenceRow}>
            <Ionicons name="barbell-outline" size={22} color={colors.brandPrimary} />
            <Text style={styles.preferenceLabel}>Equipment</Text>
            <Text style={styles.preferenceValue}>Full Gym</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  programCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderBottomColor: colors.border,
  },
  programIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 194, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  programSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  editButton: {
    color: colors.brandPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dayNumberText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  dayInfo: {
    flex: 1,
  },
  dayTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  daySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  preferenceLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 12,
  },
  preferenceValue: {
    color: colors.brandPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
