import React, { useState, useEffect, useCallback } from 'react';
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

const TARGETS_KEY = 'apex_targets_v1';

const DEFAULT_TARGETS: Target[] = [
  { id: 'squat',    category: 'strength', name: 'Back Squat',    icon: 'barbell-outline',   current: null, goal: null, unit: 'kg' },
  { id: 'bench',    category: 'strength', name: 'Bench Press',   icon: 'barbell-outline',   current: null, goal: null, unit: 'kg' },
  { id: 'deadlift', category: 'strength', name: 'Deadlift',      icon: 'barbell-outline',   current: null, goal: null, unit: 'kg' },
  { id: 'ohpress',  category: 'strength', name: 'OH Press',      icon: 'barbell-outline',   current: null, goal: null, unit: 'kg' },
  { id: 'weight',   category: 'body',     name: 'Body Weight',   icon: 'scale-outline',     current: null, goal: null, unit: 'kg' },
  { id: 'bodyfat',  category: 'body',     name: 'Body Fat',      icon: 'body-outline',      current: null, goal: null, unit: '%'  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TargetsScreen() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Target | null>(null);
  const [formCurrent, setFormCurrent] = useState('');
  const [formGoal, setFormGoal] = useState('');
  const [formUnit, setFormUnit] = useState('kg');

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(TARGETS_KEY);
      if (raw) {
        setTargets(JSON.parse(raw));
        setInitialized(true);
      }
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

  const strengthTargets = targets.filter(t => t.category === 'strength');
  const bodyTargets = targets.filter(t => t.category === 'body');
  const anySet = targets.some(t => t.goal != null);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#1A1A26']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.inner}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Targets</Text>
          {initialized && (
            <TouchableOpacity
              style={styles.resetAllBtn}
              onPress={() => {
                Alert.alert('Reset All', 'Reset all targets to default?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Reset', style: 'destructive', onPress: initDefaults },
                ]);
              }}
            >
              <Ionicons name="refresh-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {!initialized ? (
          /* ── Empty / First-run state ── */
          <View style={styles.emptyState}>
            <View style={styles.iconBadge}>
              <Ionicons name="flag-outline" size={48} color={colors.brandPrimary} />
            </View>
            <Text style={styles.emptyTitle}>Set Your Targets</Text>
            <Text style={styles.emptySubtitle}>
              Define strength and body targets to track your progress over time.
            </Text>
            <TouchableOpacity style={styles.initBtn} onPress={initDefaults} activeOpacity={0.85}>
              <Text style={styles.initBtnText}>Set Up Targets</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            {/* ── Progress Summary ── */}
            {anySet && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>TARGETS SET</Text>
                <Text style={styles.summaryValue}>
                  {targets.filter(t => t.goal != null).length} / {targets.length}
                </Text>
                <View style={styles.summaryTrack}>
                  <View
                    style={[
                      styles.summaryFill,
                      {
                        width: `${(targets.filter(t => t.goal != null).length / targets.length) * 100}%` as DimensionValue,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* ── Strength Targets ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Strength Targets</Text>
                <Text style={styles.sectionSub}>1-Rep Max Goals</Text>
              </View>
              {strengthTargets.map(t => (
                <TargetCard
                  key={t.id}
                  target={t}
                  onEdit={() => openEdit(t)}
                  onReset={() => resetTarget(t.id)}
                />
              ))}
            </View>

            {/* ── Body Targets ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Body Targets</Text>
                <Text style={styles.sectionSub}>Composition Goals</Text>
              </View>
              {bodyTargets.map(t => (
                <TargetCard
                  key={t.id}
                  target={t}
                  onEdit={() => openEdit(t)}
                  onReset={() => resetTarget(t.id)}
                />
              ))}
            </View>

            <Text style={styles.hintText}>Tap any target to set your current value and goal.</Text>
          </ScrollView>
        )}
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
              {/* Modal header */}
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
                {/* Unit toggle — strength only */}
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

                {/* Current */}
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

                {/* Goal */}
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

                {/* Context tip */}
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

// ─── Target Card ──────────────────────────────────────────────────────────────

function TargetCard({
  target,
  onEdit,
  onReset,
}: {
  target: Target;
  onEdit: () => void;
  onReset: () => void;
}) {
  const hasGoal = target.goal != null;
  const hasCurrent = target.current != null;
  const progress = hasGoal && hasCurrent ? Math.min(1, target.current! / target.goal!) : 0;
  const pct = Math.round(progress * 100);
  const done = progress >= 1;

  return (
    <TouchableOpacity
      style={styles.targetCard}
      onPress={onEdit}
      onLongPress={onReset}
      activeOpacity={0.75}
    >
      <View style={styles.targetCardInner}>
        {/* Icon */}
        <View style={[styles.targetIconWrap, done && styles.targetIconWrapDone]}>
          <Ionicons
            name={target.icon as any}
            size={20}
            color={done ? colors.success : colors.brandPrimary}
          />
        </View>

        {/* Info */}
        <View style={styles.targetInfo}>
          <Text style={styles.targetName}>{target.name}</Text>
          {hasGoal ? (
            <Text style={styles.targetMeta}>
              {hasCurrent ? `${target.current} ${target.unit}` : 'Not set'}
              {' → '}
              <Text style={styles.targetGoalText}>
                {target.goal} {target.unit}
              </Text>
            </Text>
          ) : (
            <Text style={styles.targetSetHint}>Tap to set goal</Text>
          )}
        </View>

        {/* Right */}
        <View style={styles.targetRight}>
          {hasGoal && (
            <Text style={[styles.targetPct, done && styles.targetPctDone]}>
              {done ? '✓' : `${pct}%`}
            </Text>
          )}
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </View>
      </View>

      {/* Progress bar */}
      {hasGoal && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${pct}%` as DimensionValue },
              done && styles.progressFillDone,
            ]}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    color: colors.textPrimary,
  },
  resetAllBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  scroll: { paddingBottom: 40 },

  // Summary card
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  summaryTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  summaryFill: {
    height: 4,
    backgroundColor: colors.brandPrimary,
    borderRadius: 2,
  },

  // Sections
  section: { marginBottom: 28 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
    color: colors.textPrimary,
  },
  sectionSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },

  // Target card
  targetCard: {
    backgroundColor: colors.surface,
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
    backgroundColor: 'rgba(0,194,255,0.10)',
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

  hintText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },

  // Empty state
  emptyState: {
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
  emptyTitle: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  initBtn: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 8,
  },
  initBtnText: { fontSize: 16, fontWeight: '700', color: colors.background },

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
