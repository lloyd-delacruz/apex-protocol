import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';

export default function BodyStatisticsScreen() {
  const navigation = useNavigation();

  const stats = [
    { label: 'Weight Change', value: '-1.2 kg', sub: 'Last 30 days', icon: 'trending-down-outline', color: colors.success },
    { label: 'Body Fat Change', value: '-0.5%', sub: 'Last 30 days', icon: 'trending-down-outline', color: colors.success },
    { label: 'Current BMI', value: '23.4', sub: 'Healthy Range', icon: 'fitness-outline' },
    { label: 'Muscle Mass', value: '58.4 kg', sub: '+0.2 kg since last log', icon: 'body-outline', color: colors.brandPrimary },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Body Statistics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {stats.map((stat, idx) => (
            <View key={idx} style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color || colors.textMuted} />
              </View>
              <View>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={[styles.statValue, stat.color ? { color: stat.color } : {}]}>{stat.value}</Text>
                <Text style={styles.statSub}>{stat.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.insightsSection}>
           <Text style={styles.sectionTitle}>Insights</Text>
           <View style={styles.insightCard}>
              <Ionicons name="sparkles-outline" size={20} color={colors.brandPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.insightTitle}>Weight Loss on Track</Text>
                <Text style={styles.insightDesc}>Your average weight loss over the last 4 weeks is 0.3kg/week, which is ideal for muscle preservation.</Text>
              </View>
           </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  scrollContent: { padding: 16 },
  grid: {
    gap: 12,
  },
  statCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  insightsSection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  insightCard: {
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.2)',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
