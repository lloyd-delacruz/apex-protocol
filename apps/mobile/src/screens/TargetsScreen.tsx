import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function TargetsScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#1A1A26']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.inner}>
        <Text style={styles.header}>Targets</Text>
        <View style={styles.centeredContent}>
          <View style={styles.iconBadge}>
            <Ionicons name="flag-outline" size={48} color={colors.brandPrimary} />
          </View>
          <Text style={styles.title}>Training Targets</Text>
          <Text style={styles.subtitle}>
            Set strength, hypertrophy, and performance goals to guide your training.
          </Text>
          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24 },
  header: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 80,
  },
  iconBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0,194,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(0,194,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  comingSoon: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,194,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,194,255,0.2)',
    marginTop: 8,
  },
  comingSoonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brandPrimary,
    letterSpacing: 1,
  },
});
