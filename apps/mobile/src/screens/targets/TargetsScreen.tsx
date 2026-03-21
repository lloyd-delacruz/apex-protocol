import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  DimensionValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../theme/colors';

// New Components
import { IntroCard } from './components/IntroCard';
import { WeeklySetHexagon } from './components/WeeklySetHexagon';
import { MuscleTargetCard } from './components/MuscleTargetCard';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Target {
  id: string;
  category: 'strength' | 'body';
  name: string;
  icon: string;
  current: number | null;
  goal: number | null;
  unit: string;
}

interface MuscleTarget {
  id: string;
  title: string;
  icon: string;
  current: number;
  target: number;
  color: string;
}

const TARGETS_KEY = 'apex_targets_v1';
const INTRO_HIDDEN_KEY = 'apex_targets_intro_hidden';

const DEFAULT_TARGETS: Target[] = [
  { id: 'squat',    category: 'strength', name: 'Back Squat',    icon: 'barbell-outline',   current: null, goal: null, unit: 'kg' },
  { id: 'bench',    category: 'strength', name: 'Bench Press',   icon: 'barbell-outline',   current: null, goal: null, unit: 'kg' },
  { id: 'deadlift', category: 'strength', name: 'Deadlift',      icon: 'barbell-outline',   current: null, goal: null, unit: 'kg' },
  { id: 'ohpress',  category: 'strength', name: 'OH Press',      icon: 'barbell-outline',   current: null, goal: null, unit: 'kg' },
  { id: 'weight',   category: 'body',     name: 'Body Weight',   icon: 'scale-outline',     current: null, goal: null, unit: 'kg' },
  { id: 'bodyfat',  category: 'body',     name: 'Body Fat',      icon: 'body-outline',      current: null, goal: null, unit: '%'  },
];

const MOCK_MUSCLE_TARGETS: MuscleTarget[] = [
  { id: 'push', title: 'Push Muscles', icon: 'flash-outline', current: 0, target: 50, color: colors.brandPrimary },
  { id: 'pull', title: 'Pull Muscles', icon: 'git-pull-request-outline', current: 0, target: 27, color: colors.accentSecondary },
  { id: 'legs', title: 'Leg Muscles', icon: 'bicycle-outline', current: 0, target: 45, color: colors.success },
];

