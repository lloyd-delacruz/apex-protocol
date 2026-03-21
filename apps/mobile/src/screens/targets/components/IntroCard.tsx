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
          <Ionicons name="close" size={22} color={colors.danger} />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.description}>
        Maximize your gains by hitting the optimal volume per muscle!
      </Text>
      
      <Text style={styles.subtext}>
        Apex Protocol now generates weekly volume targets for you based on your goal, workout count and training time.
      </Text>
      
      <TouchableOpacity onPress={onLearnMore} style={styles.learnMore}>
        <Text style={styles.learnMoreText}>Learn More</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  closeBtn: {
    padding: 4,
  },
  description: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: 16,
    fontWeight: '600',
  },
  subtext: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 24,
  },
  learnMore: {
    alignSelf: 'flex-start',
  },
  learnMoreText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.brandPrimary,
    textDecorationLine: 'underline',
  },
});
