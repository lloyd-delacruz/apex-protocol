import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import api from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TodayWorkout {
  program?: { name: string; totalWeeks: number };
  currentWeek?: { absoluteWeekNumber: number };
  workoutDay?: {
    workoutType: string;
    phase: string;
    exercisePrescriptions?: Array<{
      id: string;
      exercise: { name: string };
      targetRepRange: string | null;
    }>;
  } | null;
  message?: string;
}

interface SessionDate {
  sessionDate: string;
  workoutDay: { workoutType: string } | null;
}

interface Analytics {
  adherence?: { streak: number; sessionsLast4Weeks: number };
  weeklyVolume?: Array<{ week: string; volume: number }>;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accentColor?: string;
}

function StatCard({ label, value, sub, accentColor = colors.textPrimary }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: accentColor }]}>{value}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    COMPLETED: { label: 'Done', color: colors.success, bg: 'rgba(16, 185, 129, 0.1)' },
    IN_PROGRESS: { label: 'Live', color: colors.accent, bg: 'rgba(0, 194, 255, 0.1)' },
    SKIPPED: { label: 'Skipped', color: colors.textMuted, bg: 'rgba(255,255,255,0.05)' },
    Scheduled: { label: 'Scheduled', color: colors.accent, bg: 'rgba(0, 194, 255, 0.1)' },
  };
  const cfg = statusMap[status] ?? statusMap.Skipped;
  return (
    <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkout | null>(null);
  const [recentSessions, setRecentSessions] = useState<SessionDate[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const fetchData = useCallback(async () => {
    try {
      const [meRes, workoutRes, analyticsRes] = await Promise.allSettled([
        api.auth.me(),
        api.workouts.today(),
        api.analytics.dashboard(),
      ]);

      if (meRes.status === 'fulfilled' && meRes.value.success) {
        const u = meRes.value.data?.user as { name?: string; email?: string } | undefined;
        setUser({ name: u?.name ?? u?.email ?? 'Athlete' });
      }

      if (workoutRes.status === 'fulfilled' && workoutRes.value.success) {
        setTodayWorkout(workoutRes.value.data?.workout as TodayWorkout ?? null);
      }

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.success) {
        setAnalytics(analyticsRes.value.data as Analytics);
      }
    } catch (err) {
      console.error('[HomeScreen] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const streak = analytics?.adherence?.streak ?? 0;
  const weeklyVolume = analytics?.weeklyVolume ?? [];
  const latestVol = weeklyVolume[weeklyVolume.length - 1]?.volume ?? 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const workoutDay = todayWorkout?.workoutDay;
  const exercises = workoutDay?.exercisePrescriptions ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{user?.name ?? 'Athlete'}</Text>
          </View>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>AP</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard label="Streak" value={`${streak}d`} accentColor={colors.accent} />
          <StatCard label="This Week" value={latestVol > 0 ? `${(latestVol / 1000).toFixed(1)}k` : '—'} sub="kg vol" />
          <StatCard
            label="Week"
            value={todayWorkout?.currentWeek ? `${todayWorkout.currentWeek.absoluteWeekNumber}/12` : '—'}
            accentColor={colors.accentSecondary}
          />
        </View>

        {/* Today's workout card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today&apos;s Workout</Text>
          {workoutDay && workoutDay.phase !== 'Rest' ? (
            <View style={styles.todayCard}>
              <View style={styles.todayCardHeader}>
                <View>
                  <Text style={styles.todayCardTitle}>{workoutDay.workoutType}</Text>
                  <Text style={styles.todayCardSub}>
                    Week {todayWorkout?.currentWeek?.absoluteWeekNumber} · {exercises.length} exercises
                  </Text>
                </View>
                <StatusPill status="Scheduled" />
              </View>

              {exercises.map((ex, idx) => (
                <View key={ex.id} style={styles.exerciseRow}>
                  <View style={styles.exerciseIndex}>
                    <Text style={styles.exerciseIndexText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{ex.exercise.name}</Text>
                    {ex.targetRepRange && (
                      <Text style={styles.exerciseSub}>{ex.targetRepRange} reps</Text>
                    )}
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.startButton} activeOpacity={0.8}>
                <Text style={styles.startButtonText}>⚡  Start Workout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.restCard}>
              <Text style={styles.restTitle}>
                {workoutDay?.phase === 'Rest' ? '🌙  Rest Day' : '📋  No workout scheduled'}
              </Text>
              <Text style={styles.restSub}>Recovery is part of the program.</Text>
            </View>
          )}
        </View>

        {/* Recent sessions placeholder */}
        {recentSessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            <View style={styles.card}>
              {recentSessions.map((session, idx) => (
                <View
                  key={`${session.sessionDate}-${idx}`}
                  style={[styles.sessionRow, idx < recentSessions.length - 1 && styles.sessionRowBorder]}
                >
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionName}>{session.workoutDay?.workoutType ?? 'Workout'}</Text>
                    <Text style={styles.sessionDate}>{formatDate(session.sessionDate)}</Text>
                  </View>
                  <StatusPill status="COMPLETED" />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  logoText: { color: colors.background, fontSize: 14, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: 4 },
  statSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  todayCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  todayCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  todayCardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  todayCardSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  restCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
  },
  restTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  restSub: { fontSize: 13, color: colors.textMuted, marginTop: 6 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    gap: 4,
  },
  statusPillText: { fontSize: 11, fontWeight: '600' },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  exerciseIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseIndexText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  exerciseSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  startButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  startButtonText: { color: colors.background, fontSize: 14, fontWeight: '700' },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sessionRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  sessionInfo: { flex: 1 },
  sessionName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  sessionDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