const MOCK_HISTORY = [
  { date: 'Feb 21', percentage: 0 },
  { date: 'Feb 28', percentage: 0 },
  { date: 'Mar 7', percentage: 0 },
  { date: 'Mar 14', percentage: 0 },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TargetsScreen() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Target | null>(null);
  const [formCurrent, setFormCurrent] = useState('');
  const [formGoal, setFormGoal] = useState('');
  const [formUnit, setFormUnit] = useState('kg');

  const load = useCallback(async () => {
    try {
      const [rawTargets, introHidden] = await Promise.all([
        AsyncStorage.getItem(TARGETS_KEY),
        AsyncStorage.getItem(INTRO_HIDDEN_KEY),
      ]);
      
      if (rawTargets) {
        setTargets(JSON.parse(rawTargets));
      }
      if (introHidden === 'true') {
        setShowIntro(false);
      }
      setInitialized(true);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const persist = async (updated: Target[]) => {
    setTargets(updated);
    await AsyncStorage.setItem(TARGETS_KEY, JSON.stringify(updated));
  };

  const initDefaults = async () => {
    setInitialized(true);
    await persist(DEFAULT_TARGETS);
  };

  const handleDismissIntro = async () => {
    setShowIntro(false);
    await AsyncStorage.setItem(INTRO_HIDDEN_KEY, 'true');
  };

  const openEdit = (target: Target) => {
    setEditTarget(target);
    setFormCurrent(target.current != null ? String(target.current) : '');
    setFormGoal(target.goal != null ? String(target.goal) : '');
    setFormUnit(target.unit);
    setShowModal(true);
  };

  const saveTarget = async () => {
    if (!editTarget) return;
    const goal = formGoal ? parseFloat(formGoal) : null;
    const current = formCurrent ? parseFloat(formCurrent) : null;
    if (formGoal && isNaN(goal!)) {
      Alert.alert('Invalid input', 'Please enter a valid number for goal.');
      return;
    }
    const updated = targets.map(t =>
      t.id === editTarget.id
        ? { ...t, goal, current, unit: formUnit }
        : t
    );
    await persist(updated);
    setShowModal(false);
  };

  const resetTarget = (id: string) => {
    Alert.alert('Reset Target', 'Clear current and goal values for this target?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive',
        onPress: async () => {
          const updated = targets.map(t =>
            t.id === id ? { ...t, current: null, goal: null } : t
          );
          await persist(updated);
        },
      },
    ]);
  };

  // Date range (mock for now: current week)
  const dateRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(start)} – ${fmt(end)}`;
  }, []);


  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#12121A']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.inner} edges={['top']}>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ── Intro Card ── */}
          {showIntro && (
            <IntroCard
              onClose={handleDismissIntro}
              onLearnMore={() => Alert.alert('Set Targets', 'Volume targets help you optimize your training frequency and intensity for maximum muscle growth.')}
            />
          )}

          {/* ── Weekly Set Targets Header ── */}
          <View style={styles.mainHeader}>
            <Text style={styles.mainTitle}>Weekly Set Targets</Text>
            <Text style={styles.dateRange}>{dateRange}</Text>
          </View>

          {/* ── Main Visualization ── */}
          <View style={styles.vizSection}>
            <WeeklySetHexagon percentage={0} size={240} />
          </View>

          {/* ── Muscle Group Cards ── */}
          <View style={styles.muscleSection}>
            {MOCK_MUSCLE_TARGETS.map(m => (
              <MuscleTargetCard
                key={m.id}
                title={m.title}
                icon={m.icon}
                currentSets={m.current}
                targetSets={m.target}
                accentColor={m.color}
                onPress={() => Alert.alert(m.title, 'History and detailed breakdown coming soon.')}
              />
            ))}
          </View>

          {/* ── History Section ── */}
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>History</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyScroll}>
              {MOCK_HISTORY.map((h, i) => (
                <View key={i} style={styles.historyItem}>
                  <WeeklySetHexagon percentage={h.percentage} size={60} strokeWidth={4} />
                  <Text style={styles.historyDate}>{h.date}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* ── Edit Modal ── */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#0A0A0F', '#1A1A26']} style={StyleSheet.absoluteFill} />
          <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{editTarget?.name}</Text>
                <TouchableOpacity onPress={saveTarget}>
                  <Text style={styles.modalSave}>Save</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.modalScroll}
                keyboardShouldPersistTaps="handled"
              >
                {editTarget?.category === 'strength' && (
                  <View style={styles.unitRow}>
                    <Text style={styles.fieldLabel}>Unit</Text>
                    <View style={styles.unitToggle}>
                      {(['kg', 'lb'] as const).map(u => (
                        <TouchableOpacity
                          key={u}
                          style={[styles.unitBtn, formUnit === u && styles.unitBtnActive]}
                          onPress={() => setFormUnit(u)}
                        >
                          <Text style={[styles.unitBtnText, formUnit === u && styles.unitBtnTextActive]}>
                            {u}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.fieldBlock}>
                  <View style={styles.fieldHeaderRow}>
                    <Ionicons name="pulse-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.fieldLabel}>
                      Current ({editTarget?.category === 'strength' ? formUnit : editTarget?.unit})
                    </Text>
                  </View>
                  <TextInput
                    style={styles.inputBox}
                    value={formCurrent}
                    onChangeText={setFormCurrent}
                    placeholder="Your current value"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    // @ts-ignore
                    color={colors.textPrimary}
                  />
                </View>

                <View style={styles.fieldBlock}>
                  <View style={styles.fieldHeaderRow}>
                    <Ionicons name="flag-outline" size={16} color={colors.brandPrimary} />
                    <Text style={styles.fieldLabel}>
                      Goal ({editTarget?.category === 'strength' ? formUnit : editTarget?.unit})
                    </Text>
                  </View>
                  <TextInput
                    style={styles.inputBox}
                    value={formGoal}
                    onChangeText={setFormGoal}
                    placeholder="Your target value"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    // @ts-ignore
                    color={colors.textPrimary}
                  />
                </View>

                {editTarget?.category === 'strength' && (
                  <View style={styles.tipBox}>
                    <Ionicons name="information-circle-outline" size={16} color={colors.brandPrimary} />
                    <Text style={styles.tipText}>
                      Enter your estimated 1-rep max for the best tracking accuracy.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}


// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 20 },

  scroll: { paddingBottom: 60, paddingTop: 16 },

  // New Header
  mainHeader: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  dateRange: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },

  // Viz Section
  vizSection: {
    paddingVertical: 10,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Muscle Section
  muscleSection: {
    marginBottom: 32,
  },

  // History Section
  historySection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  historyScroll: {
    gap: 20,
    paddingRight: 20,
  },
  historyItem: {
    alignItems: 'center',
    gap: 8,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 24,
  },

  manageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  manageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Old Sections
  section: { marginBottom: 24 },
  sectionHeader: { marginBottom: 12 },
  sectionTitleSmall: {
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
    color: colors.textPrimary,
  },

  // Target card
  targetCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  targetCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  targetIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(0,194,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  targetIconWrapDone: { backgroundColor: 'rgba(16,185,129,0.12)' },
  targetInfo: { flex: 1 },
  targetName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  targetMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  targetGoalText: { color: colors.brandPrimary, fontWeight: '700' },
  targetSetHint: { fontSize: 12, color: colors.brandPrimary, marginTop: 2 },
  targetRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  targetPct: { fontSize: 14, fontWeight: '800', color: colors.brandPrimary },
  targetPctDone: { color: colors.success },
  progressTrack: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.brandPrimary,
    borderRadius: 2,
  },
  progressFillDone: { backgroundColor: colors.success },

  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyCardText: {
    fontSize: 14,
    color: colors.brandPrimary,
    fontWeight: '600',
  },

  // Modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCancel: { fontSize: 16, color: colors.textMuted, minWidth: 60 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  modalSave: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.brandPrimary,
    minWidth: 60,
    textAlign: 'right',
  },
  modalScroll: { padding: 20, paddingBottom: 60 },

  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 3,
  },
  unitBtn: { paddingHorizontal: 20, paddingVertical: 7, borderRadius: 8 },
  unitBtnActive: { backgroundColor: colors.brandPrimary },
  unitBtnText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  unitBtnTextActive: { color: colors.background },

  fieldBlock: { marginBottom: 16 },
  fieldHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  inputBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },

  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(0,194,255,0.06)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,194,255,0.15)',
    marginTop: 8,
  },
  tipText: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
});
