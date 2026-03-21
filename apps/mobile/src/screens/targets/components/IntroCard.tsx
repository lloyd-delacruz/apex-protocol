import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';

interface IntroCardProps {
  onClose: () => void;
  onLearnMore: () => void;
}

export const IntroCard: React.FC<IntroCardProps> = ({ onClose, onLearnMore }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Introducing: Set Targets</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.description}>
        Maximize your gains by hitting the optimal volume per muscle!
      </Text>
      
      <Text style={styles.subtext}>
        Apex now generates weekly volume targets for you based on your goal, workout count and training time.
      </Text>
      
      <TouchableOpacity onPress={onLearnMore} style={styles.learnMore}>
        <Text style={styles.learnMoreText}>Learn More</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  description: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 12,
  },
  subtext: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 16,
  },
  learnMore: {
    alignSelf: 'flex-start',
  },
  learnMoreText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.brandPrimary,
  },
});
