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
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import api from '../lib/api';

const { width } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

interface TodayWorkout {
  program?: { name: string; totalWeeks: number };
  currentWeek?: { absoluteWeekNumber: number };
  workoutDay?: {
    workoutType: string;
    phase: string;
    exercisePrescriptions?: Array<{
      id: string;
      exercise: { name: string; muscleGroup?: string | null };
      targetRepRange: string | null;
      targetSets?: number;
    }>;
  } | null;
  message?: string;
}

interface Analytics {
  adherence?: { streak: number; sessionsLast4Weeks: number };
  weeklyVolume?: Array<{ week: string; volume: number }>;
}

interface RecentSession {
  sessionDate: string;
  workoutDay?: { workoutType: string } | null;
  durationSec?: number;
  totalVolume?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accentColor = colors.textPrimary }: {
  label: string; value: string; sub?: string; accentColor?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: accentColor }]}>{value}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

type DashState = 'loading' | 'no-program' | 'rest' | 'ready' | 'error';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [dashState, setDashState] = useState<DashState>('loading');
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkout | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const fetchData = useCallback(async () => {
    try {
      const [meRes, workoutRes, analyticsRes, historyRes] = await Promise.allSettled([
        api.auth.me(),
        api.workouts.today(),
        api.analytics.dashboard(),
        api.request<{ sessions: RecentSession[] }>('GET', '/api/training-log/history'),
      ]);

      // User
      if (meRes.status === 'fulfilled' && meRes.value.success) {
        const u = meRes.value.data?.user as { name?: string; email?: string } | undefined;
        setUser({ name: u?.name ?? u?.email ?? 'Athlete' });
      } else {
        setUser({ name: 'Athlete' });
      }

      // Analytics
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.success) {
        setAnalytics(analyticsRes.value.data as Analytics);
      }

      // Recent sessions
      if (historyRes.status === 'fulfilled' && historyRes.value.success) {
        setRecentSessions((historyRes.value.data as any)?.logs ?? []);
      }

      // Today's workout — determine state
      if (workoutRes.status === 'fulfilled' && workoutRes.value.success) {
        const data = workoutRes.value.data as TodayWorkout | null;
        setTodayWorkout(data ?? null);

        if (!data || !data.program) {
          // No program assigned
          setDashState('no-program');
        } else if (!data.workoutDay || data.workoutDay.phase === 'Rest') {
          // Rest day
          setDashState('rest');
        } else {
          // Workout available
          setDashState('ready');
        }
      } else {
        // API call failed — treat as no program
        setDashState('no-program');
      }
    } catch (err: any) {
      console.error('[HomeScreen] fetch error:', err);
      setErrorMsg(err.message ?? 'Connection error');
      setDashState('error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // Generate program for users who don't have one
  const handleGenerateProgram = async () => {
    setGenerating(true);
    try {
      // Use default settings for quick generation
      const genRes = await api.request<{ program: { id: string } }>('POST', '/api/programs/generate', {
        goal: 'muscle',
        experience: 'intermediate',
        consistency: 'consistent',
        environment: 'commercial_gym',
        equipment: ['Barbell', 'Dumbbells', 'Bench', 'Cables'],
        workoutsPerWeek: 4,
      });

      if (genRes.success && genRes.data?.program?.id) {
        // Assign the program
        await api.request('POST', `/api/programs/${genRes.data.program.id}/assign`, {});
        Alert.alert('Program Created!', 'Your training program has been generated. Pull down to refresh.');
        fetchData();
      } else {
        Alert.alert('Error', genRes.error ?? 'Failed to generate program');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to generate program');
    } finally {
      setGenerating(false);
    }
  };

  const streak = analytics?.adherence?.streak ?? 0;
  const weeklyVolume = analytics?.weeklyVolume ?? [];
  const latestVol = weeklyVolume[weeklyVolume.length - 1]?.volume ?? 0;
  const sessions = analytics?.adherence?.sessionsLast4Weeks ?? 0;

  const Background = () => <LinearGradient colors={['#0A0A0F', '#1A1A26']} style={StyleSheet.absoluteFill} />;

  // ═══ Loading ═══════════════════════════════════════════════════════════════
  if (dashState === 'loading') {
    return (
      <View style={styles.container}><Background />
        <SafeAreaView style={styles.centeredState}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </SafeAreaView>
      </View>
    );
  }

  // ═══ Error ══════════════════════════════════════════════════════════════════
  if (dashState === 'error') {
    return (
      <View style={styles.container}><Background />
        <SafeAreaView style={styles.centeredState}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Connection Issue</Text>
          <Text style={styles.emptySub}>{errorMsg ?? 'Could not reach the server'}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => { setDashState('loading'); fetchData(); }}>
            <Text style={styles.primaryBtnText}>RETRY</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const workoutDay = todayWorkout?.workoutDay;
  const exercises = workoutDay?.exercisePrescriptions ?? [];

  return (
    <View style={styles.container}>
      <Background />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />}
        >
          {/* ── Header ──────────────────────────────── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{greeting},</Text>
              <Text style={styles.userName}>{user?.name ?? 'Athlete'}</Text>
            </View>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>AP</Text>
            </View>
          </View>

          {/* ── Stats row ───────────────────────────── */}
          <View style={styles.statsRow}>
            <StatCard label="Streak" value={`${streak}d`} accentColor={colors.brandPrimary} />
            <StatCard label="Sessions" value={sessions > 0 ? `${sessions}` : '—'} sub="LAST 30D" />
            <StatCard
              label="Volume"
              value={latestVol > 0 ? `${(latestVol / 1000).toFixed(1)}k` : '—'}
              sub="THIS WEEK"
              accentColor={colors.accentSecondary}
            />
          </View>

          {/* ═══ No Program State ═══════════════════════════════════════════ */}
          {dashState === 'no-program' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Get Started</Text>
              <View style={styles.noProgramCard}>
                <View style={styles.noProgramIcon}>
                  <Ionicons name="barbell-outline" size={40} color={colors.brandPrimary} />
                </View>
                <Text style={styles.noProgramTitle}>No Program Assigned</Text>
                <Text style={styles.noProgramSub}>
                  Generate a personalized training program based on your goals, experience, and available equipment.
                </Text>
                <TouchableOpacity
                  style={[styles.primaryBtn, generating && { opacity: 0.5 }]}
                  onPress={handleGenerateProgram}
                  disabled={generating}
                >
                  {generating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>GENERATE PROGRAM</Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.noProgramHint}>
                  Or navigate to the Workout tab to start a quick session
                </Text>
              </View>
            </View>
          )}

          {/* ═══ Rest Day State ═════════════════════════════════════════════ */}
          {dashState === 'rest' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today's Schedule</Text>
              <View style={styles.restCard}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🌙</Text>
                <Text style={styles.restTitle}>Recovery Protocol</Text>
                <Text style={styles.restSub}>
                  Rest is where the growth happens.{'\n'}See you tomorrow, champion.
                </Text>
              </View>
            </View>
          )}

          {/* ═══ Workout Ready State ═══════════════════════════════════════ */}
          {dashState === 'ready' && workoutDay && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today's Workout</Text>
              <View style={styles.todayCard}>
                <View style={styles.todayCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.todayCardTitle}>{workoutDay.workoutType}</Text>
                    <Text style={styles.todayCardSub}>
                      Week {todayWorkout?.currentWeek?.absoluteWeekNumber} · {exercises.length} exercises · {workoutDay.phase}
                    </Text>
                  </View>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>Scheduled</Text>
                  </View>
                </View>

                {exercises.slice(0, 5).map((ex, idx) => (
                  <View key={ex.id} style={styles.exerciseRow}>
                    <View style={styles.exerciseIndex}>
                      <Text style={styles.exerciseIndexText}>{idx + 1}</Text>
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{ex.exercise.name}</Text>
                      <Text style={styles.exerciseSub}>
                        {ex.targetSets ? `${ex.targetSets} sets · ` : ''}{ex.targetRepRange ?? '8-12'} reps
                        {ex.exercise.muscleGroup ? ` · ${ex.exercise.muscleGroup}` : ''}
                      </Text>
                    </View>
                  </View>
                ))}

                {exercises.length > 5 && (
                  <Text style={styles.moreExercises}>+{exercises.length - 5} more exercises</Text>
                )}

                <TouchableOpacity
                  style={styles.igniteBtn}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('Workout' as never)}
                >
                  <Ionicons name="flash" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.igniteBtnText}>IGNITE PROTOCOL</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Recent Sessions ─────────────────────── */}
          {recentSessions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Sessions</Text>
              {recentSessions.slice(0, 3).map((s, i) => (
                <View key={i} style={styles.sessionRow}>
                  <View style={styles.sessionDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionType}>
                      {s.workoutDay?.workoutType ?? 'Workout'}
                    </Text>
                    <Text style={styles.sessionDate}>
                      {new Date(s.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  {s.totalVolume != null && s.totalVolume > 0 && (
                    <Text style={styles.sessionVolume}>
                      {(s.totalVolume / 1000).toFixed(1)}k vol
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* ── Quick Actions ──────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('Workout' as never)}
              >
                <Ionicons name="barbell-outline" size={24} color={colors.brandPrimary} />
                <Text style={styles.quickActionLabel}>Start{'\n'}Workout</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('Progress' as never)}
              >
                <Ionicons name="stats-chart-outline" size={24} color={colors.accentSecondary} />
                <Text style={styles.quickActionLabel}>View{'\n'}Progress</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionCard}>
                <Ionicons name="trophy-outline" size={24} color={colors.warning} />
                <Text style={styles.quickActionLabel}>Personal{'\n'}Records</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginTop: 2 },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandPrimary,
  },
  logoText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  statSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },

  // Empty / Error states
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  primaryBtn: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
    width: '100%',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', fontStyle: 'italic' },

  // No program card
  noProgramCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 30,
    alignItems: 'center',
  },
  noProgramIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 194, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  noProgramTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  noProgramSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  noProgramHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 16 },

  // Rest day
  restCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 40,
    alignItems: 'center',
  },
  restTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  restSub: { fontSize: 14, color: colors.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 22 },

  // Today's workout card
  todayCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
  },
  todayCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  todayCardTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  todayCardSub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 194, 255, 0.1)',
  },
  statusPillText: { fontSize: 11, fontWeight: '700', color: colors.brandPrimary, textTransform: 'uppercase' },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  exerciseIndex: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseIndexText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  exerciseSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  moreExercises: { fontSize: 13, color: colors.brandPrimary, fontWeight: '600', textAlign: 'center', paddingVertical: 12 },
  igniteBtn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 16,
  },
  igniteBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', fontStyle: 'italic' },

  // Recent sessions
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  sessionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brandPrimary,
  },
  sessionType: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  sessionDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  sessionVolume: { fontSize: 14, fontWeight: '700', color: colors.textMuted },

  // Quick actions
  quickActionsRow: { flexDirection: 'row', gap: 12 },
  quickActionCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  quickActionLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, textAlign: 'center', lineHeight: 16 },
});
