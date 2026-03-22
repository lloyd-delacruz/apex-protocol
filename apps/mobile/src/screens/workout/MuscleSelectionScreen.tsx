import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { BodyDiagram } from '../../components/body/BodyDiagram';
import type { SessionStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<SessionStackParamList, 'MuscleSelection'>;

export default function MuscleSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();

  const handleMusclePress = (id: string, name: string) => {
    console.log('[MuscleSelectionScreen] Selected muscle:', name);
    navigation.navigate('ExerciseSelection', { muscleGroup: name });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.inner} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pick Muscles</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={styles.subtitle}>
            Tap a muscle group to find exercises targeting that area.
          </Text>

          <View style={styles.diagramContainer}>
            <BodyDiagram 
              onMusclePress={handleMusclePress} 
              fatiguedMuscles={[]} 
            />
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={colors.brandPrimary} />
            <Text style={styles.infoText}>
              Selecting a muscle will filter the library to show only relevant exercises.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 10,
    lineHeight: 22,
  },
  diagramContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 194, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 194, 255, 0.1)',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
