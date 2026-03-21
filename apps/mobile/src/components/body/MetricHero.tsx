import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface MetricHeroProps {
  label: string;
  currentValue: string;
  currentUnit?: string;
  targetValue?: string;
  targetUnit?: string;
  subtitle?: string;
}

export default function MetricHero({
  label,
  currentValue,
  currentUnit,
  targetValue,
  targetUnit,
  subtitle,
}: MetricHeroProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.headerLabel}>{label}</Text>
      
      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>CURRENT</Text>
          <View style={styles.valueRow}>
            <Text style={styles.currentValue}>{currentValue}</Text>
            {currentUnit && <Text style={styles.currentUnit}>{currentUnit}</Text>}
          </View>
        </View>

        {targetValue && (
          <View style={styles.divider} />
        )}

        {targetValue && (
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>TARGET</Text>
            <View style={styles.valueRow}>
              <Text style={styles.targetValue}>{targetValue}</Text>
              {targetUnit && <Text style={styles.targetUnit}>{targetUnit}</Text>}
            </View>
          </View>
        )}
      </View>

      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.brandPrimary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  statBlock: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  currentValue: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  currentUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
  },
  targetValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: -0.5,
  },
  targetUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 16,
    fontWeight: '500',
  },
});
