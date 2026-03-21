import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 48) / 2;

export default function BodyPhotosScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress Photos</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="camera" size={26} color={colors.brandPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="images-outline" size={40} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No Photos Shared</Text>
          <Text style={styles.emptySubtitle}>Track your physical transformation by taking regular progress photos.</Text>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.buttonText}>Take First Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.comparisonPromo}>
           <Text style={styles.promoTitle}>Comparison Tool</Text>
           <Text style={styles.promoDesc}>Select two photos to compare your results side-by-side.</Text>
           <TouchableOpacity style={styles.promoButton}>
             <Text style={styles.promoButtonText}>Create Comparison</Text>
           </TouchableOpacity>
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
  scrollContent: { padding: 16, flex: 1, justifyContent: 'center' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  comparisonPromo: {
    backgroundColor: colors.surface,
    marginTop: 40,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  promoDesc: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  promoButton: {
    borderWidth: 1,
    borderColor: colors.brandPrimary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  promoButtonText: {
    color: colors.brandPrimary,
    fontWeight: '600',
  },
});
