import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator 
} from 'react-native';
import { colors } from '../../../theme/colors';
import { BodyDiagram } from '../../../components/body/BodyDiagram';
import { BodyAnalyticsData } from '../../../hooks/useBodyAnalytics';

interface RecoveryViewProps {
  data: BodyAnalyticsData | null;
  onMusclePress: (id: string, name: string) => void;
  loading?: boolean;
}

export const RecoveryView: React.FC<RecoveryViewProps> = ({ data, onMusclePress, loading }) => {
  const fatiguedMuscles = data?.muscleAnalytics
    .filter(m => !m.isFresh)
    .map(m => m.name.toLowerCase()) || [];

  const freshCount = data?.muscleAnalytics.filter(m => m.isFresh).length || 0;
  
  // Find the most recent date across all muscles
  const lastDates = data?.muscleAnalytics
    .map(m => m.lastWorkedAt ? new Date(m.lastWorkedAt).getTime() : 0)
    .filter(t => t > 0) || [];
  
  const mostRecent = lastDates.length > 0 ? Math.max(...lastDates) : null;
  
  let daysSinceLastWorkout: string | number = '--';
  if (mostRecent) {
    const diffMs = new Date().getTime() - mostRecent;
    daysSinceLastWorkout = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
       {/* Top Metrics */}
       <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
             <Text style={styles.metricValue}>{daysSinceLastWorkout}</Text>
             <Text style={styles.metricLabel}>DAYS SINCE YOUR{"\n"}LAST WORKOUT</Text>
          </View>
          <View style={styles.metricItem}>
             <Text style={styles.metricValue}>{freshCount}</Text>
             <Text style={styles.metricLabel}>FRESH MUSCLE{"\n"}GROUPS</Text>
          </View>
       </View>

       {/* Muscle Diagram centerpiece */}
       <BodyDiagram 
         onMusclePress={onMusclePress} 
         fatiguedMuscles={fatiguedMuscles} 
       />

       {/* Recovery Summary Card */}
       <TouchableOpacity style={styles.recoveryCard} activeOpacity={0.9}>
          <Text style={styles.recoveryTitle}>Recovery</Text>
          <Text style={styles.recoveryText}>
            Apex tracks your training volume and calculates recovery time for each muscle group. 
            Highlighted areas indicate muscles currently in recovery.
          </Text>
          <View style={styles.recoveryFooter}>
             <TouchableOpacity>
                <Text style={styles.learnMore}>How it works</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.gotItBtn}>
                <Text style={styles.gotItText}>Got it</Text>
             </TouchableOpacity>
          </View>
       </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 20,
  },
  metricItem: { alignItems: 'center' },
  metricValue: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 14,
  },
  recoveryCard: {
    backgroundColor: '#1C1C28',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginTop: 20,
  },
  recoveryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  recoveryText: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 24,
  },
  recoveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  learnMore: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  gotItBtn: {},
  gotItText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.brandPrimary,
  },
});
