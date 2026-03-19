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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, statusColors, statusBackgrounds } from '../theme/colors';
import { TrainingStatus } from '@apex/shared';
import api from '../lib/api';

const { width } = Dimensions.get('window');

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
  container: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 8, paddingBottom: 24 },
  barWrapper: { flex: 1, alignItems: 'center', height: '100%' },
  barTrack: { flex: 1, width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  barFill: { width: '100%', backgroundColor: colors.brandPrimary, borderRadius: 3, opacity: 0.9 },
  barLabel: { fontSize: 9, color: colors.textMuted, marginTop: 6, fontWeight: '600' },
});

// ─── Trend dot line ───────────────────────────────────────────────────────────

function TrendDotLine({ data }: { data: Array<{ weight: number; date: string }> }) {
  const last7 = data.slice(-7);
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-end', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10 }}>
      {last7.map((point, i) => (
        <View key={i} style={trendStyles.point}>
          <Text style={trendStyles.weightLabel}>{point.weight}k</Text>
          <View style={[trendStyles.dot, i === last7.length - 1 && trendStyles.dotActive]} />
          <Text style={trendStyles.dateLabel}>
            {new Date(point.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
          </Text>
        </View>
      ))}
    </View>
  );
}

const trendStyles = StyleSheet.create({
  point: { alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(0, 194, 255, 0.2)', borderWidth: 1, borderColor: 'rgba(0, 194, 255, 0.4)' },
  dotActive: { backgroundColor: colors.brandPrimary, width: 12, height: 12, borderRadius: 6, borderColor: '#fff' },
  weightLabel: { fontSize: 10, color: colors.textPrimary, fontWeight: '800' },
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
      // Empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedExercise]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0A0A0F', '#1A1A26']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.centeredState}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </SafeAreaView>
      </View>
    );
  }

  const trends = analytics?.strengthTrends ?? [];
  const currentTrend = trends.find((t) => t.exercise === selectedExercise) ?? trends[0] ?? null;
  const weeklyVolumeData = (analytics?.weeklyVolume ?? []).slice(-6).map((w) => ({
    label: w.week.length > 5 ? `Wk${w.week.slice(-2)}` : w.week,
    value: w.volume,
  }));

  const sessions = analytics?.adherence?.sessionsLast4Weeks ?? 0;
  const streak = analytics?.adherence?.streak ?? 0;
  const breakdown = analytics?.statusBreakdown;

  const achievedPct = breakdown && breakdown.total > 0 ? Math.round((breakdown.achieved / breakdown.total) * 100) : 0;
  const progressPct = breakdown && breakdown.total > 0 ? Math.round((breakdown.progress / breakdown.total) * 100) : 0;
  const failedPct = breakdown && breakdown.total > 0 ? Math.round((breakdown.failed / breakdown.total) * 100) : 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#1A1A26']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />}
        >
          <Text style={styles.pageTitle}>EVOLUTION{'\n'}<Text style={styles.italic}>ANALYTICS</Text></Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Sessions</Text>
              <Text style={styles.statValue}>{sessions}</Text>
              <Text style={styles.statSub}>LAST 30D</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Streak</Text>
              <Text style={[styles.statValue, { color: colors.brandPrimary }]}>{streak}d</Text>
              <Text style={styles.statSub}>CURRENT</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Achieved</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>{achievedPct}%</Text>
              <Text style={styles.statSub}>SET TARGETS</Text>
            </View>
          </View>

          {/* Strength Progression */}
          {trends.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Strength Evolution</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exerciseSelector}>
                {trends.map((t) => (
                  <TouchableOpacity
                    key={t.exercise}
                    style={[styles.exercisePill, selectedExercise === t.exercise && styles.exercisePillActive]}
                    onPress={() => setSelectedExercise(t.exercise)}
                  >
                    <Text style={[styles.pillText, selectedExercise === t.exercise && styles.pillTextActive]}>{t.exercise}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {currentTrend && (
                <View style={styles.glassCard}>
                  <View style={styles.trendHeader}>
                    <View>
                      <Text style={styles.cardStatLabel}>Peak Force</Text>
                      <Text style={styles.cardStatValue}>{currentTrend.currentWeight}kg</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.cardStatLabel}>Delta</Text>
                      <Text style={[styles.cardStatValue, { color: currentTrend.weightChangePct >= 0 ? colors.success : colors.danger }]}>
                        {currentTrend.weightChangePct >= 0 ? '+' : ''}{currentTrend.weightChangePct.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                  <TrendDotLine data={currentTrend.dataPoints} />
                </View>
              )}
            </View>
          )}

          {/* Weekly Volume */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Volume Density</Text>
            <View style={styles.glassCard}>
              <View style={styles.volumeHeader}>
                <Text style={styles.cardStatLabel}>Aggregated Volume</Text>
                <Text style={[styles.cardStatValue, { color: colors.brandPrimary }]}>
                  {weeklyVolumeData[weeklyVolumeData.length - 1]?.value?.toLocaleString() ?? '—'} kg
                </Text>
              </View>
              <MiniBarChart data={weeklyVolumeData} />
            </View>
          </View>

          {/* Breakdown */}
          {breakdown && breakdown.total > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performance Reliability</Text>
              <View style={styles.glassCard}>
                {[
                  { label: 'Achieved', value: achievedPct, color: colors.success },
                  { label: 'Progress', value: progressPct, color: colors.brandPrimary },
                  { label: 'Under', value: failedPct, color: colors.danger },
                ].map((item) => (
                  <View key={item.label} style={styles.breakdownRow}>
                    <View style={{ width: 80 }}><Text style={styles.breakdownLabel}>{item.label}</Text></View>
                    <View style={styles.barContainer}>
                      <View style={[styles.fullBar, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                        <View style={[styles.fillBar, { width: `${item.value}%`, backgroundColor: item.color }]} />
                      </View>
                      <Text style={[styles.pctLabel, { color: item.color }]}>{item.value}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 40, fontWeight: '900', color: colors.textPrimary, marginTop: 20, marginBottom: 24, fontStyle: 'italic' },
  italic: { fontStyle: 'italic', color: colors.textPrimary },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  statValue: { fontSize: 24, fontWeight: '900', color: colors.textPrimary, marginTop: 6 },
  statSub: { fontSize: 9, color: colors.textMuted, marginTop: 4, fontWeight: '600' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 16, fontStyle: 'italic', textTransform: 'uppercase' },
  exerciseSelector: { gap: 8, marginBottom: 16, paddingRight: 20 },
  exercisePill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  exercisePillActive: { backgroundColor: 'rgba(0, 194, 255, 0.1)', borderColor: colors.brandPrimary },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  pillTextActive: { color: colors.brandPrimary, fontWeight: '700' },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
  },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  cardStatLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  cardStatValue: { fontSize: 22, fontWeight: '900', color: colors.textPrimary, marginTop: 4 },
  volumeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  breakdownLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  barContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  fullBar: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  fillBar: { height: '100%', borderRadius: 4 },
  pctLabel: { width: 40, fontSize: 14, fontWeight: '900', textAlign: 'right' },
});
