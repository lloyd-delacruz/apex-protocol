import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../../theme/colors';

export default function MuscleDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute() as any;
  const { name, analytic } = route.params || { name: 'Muscle' };

  const lastWorked = analytic?.lastWorkedAt 
    ? new Date(analytic.lastWorkedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Never';

  const sets = analytic?.totalSets || 0;
  const recentExercises = analytic?.recentExercises || [];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.inner} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{name}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>LAST WORKED</Text>
              <Text style={styles.statValue}>{lastWorked}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TOTAL SETS (30D)</Text>
              <Text style={styles.statValue}>{sets}</Text>
            </View>
          </View>

          {/* Recovery Status */}
          <View style={styles.statusSection}>
            <View style={[styles.statusBadge, analytic?.isFresh ? styles.freshBadge : styles.fatiguedBadge]}>
                <Ionicons 
                  name={analytic?.isFresh ? "checkmark-circle" : "flash"} 
                  size={16} 
                  color={analytic?.isFresh ? "#34C759" : "#FFC107"} 
                />
                <Text style={[styles.statusText, { color: analytic?.isFresh ? "#34C759" : "#FFC107" }]}>
                    {analytic?.isFresh ? 'FULLY RECOVERED' : 'IN RECOVERY'}
                </Text>
            </View>
          </View>

          {/* Recent History */}
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Recent Exercises</Text>
            {recentExercises.length > 0 ? (
              recentExercises.map((ex: string, i: number) => (
                <View key={i} style={styles.exerciseRow}>
                  <View style={styles.exerciseIcon}>
                    <Ionicons name="barbell-outline" size={20} color={colors.brandPrimary} />
                  </View>
                  <Text style={styles.exerciseName}>{ex}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No recent exercises found.</Text>
                <Text style={styles.emptySubtext}>
                  Workouts targeting this muscle group will appear here.
                </Text>
              </View>
            )}
          </View>

          {/* Tips / Info */}
          <View style={styles.tipsCard}>
             <Ionicons name="bulb-outline" size={20} color={colors.brandPrimary} />
             <Text style={styles.tipsText}>
                Consistency is key. Training {name.toLowerCase()} at least once a week ensures optimal strength maintenance.
             </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  inner: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, fontStyle: 'italic' },
  scroll: { padding: 20 },
  
  statsCard: {
    backgroundColor: '#1C1C28',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 1, marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '900', color: colors.textPrimary },
  divider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' },

  statusSection: { marginTop: 24, alignItems: 'center' },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20,
    borderWidth: 1,
  },
  freshBadge: { backgroundColor: 'rgba(52, 199, 89, 0.1)', borderColor: 'rgba(52, 199, 89, 0.2)' },
  fatiguedBadge: { backgroundColor: 'rgba(255, 193, 7, 0.1)', borderColor: 'rgba(255, 193, 7, 0.2)' },
  statusText: { fontSize: 12, fontWeight: '800' },

  historySection: { marginTop: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 16 },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C28',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  exerciseIcon: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: 'rgba(0,194,255,0.1)', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseName: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },

  tipsCard: {
     flexDirection: 'row',
     backgroundColor: 'rgba(0,194,255,0.05)',
     padding: 16,
     borderRadius: 16,
     marginTop: 20,
     gap: 12,
     alignItems: 'center',
  },
  tipsText: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
});
