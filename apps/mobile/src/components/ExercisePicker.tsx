import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SectionList,
  Modal,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import api from '../lib/api';
import type { ExerciseItem } from '../types/api';

const { width } = Dimensions.get('window');

interface ExercisePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: ExerciseItem) => void;
  title?: string;
}

// ─── Category list data matching the spec ────────────────────────────────────

const CATEGORY_ROWS = [
  { id: 'all',            label: 'All Exercises',                   icon: 'barbell-outline'   },
  { id: 'recent',         label: 'Recently Added to Apex',          icon: 'time-outline'      },
  { id: 'mine',           label: 'Added By Me',                     icon: 'person-outline'    },
  { id: 'by-muscle',      label: 'By Muscle Groups',                icon: 'body-outline'      },
  { id: 'by-equipment',   label: 'By Equipment',                    icon: 'construct-outline' },
  { id: 'weighted',       label: 'Weighted Exercises',              icon: 'barbell-outline'   },
  { id: 'bodyweight',     label: 'Bodyweight Only',                 icon: 'hand-left-outline' },
  { id: 'bw-equipment',   label: 'Bodyweight with Equipment',       icon: 'fitness-outline'   },
  { id: 'cardio',         label: 'Cardio',                          icon: 'heart-outline'     },
  { id: 'stretch',        label: 'Stretching and Mobility',         icon: 'walk-outline'      },
];

const MUSCLE_GROUPS = [
  { name: 'Chest',      pct: '100%' },
  { name: 'Back',       pct: '95%'  },
  { name: 'Shoulders',  pct: '85%'  },
  { name: 'Biceps',     pct: '80%'  },
  { name: 'Triceps',    pct: '80%'  },
  { name: 'Legs',       pct: '90%'  },
  { name: 'Glutes',     pct: '75%'  },
  { name: 'Core',       pct: '70%'  },
  { name: 'Forearms',   pct: '60%'  },
  { name: 'Calves',     pct: '65%'  },
];

type TabId = 'all' | 'by-muscle' | 'categories';

// ─── Group exercises alphabetically ──────────────────────────────────────────

function groupAlphabetically(exercises: ExerciseItem[]) {
  const groups: Record<string, ExerciseItem[]> = {};
  for (const ex of exercises) {
    const firstChar = ex.name.charAt(0).toUpperCase();
    const key = /[A-Z]/.test(firstChar) ? firstChar : '#';
    if (!groups[key]) groups[key] = [];
    groups[key].push(ex);
  }
  return Object.keys(groups)
    .sort((a, b) => {
      if (a === '#') return -1;
      if (b === '#') return 1;
      return a.localeCompare(b);
    })
    .map(key => ({ title: key, data: groups[key] }));
}

// ──────────────────────────────────────────────────────────────────────────────

