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
  const progressPercent = Math.min(100, (currentSets / targetSets) * 100);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardInner}>
        <View style={styles.leftSection}>
          <View style={[styles.iconBox, { borderColor: accentColor + '40', backgroundColor: accentColor + '10' }]}>
            <Ionicons name={icon as any} size={22} color={accentColor} />
          </View>
          <View style={styles.info}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.progressText}>
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{currentSets}</Text>
              <Text style={{ color: colors.textMuted }}> / {targetSets} Sets</Text>
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <View style={styles.remainingInfo}>
            <Text style={styles.remainingValue}>{remaining}</Text>
            <Text style={styles.remainingLabel}>to go</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </View>
      
      {/* Mini Progress Bar */}
      <View style={styles.progressTrack}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${progressPercent}%`, backgroundColor: accentColor }
          ]} 
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
  },
  info: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  progressText: {
    fontSize: 13,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  remainingInfo: {
    alignItems: 'flex-end',
  },
  remainingValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  remainingLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 12,
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
});
