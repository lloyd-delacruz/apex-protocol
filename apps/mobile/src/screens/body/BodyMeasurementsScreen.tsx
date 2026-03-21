import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';

export default function BodyMeasurementsScreen() {
  const navigation = useNavigation();

  const measurementTypes = [
    { label: 'Chest', value: '--', unit: 'cm', icon: 'resize-outline' },
    { label: 'Waist', value: '--', unit: 'cm', icon: 'body-outline' },
    { label: 'Hips', value: '--', unit: 'cm', icon: 'body-outline' },
    { label: 'Biceps', value: '--', unit: 'cm', icon: 'barbell-outline' },
    { label: 'Thighs', value: '--', unit: 'cm', icon: 'body-outline' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Measurements</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={28} color={colors.brandPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.brandPrimary} />
          <Text style={styles.infoText}>Track your circumference measurements to see changes in body shape over time.</Text>
        </View>

        <View style={styles.listContainer}>
          {measurementTypes.map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.listItem}>
              <View style={styles.listLeft}>
                <View style={styles.iconContainer}>
                   <Ionicons name={item.icon as any} size={20} color={colors.textMuted} />
                </View>
                <Text style={styles.listLabel}>{item.label}</Text>
              </View>
              <View style={styles.listRight}>
                <Text style={styles.listValue}>{item.value} {item.unit}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
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
  addButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  scrollContent: { paddingBottom: 40 },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    gap: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  listRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listValue: {
    fontSize: 15,
    color: colors.textMuted,
  },
});
