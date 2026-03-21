import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import api from '../../lib/api';
import type { ExerciseItem } from '../../types/api';
import type { SessionStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<SessionStackParamList, 'ExerciseSelection'>;

export default function ExerciseSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());

  const fetchExercises = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const endpoint = query 
        ? `/api/exercises/search?q=${encodeURIComponent(query)}` 
        : `/api/exercises`;
      const res = await api.request<{ exercises: ExerciseItem[] }>('GET', endpoint);
      if (res.success) setExercises(res.data?.exercises || []);
    } catch { 
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchExercises(searchQuery);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, fetchExercises]);

  const toggleSelect = (ex: ExerciseItem) => {
    setSelectedExercises(prev => {
      const next = new Set(prev);
      if (next.has(ex.id)) next.delete(ex.id);
      else next.add(ex.id);
      return next;
    });
  };

  const handleAdd = () => {
    // In a real implementation, we would pass these back via params or a global state/context
    // For now, just navigate back
    navigation.goBack();
  };

  const renderExerciseItem = ({ item }: { item: ExerciseItem }) => {
    const selected = selectedExercises.has(item.id);
    return (
      <TouchableOpacity style={s.exerciseRow} onPress={() => toggleSelect(item)}>
        <View style={s.exerciseThumb}>
          {item.mediaUrl ? (
            <Image source={{ uri: item.mediaUrl }} style={s.exerciseThumbImg} resizeMode="cover" />
          ) : (
            <Ionicons name="barbell-outline" size={22} color={colors.textMuted} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.exerciseName}>{item.name}</Text>
          <Text style={s.exerciseSub}>{item.bodyPart || 'General'}{item.muscleGroup ? ` · ${item.muscleGroup}` : ''}</Text>
        </View>
        <View style={[s.checkbox, selected && s.checkboxSelected]}>
          {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={24} color={colors.brandPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Select Exercise</Text>
          <View style={{ width: 24 }} />{/* Spacer */}
        </View>

        {/* Search */}
        <View style={s.searchContainer}>
          <View style={s.searchBar}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={s.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* List */}
        {loading && exercises.length === 0 ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.brandPrimary} />
          </View>
        ) : (
          <FlatList
            data={exercises}
            keyExtractor={item => item.id}
            contentContainerStyle={s.listContent}
            renderItem={renderExerciseItem}
            ListEmptyComponent={
              <View style={s.center}>
                <Text style={s.emptyText}>No exercises found</Text>
              </View>
            }
          />
        )}

        {/* Bottom Bar */}
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.addBtn, selectedExercises.size === 0 && s.addBtnDisabled]}
            onPress={handleAdd}
            disabled={selectedExercises.size === 0}
          >
            <Text style={s.addBtnText}>
              {selectedExercises.size > 0
                ? `Add ${selectedExercises.size} Exercise${selectedExercises.size > 1 ? 's' : ''}`
                : 'Add Exercises'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  searchContainer: { paddingHorizontal: 20, paddingBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 16, marginLeft: 8 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 14,
  },
  exerciseThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  exerciseThumbImg: { width: '100%', height: '100%' },
  exerciseName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  exerciseSub: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { color: colors.textMuted, fontSize: 16 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
