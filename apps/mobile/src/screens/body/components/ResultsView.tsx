import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { BodyAnalyticsData } from '../../../hooks/useBodyAnalytics';

const { width } = Dimensions.get('window');

interface ResultsViewProps {
  data: BodyAnalyticsData | null;
  onNavigate: (route: any) => void;
  loading?: boolean;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ data, onNavigate, loading }) => {
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  // Find latest composition stats
  const latestMetric = data?.recentMetrics?.[0];
  const bodyWeight = latestMetric?.body_weight_kg ? Math.round(latestMetric.body_weight_kg * 2.20462) : '--';
  const bodyFat = latestMetric?.body_fat_pct ? latestMetric.body_fat_pct : '--';

  // Format focus exercises (limit to first 3 from strengthTrends or similar)
  const focusExercises = data?.strengthTrends || [];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      {/* Overall Strength Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Overall Strength</Text>
          <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
        </View>
        <TouchableOpacity style={styles.strengthCard} activeOpacity={0.9}>
            <View style={styles.strengthScoreContainer}>
                <Text style={styles.strengthScoreValue}>{data?.recoveryScore || '--'}</Text>
                <Text style={styles.strengthScoreLabel}>APEX SCORE</Text>
            </View>
            <View style={styles.strengthBars}>
                {[1,2,3,4,5,6,7,8,9,10].map(i => {
                    const threshold = (data?.recoveryScore || 0) / 10;
                    const isActive = i <= threshold;
                    return (
                        <View 
                          key={i} 
                          style={[styles.strengthBar, isActive && styles.strengthBarActive]} 
                        />
                    );
                })}
            </View>
            <Text style={styles.strengthTrendText}>
                {data?.adherence?.streak || 0}-day streak! Keep it up.
            </Text>
        </TouchableOpacity>
      </View>

      {/* Focus Exercises */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Focus Exercises</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {focusExercises.length > 0 ? focusExercises.map((ex, idx) => (
                <FocusExerciseCard 
                  key={idx}
                  name={ex.exercise} 
                  metric="Est. 1 Rep Max" 
                  value={Math.round(ex.currentWeight * 2.20462)} 
                  unit="lb" 
                  change={ex.weightChangePct}
                />
            )) : (
              <View style={styles.emptyFocus}>
                <Text style={styles.emptyText}>Add compound lifts to track focus progress</Text>
              </View>
            )}
        </ScrollView>
      </View>

      {/* Body Composition */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Body Composition</Text>
        <TouchableOpacity style={styles.healthSyncCard} activeOpacity={0.8}>
            <View style={styles.healthSyncHeader}>
                <Text style={styles.healthSyncTitle}>Use Apple Health?</Text>
                <Ionicons name="close" size={18} color={colors.textMuted} />
            </View>
            <Text style={styles.healthSyncText}>
                Sync with Apple Health to pull in body weight and fat percentage automatically.
            </Text>
            <TouchableOpacity style={styles.syncBtn}>
                <Text style={styles.syncBtnText}>Sync with Apple Health</Text>
            </TouchableOpacity>
        </TouchableOpacity>

        <View style={styles.compositionGrid}>
            <CompCard 
              title="Body Fat Percentage" 
              value={bodyFat} 
              unit="%" 
              onPress={() => onNavigate('BodyFatDetail')} 
            />
            <CompCard 
              title="Weight" 
              value={bodyWeight} 
              unit="lb" 
              onPress={() => onNavigate('BodyWeightDetail')} 
            />
        </View>
        
        <View style={styles.compositionGrid}>
            <StatCard 
              title="All Composition Stats" 
              icon="body-outline" 
              count={data?.recentMetrics?.length || 0} 
              onPress={() => onNavigate('BodyStatistics')} 
            />
            <StatCard 
              title="All Measurement Stats" 
              icon="calculator-outline" 
              count="--" 
              onPress={() => onNavigate('BodyMeasurements')} 
            />
        </View>
      </View>
    </ScrollView>
  );
};

function FocusExerciseCard({ name, metric, value, unit, change }: any) {
    const isPositive = change > 0;
    return (
        <View style={styles.focusCard}>
            <View style={styles.focusHeader}>
              <Text style={styles.focusLabel}>{name.toUpperCase()}</Text>
              <View style={[styles.changeTag, isPositive ? styles.changePos : styles.changeNeg]}>
                <Text style={styles.changeText}>{isPositive ? '+' : ''}{change}%</Text>
              </View>
            </View>
            <Text style={styles.focusMetric}>{metric}</Text>
            <View style={styles.focusValueRow}>
                <Text style={styles.focusValue}>{value}</Text>
                <Text style={styles.focusUnit}>{unit}</Text>
            </View>
            {/* Simple Grid/Chart Mock */}
            <View style={styles.miniChart}>
                {[1,2,3,4,5].map(i => (
                    <View key={i} style={styles.miniChartLine} />
                ))}
            </View>
        </View>
    );
}

function CompCard({ title, value, unit, onPress }: any) {
    return (
        <TouchableOpacity style={[styles.compCard, { flex: 1 }]} onPress={onPress}>
            <View style={styles.compHeader}>
                <Text style={styles.compTitle}>{title}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </View>
            <View style={styles.focusValueRow}>
                <Text style={styles.compValue}>{value}</Text>
                <Text style={styles.compUnit}>{unit}</Text>
            </View>
        </TouchableOpacity>
    );
}

function StatCard({ title, icon, count, onPress }: any) {
    return (
        <TouchableOpacity style={[styles.compCard, { flex: 1, paddingVertical: 12 }]} onPress={onPress}>
            <View style={styles.statInner}>
                <View style={styles.statIconBox}>
                    <Ionicons name={icon} size={16} color={colors.brandPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.statTitle}>{title}</Text>
                </View>
                <Text style={styles.statCount}>{count}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0F' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  strengthCard: {
    backgroundColor: '#1C1C28',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  strengthScoreContainer: { alignItems: 'center', marginBottom: 16 },
  strengthScoreValue: { fontSize: 48, fontWeight: '900', color: colors.textPrimary, fontStyle: 'italic' },
  strengthScoreLabel: { fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 2 },
  strengthBars: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  strengthBar: {
    width: 22,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    transform: [{ skewX: '-15deg' }],
  },
  strengthBarActive: {
    backgroundColor: colors.brandPrimary,
    shadowColor: colors.brandPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  strengthTrendText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  carousel: { gap: 12, paddingRight: 20 },
  focusCard: {
    width: width * 0.75,
    backgroundColor: '#1C1C28',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  focusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  focusLabel: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 1 },
  changeTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  changePos: { backgroundColor: 'rgba(52, 199, 89, 0.1)' },
  changeNeg: { backgroundColor: 'rgba(255, 59, 48, 0.1)' },
  changeText: { fontSize: 11, fontWeight: '700', color: '#34C759' },
  focusMetric: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: 4 },
  focusValueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 12, gap: 4 },
  focusValue: { fontSize: 36, fontWeight: '900', color: colors.textPrimary },
  focusUnit: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  miniChart: { marginTop: 20, gap: 10 },
  miniChartLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', width: '100%' },
  
  emptyFocus: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.textMuted, textAlign: 'center' },

  healthSyncCard: {
    backgroundColor: '#1C1C28',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  healthSyncHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  healthSyncTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  healthSyncText: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: 20 },
  syncBtn: {
    backgroundColor: colors.textPrimary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  syncBtnText: { color: colors.background, fontWeight: '800', fontSize: 15 },

  compositionGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  compCard: {
    backgroundColor: '#1C1C28',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  compHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  compTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  compValue: { fontSize: 28, fontWeight: '900', color: colors.textPrimary },
  compUnit: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  
  statInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(0,194,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  statTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  statCount: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
});
