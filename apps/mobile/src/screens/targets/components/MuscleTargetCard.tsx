import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';

interface MuscleTargetCardProps {
  title: string;
  icon: string;
  currentSets: number;
  targetSets: number;
  onPress: () => void;
  accentColor?: string;
}

export const MuscleTargetCard: React.FC<MuscleTargetCardProps> = ({
  title,
  icon,
  currentSets,
  targetSets,
  onPress,
  accentColor = colors.brandPrimary,
}) => {
  const remaining = Math.max(0, targetSets - currentSets);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardInner}>
        <View style={styles.leftSection}>
          <View style={[styles.iconBox, { borderColor: 'rgba(255,255,255,0.08)' }]}>
            <Ionicons name="cube-outline" size={26} color={accentColor} style={{ opacity: 0.6 }} />
          </View>
          <View style={styles.info}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.progressText}>
              <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 15 }}>{currentSets}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}> / {targetSets} Sets</Text>
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <View style={styles.remainingInfo}>
            <Text style={styles.remainingValue}>{targetSets - currentSets}</Text>
            <Text style={styles.remainingLabel}>to go</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  info: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  remainingInfo: {
    alignItems: 'flex-end',
  },
  remainingValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  remainingLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: -2,
  },
});