export default function ExercisePicker({ visible, onClose, onSelect, title = 'Categories' }: ExercisePickerProps) {
  const [activeTab, setActiveTab] = useState<TabId>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());

  const fetchExercises = useCallback(async (params?: { category?: string; muscle?: string; query?: string }) => {
    setLoading(true);
    try {
      let endpoint = '/api/exercises';
      if (params?.query) {
        endpoint = `/api/exercises/search?q=${encodeURIComponent(params.query)}`;
      } else if (params?.muscle) {
        endpoint = `/api/exercises?bodyPart=${encodeURIComponent(params.muscle)}`;
      } else if (params?.category === 'cardio') {
        endpoint = `/api/exercises?category=cardio`;
      } else if (params?.category === 'bodyweight') {
        endpoint = `/api/exercises?equipment=body%20weight`;
      } else {
        endpoint = `/api/exercises`;
      }
      const res = await api.request<{ exercises: ExerciseItem[] }>('GET', endpoint);
      if (res.success) setExercises(res.data?.exercises || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (searchQuery) {
      const t = setTimeout(() => fetchExercises({ query: searchQuery }), 300);
      return () => clearTimeout(t);
    }
    if (activeTab === 'all') fetchExercises();
    else if (activeTab === 'by-muscle' && selectedMuscle) fetchExercises({ muscle: selectedMuscle });
    else if (activeTab === 'categories' && selectedCategoryId) fetchExercises({ category: selectedCategoryId });
    else setExercises([]);
  }, [visible, searchQuery, activeTab, selectedMuscle, selectedCategoryId, fetchExercises]);

  const reset = () => {
    setSearchQuery('');
    setSelectedCategoryId(null);
    setSelectedMuscle(null);
    setSelectedExercises(new Set());
    setActiveTab('categories');
    setExercises([]);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleBack = () => {
    if (selectedMuscle) { setSelectedMuscle(null); setExercises([]); return; }
    if (selectedCategoryId) { setSelectedCategoryId(null); setExercises([]); return; }
    handleClose();
  };

  const toggleSelect = (ex: ExerciseItem) => {
    setSelectedExercises(prev => {
      const next = new Set(prev);
      if (next.has(ex.id)) next.delete(ex.id);
      else next.add(ex.id);
      return next;
    });
  };

  const addSelected = () => {
    exercises.filter(e => selectedExercises.has(e.id)).forEach(e => onSelect(e));
    handleClose();
  };

  // Alphabetical sections for "All" tab
  const alphaSections = useMemo(() => groupAlphabetically(exercises), [exercises]);

  // What's showing in the list?
  const showList = !!(searchQuery || activeTab === 'all' ||
    (activeTab === 'by-muscle' && selectedMuscle) ||
    (activeTab === 'categories' && selectedCategoryId));

  const useAlphaGrouping = !searchQuery && activeTab === 'all';

  const headerTitle = selectedMuscle ? selectedMuscle :
    selectedCategoryId ? CATEGORY_ROWS.find(c => c.id === selectedCategoryId)?.label ?? title :
    title;

  // Render a single exercise row (used in both FlatList and SectionList)
  const renderExerciseItem = (item: ExerciseItem) => {
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
        {/* Checkbox on right */}
        <View style={[s.checkbox, selected && s.checkboxSelected]}>
          {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.sheet}>

          {/* ── Header ──────────────────────────────── */}
          <View style={s.header}>
            <TouchableOpacity onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons
                name={selectedCategoryId || selectedMuscle ? 'chevron-back' : 'options-outline'}
                size={24}
                color={colors.brandPrimary}
              />
            </TouchableOpacity>
            <Text style={s.headerTitle}>{headerTitle}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.brandPrimary} />
            </TouchableOpacity>
          </View>

          {/* ── Search ──────────────────────────────── */}
          <View style={s.searchContainer}>
            <View style={s.searchBar}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={s.searchInput}
                placeholder="Search"
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── Tabs ────────────────────────────────── */}
          {!selectedCategoryId && !selectedMuscle && !searchQuery && (
            <View style={s.tabs}>
              {([
                { id: 'all' as TabId, label: 'All' },
                { id: 'by-muscle' as TabId, label: 'By Muscle' },
                { id: 'categories' as TabId, label: 'Categories' },
              ]).map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  style={[s.tab, activeTab === tab.id && s.tabActive]}
                  onPress={() => { setActiveTab(tab.id); setSelectedCategoryId(null); setSelectedMuscle(null); }}
                >
                  <Text style={[s.tabText, activeTab === tab.id && s.tabTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── Content ─────────────────────────────── */}
          {loading ? (
            <View style={s.center}>
              <ActivityIndicator size="large" color={colors.brandPrimary} />
            </View>
          ) : showList ? (
            useAlphaGrouping ? (
              // Alphabetically grouped SectionList for "All" tab
              <SectionList
                sections={alphaSections}
                keyExtractor={item => item.id}
                contentContainerStyle={s.listContent}
                renderSectionHeader={({ section }) => (
                  <View style={s.sectionHeader}>
                    <Text style={s.sectionHeaderText}>{section.title}</Text>
                  </View>
                )}
                renderItem={({ item }) => renderExerciseItem(item)}
                ListEmptyComponent={
                  <View style={s.center}><Text style={s.emptyText}>No exercises found</Text></View>
                }
                stickySectionHeadersEnabled={false}
              />
            ) : (
              // Flat list for search results or category/muscle drill-down
              <FlatList
                data={exercises}
                keyExtractor={item => item.id}
                contentContainerStyle={s.listContent}
                renderItem={({ item }) => renderExerciseItem(item)}
                ListEmptyComponent={
                  <View style={s.center}><Text style={s.emptyText}>No exercises found</Text></View>
                }
              />
            )
          ) : activeTab === 'by-muscle' && !selectedMuscle ? (
            // Muscle group list with percentage labels
            <FlatList
              data={MUSCLE_GROUPS}
              keyExtractor={item => item.name}
              contentContainerStyle={s.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.muscleRow} onPress={() => setSelectedMuscle(item.name)}>
                  <Ionicons name="body-outline" size={22} color={colors.textMuted} />
                  <Text style={s.categoryLabel}>{item.name}</Text>
                  <Text style={s.musclePercent}>{item.pct}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            />
          ) : activeTab === 'categories' && !selectedCategoryId ? (
            // Categories list
            <FlatList
              data={CATEGORY_ROWS}
              keyExtractor={item => item.id}
              contentContainerStyle={s.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.categoryRow} onPress={() => setSelectedCategoryId(item.id)}>
                  <Ionicons name={item.icon as any} size={22} color={colors.textMuted} />
                  <Text style={s.categoryLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            />
          ) : null}

          {/* ── Bottom bar ──────────────────────────── */}
          <View style={s.bottomBar}>
            <TouchableOpacity style={s.groupBtn}>
              <Text style={s.groupBtnText}>Group as...</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.addBtn, selectedExercises.size === 0 && s.addBtnDisabled]}
              onPress={addSelected}
              disabled={selectedExercises.size === 0}
            >
              <Text style={s.addBtnText}>
                {selectedExercises.size > 0
                  ? `Add ${selectedExercises.size} Exercise${selectedExercises.size > 1 ? 's' : ''}`
                  : 'Add Exercises'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#111118',
    height: '93%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 16, marginLeft: 8 },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 8,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.textPrimary, fontWeight: '700' },
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },

  // Section header for alphabetical groups
  sectionHeader: {
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginTop: 8,
    marginBottom: 2,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },

  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 16,
  },
  categoryLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.textPrimary },

  // Muscle row with percentage
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 16,
  },
  musclePercent: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    marginRight: 4,
  },

  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 14,
  },
  exerciseThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  exerciseThumbImg: { width: '100%', height: '100%' },
  exerciseName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  exerciseSub: { fontSize: 13, color: colors.textMuted, marginTop: 3 },

  // Checkbox (outlined square, filled with checkmark when selected)
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
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 36,
    backgroundColor: '#111118',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  groupBtn: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  groupBtnText: { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
  addBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
