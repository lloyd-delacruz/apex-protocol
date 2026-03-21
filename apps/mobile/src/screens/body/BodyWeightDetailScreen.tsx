import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SimpleLineChart from '../../components/body/SimpleLineChart';
import { colors } from '../../theme/colors';
import { useMetricsHistory } from '../../hooks/useMetrics';
import MetricHero from '../../components/body/MetricHero';
import { useNavigation } from '@react-navigation/native';
import { MetricEntry } from '../../types/api';

const { width } = Dimensions.get('window');

export default function BodyWeightDetailScreen() {
  const navigation = useNavigation();
  const { entries, loading } = useMetricsHistory(90);
  const [range, setRange] = useState<'1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'>('1M');

  // Filter metrics for weight specifically
  const weightEntries = useMemo(() => {
    return entries
      .filter((m: MetricEntry) => m.body_weight_kg !== null)
      .sort((a: MetricEntry, b: MetricEntry) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries]);

  const latestWeight = weightEntries[0]?.body_weight_kg?.toFixed(1) || '--';
  const unit = weightEntries[0]?.body_weight_unit || 'kg';

  // Chart data Preparation
  const chartData = useMemo(() => {
    const sorted = [...weightEntries].reverse();
    if (sorted.length === 0) return null;

    // Filter by range logic (simplified for implementation)
    const now = new Date();
    let filtered = sorted;
    if (range === '1W') filtered = sorted.filter((m: MetricEntry) => (now.getTime() - new Date(m.date).getTime()) < 7 * 24 * 3600000);
    if (range === '1M') filtered = sorted.filter((m: MetricEntry) => (now.getTime() - new Date(m.date).getTime()) < 30 * 24 * 3600000);
    
    if (filtered.length === 0) return null;

    return {
      labels: filtered.length > 5 ? [] : filtered.map((m: MetricEntry) => new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
      datasets: [{
        data: filtered.map((m: MetricEntry) => m.body_weight_kg as number)
      }]
    };
  }, [weightEntries, range]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Body Weight</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={28} color={colors.brandPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <MetricHero 
          label="Current Weight"
          currentValue={latestWeight}
          currentUnit={unit}
          targetValue="75.0" // Mock target for now
        />

        <View style={styles.chartSection}>
          <View style={styles.rangeSelector}>
            {(['1W', '1M', '3M', '6M', '1Y', 'ALL'] as const).map(r => (
              <TouchableOpacity 
                key={r} 
                onPress={() => setRange(r)}
                style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
              >
                <Text style={[styles.rangeText, range === r && styles.rangeTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {chartData ? (
            <SimpleLineChart
              data={chartData as any}
              width={width - 32}
              height={220}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyText}>Not enough data for this range</Text>
            </View>
          )}
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="BMI" value="23.4" subValue="Healthy" icon="fitness-outline" />
          <StatCard label="Change" value="-1.2 kg" subValue="Last 30 days" icon="trending-down-outline" color={colors.success} />
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>History</Text>
          {weightEntries.map((entry: MetricEntry, idx: number) => (
            <View key={entry.id || idx} style={styles.historyItem}>
              <View>
                <Text style={styles.historyDate}>{new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                {entry.notes && <Text style={styles.historyNotes}>{entry.notes}</Text>}
              </View>
              <Text style={styles.historyValue}>{entry.body_weight_kg?.toFixed(1)} {entry.body_weight_unit}</Text>
            </View>
          ))}
          {weightEntries.length === 0 && (
            <Text style={styles.emptyText}>No weight logs yet</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, subValue, icon, color }: any) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={18} color={color || colors.textMuted} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.statSubValue}>{subValue}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  addButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  scrollContent: { paddingBottom: 40 },
  chartSection: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  rangeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  rangeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  rangeBtnActive: {
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
  },
  rangeText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  rangeTextActive: {
    color: colors.brandPrimary,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    marginLeft: -16,
  },
  emptyChart: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statSubValue: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  historySection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  historyDate: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  historyNotes: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  historyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brandPrimary,
  },
});
