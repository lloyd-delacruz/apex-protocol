import React, { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BodyStackParamList } from '../../navigation/types';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useBodyAnalytics } from '../../hooks/useBodyAnalytics';
import { SegmentedControl } from '../../components/body/SegmentedControl';
import { ResultsView } from './components/ResultsView';
import { RecoveryView } from './components/RecoveryView';

export default function BodyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<BodyStackParamList>>();
  const [activeTab, setActiveTab] = useState('Results');
  const { data, loading, refresh } = useBodyAnalytics();
  
  const handleMusclePress = (muscleId: string, name: string) => {
    const analytic = data?.muscleAnalytics.find(m => m.name.toLowerCase() === name.toLowerCase());
    navigation.navigate('MuscleDetail', { muscleId, name, analytic });
  };

  const navigateTo = (route: keyof BodyStackParamList) => {
    navigation.navigate(route as any);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#1A1A26']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.inner} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Body</Text>
          <TouchableOpacity 
            style={styles.settingsBtn} 
            onPress={() => navigation.navigate('Targets')}
          >
            <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Segmented Control */}
        <SegmentedControl 
          options={['Results', 'Recovery']} 
          selectedOption={activeTab} 
          onOptionPress={setActiveTab} 
        />

        {/* Content */}
        <View style={styles.content}>
            {activeTab === 'Results' ? (
                <ResultsView data={data} onNavigate={navigateTo} loading={loading} />
            ) : (
                <RecoveryView data={data} onMusclePress={handleMusclePress} loading={loading} />
            )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0A0A0F' 
  },
  inner: { 
    flex: 1 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  settingsBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
});
