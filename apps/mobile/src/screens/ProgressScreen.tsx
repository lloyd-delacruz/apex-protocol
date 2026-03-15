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
import { colors, statusColors, statusBackgrounds } from '../theme/colors';
import { TrainingStatus } from '@apex/shared';
import api from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StrengthTrend {
  exercise: string;
  dataPoints: Array<{ date: string; weight: number; status: string | null }>;
  currentWeight: number;
  weightChangePct: number;
}

interface Analytics {
  strengthTrends: StrengthTrend[];
  weeklyVolume: Array<{ week: string; volume: number }>;
  adherence: { sessionsLast4Weeks: number; streak: number; adherenceRate: number };
  statusBreakdown?: { achieved: number; progress: number; failed: number; total: number };
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function MiniBarChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={barStyles.container}>
      {data.map((item) => (
        <View key={item.label} style={barStyles.barWrapper}>
          <View style={barStyles.barTrack}>
            <View style={[barStyles.barFill, { height: `${(item.value / maxVal) * 100}%` }]} />
          </View>
          <Text style={barStyles.barLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 6, paddingBottom: 18 },
  barWrapper: { flex: 1, alignItems: 'center', height: '100%' },
  barTrack: { flex: 1, width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 3, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: colors.accent, borderRadius: 3, opacity: 0.8 },
  barLabel: { fontSize: 9, color: colors.textMuted, marginTop: 4, position: 'absolute', bottom: 0 },
});

// ─── Trend dot line ───────────────────────────────────────────────────────────

function TrendDotLine({ data }: { data: Array<{ weight: number; date: string }> }) {
  const last7 = data.slice(-7);
  return (
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'flex-end' }}>
      {last7.map((point, i) => (
        <View key={i} style={trendStyles.point}>
          <View style={[trendStyles.dot, i === last7.length - 1 && trendStyles.dotActive]} />
          <Text style={trendStyles.weightLabel}>{point.weight}kg</Text>
          <Text style={trendStyles.dateLabel}>
            {new Date(point.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
          </Text>
        </View>
      ))}
    </View>
  );
}

const trendStyles = StyleSheet.create({
  point: { flex: 1, alignItems: 'center', gap: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: `${colors.accent}40` },
  dotActive: { backgroundColor: colors.accent, width: 10, height: 10 },
  weightLabel: { fontSize: 9, color: colors.textPrimary, fontWeight: '600' },
  dateLabel: { fontSize: 8, color: colors.textMuted },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.analytics.dashboard();
      if (res.success && res.data) {
        const data = res.data as Analytics;
        setAnalytics(data);
        if (data.strengthTrends?.length > 0 && !selectedExercise) {
          setSelectedExercise(data.strengthTrends[0].exercise);
        }
      }
    } catch {
      // Silently fail — show empty states
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const trends = analytics?.strengthTrends ?? [];
  const currentTrend = trends.find((t) => t.exercise === selectedExercise) ?? trends[0] ?? null;
  const weeklyVolumeData = (analytics?.weeklyVolume ?? []).slice(-6).map((w) => ({
    label: w.week.length > 5 ? `Wk${w.week.slice(-2)}` : w.week,
    value: w.volume,
  }));

  const sessions = analytics?.adherence?.sessionsLast4Weeks ?? 0;
  const streak = analytics?.adherence?.streak ?? 0;
  const breakdown = analytics?.statusBreakdown;

  const achievedPct = breakdown && breakdown.total > 0
    ? Math.round((breakdown.achieved / breakdown.total) * 100)
    : null;

  const progressPct = breakdown && breakdown.total > 0
    ? Math.round((breakdown.progress / breakdown.total) * 100)
    : null;

  const failedPct = breakdown && breakdown.total > 0
    ? Math.round((breakdown.failed / breakdown.total) * 100)
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <Text style={styles.pageTitle}>Progress</Text>

        {/* ── Stats row ────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Sessions</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{sessions}</Text>
            <Text style={styles.statSub}>last 4 weeks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>{streak}d</Text>
            <Text style={styles.statSub}>current</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Achieved</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {achievedPct !== null ? `${achievedPct}%` : '—'}
            </Text>
            <Text style={styles.statSub}>of all sets</Text>
          </View>
        </View>

        {/* ── Weight progression ────────────────────────────────────── */}
        {trends.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weight Progression</Text>

            <View style={styles.exerciseSelector}>
              {trends.map((t) => (
                <TouchableOpacity
                  key={t.exercise}
                  style={[styles.exercisePill, selectedExercise === t.exercise && styles.exercisePillActive]}
                  onPress={() => setSelectedExercise(t.exercise)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.exercisePillText, selectedExercise === t.exercise && styles.exercisePillTextActive]}>
                    {t.exercise}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {currentTrend && currentTrend.dataPoints.length > 0 && (
              <View style={styles.progressionCard}>
                <View style={styles.progressionStats}>
                  <View>
                    <Text style={styles.statLabel}>Start</Text>
                    <Text style={styles.progressWeight}>{currentTrend.dataPoints[0].weight}kg</Text>
                  </View>
                  <View>
                    <Text style={styles.statLabel}>Current</Text>
                    <Text style={styles.progressWeight}>{currentTrend.currentWeight}kg</Text>
                  </View>
                  <View>
                    <Text style={styles.statLabel}>Change</Text>
                    <Text style={[styles.progressWeight, { color: currentTrend.weightChangePct >= 0 ? colors.success : colors.danger }]}>
                      {currentTrend.weightChangePct >= 0 ? '+' : ''}{currentTrend.weightChangePct.toFixed(1)}%
                    </Text>
                  </View>
                </View>
                <TrendDotLine data={currentTrend.dataPoints} />
              </View>
            )}

            {(!currentTrend || currentTrend.dataPoints.length === 0) && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No data yet. Log some workouts to see progression.</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Weekly volume ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Volume</Text>
          <View style={styles.card}>
            {weeklyVolumeData.length > 0 ? (
              <>
                <View style={styles.volumeHeader}>
                  <Text style={styles.statLabel}>This week</Text>
                  <Text style={[styles.progressWeight, { color: colors.accent }]}>
                    {weeklyVolumeData[weeklyVolumeData.length - 1]?.value?.toLocaleString() ?? '0'} kg
                  </Text>
                </View>
                <MiniBarChart data={weeklyVolumeData} />
              </>
            ) : (
              <Text style={styles.emptyText}>No volume data yet.</Text>
            )}
          </View>
        </View>

        {/* ── Status breakdown ──────────────────────────────────────── */}
        {breakdown && breakdown.total > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Set Status Breakdown</Text>
            <View style={styles.card}>
              {[
                { label: 'Achieved', value: achievedPct ?? 0, color: colors.success },
                { label: 'In Progress', value: progressPct ?? 0, color: colors.accent },
                { label: 'Failed', value: failedPct ?? 0, color: colors.danger },
              ].map((item) => (
                <View key={item.label} style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.breakdownDot, { backgroundColor: item.color }]} />
                    <Text style={styles.breakdownLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.breakdownRight}>
                    <View style={[styles.breakdownBar, { backgroundColor: `${item.color}20` }]}>
                      <View style={[styles.breakdownBarFill, { width: `${item.value}%`, backgroundColor: item.color }]} />
                    </View>
                    <Text style={[styles.breakdownPct, { color: item.color }]}>{item.value}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Top progressing exercises ─────────────────────────────── */}
        {trends.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Progressing Exercises</Text>
            <View style={styles.card}>
              {trends.map((trend, idx) => {
                const status: TrainingStatus = trend.weightChangePct >= 0 ? 'ACHIEVED' : 'PROGRESS';
                return (
                  <View key={trend.exercise} style={[styles.topExRow, idx < trends.length - 1 && styles.topExRowBorder]}>
                    <Text style={styles.topExRank}>{idx + 1}</Text>
                    <Text style={styles.topExName}>{trend.exercise}</Text>
                    <View style={styles.topExStats}>
                      <Text style={[styles.topExChange, { color: trend.weightChangePct >= 0 ? colors.success : colors.danger }]}>
                        {trend.weightChangePct >= 0 ? '+' : ''}{trend.weightChangePct.toFixed(1)}%
                      </Text>
                      <Text style={styles.topExWeight}>{trend.currentWeight}kg</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusBackgrounds[status] }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColors[status] }]}>
                        {status === 'ACHIEVED' ? '✓' : '~'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Empty state ───────────────────────────────────────────── */}
        {trends.length === 0 && !loading && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No progress data yet</Text>
            <Text style={styles.emptyText}>Complete your first workout to start tracking progression.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, paddingTop: 16, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: colors.border },
  statLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  statSub: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  card: { backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 14, overflow: 'hidden' },
  exerciseSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  exercisePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  exercisePillActive: { borderColor: `${colors.accent}40`, backgroundColor: `${colors.accent}10` },
  exercisePillText: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
  exercisePillTextActive: { color: colors.accent },
  progressionCard: { backgroundColor: colors.surfaceElevated, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 14 },
  progressionStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  progressWeight: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 4 },
  volumeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 100 },
  breakdownDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { fontSize: 13, color: colors.textMuted },
  breakdownRight: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end' },
  breakdownBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  breakdownBarFill: { height: '100%', borderRadius: 3 },
  breakdownPct: { width: 35, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  topExRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  topExRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  topExRank: { width: 20, fontSize: 12, fontWeight: '700', color: colors.textMuted, textAlign: 'center' },
  topExName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  topExStats: { alignItems: 'flex-end' },
  topExChange: { fontSize: 13, fontWeight: '700' },
  topExWeight: { fontSize: 10, color: colors.textMuted },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
