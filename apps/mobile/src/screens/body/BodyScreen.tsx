import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { api } from '../../services/api';
import type { MetricEntry } from '../../types/api';
import { useLatestMetrics, useMetricsHistory } from '../../hooks/useMetrics';

interface LogForm {
  body_weight: string;
  unit: 'kg' | 'lb';
  calories: string;
  protein: string;
  sleep: string;
  mood: string;
  training_performance: string;
  notes: string;
}

const DEFAULT_FORM: LogForm = {
  body_weight: '',
  unit: 'kg',
  calories: '',
  protein: '',
  sleep: '',
  mood: '',
  training_performance: '',
  notes: '',
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BodyScreen() {
  const { metrics: latest, loading: loadingLatest, refresh: refreshLatest } = useLatestMetrics();
  const { entries: metrics, loading: loadingHistory, refresh: refreshHistory } = useMetricsHistory(14);
  const loading = loadingLatest || loadingHistory;
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<LogForm>(DEFAULT_FORM);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshLatest(), refreshHistory()]);
    setRefreshing(false);
  }, [refreshLatest, refreshHistory]);

  const openLog = () => {
    if (latest) {
      setForm({
        body_weight: latest.body_weight_kg ? String(latest.body_weight_kg) : '',
        unit: (latest.body_weight_unit as 'kg' | 'lb') || 'kg',
        calories: latest.calories ? String(latest.calories) : '',
        protein: latest.protein_g ? String(latest.protein_g) : '',
        sleep: latest.sleep_hours ? String(latest.sleep_hours) : '',
        mood: latest.mood ? String(latest.mood) : '',
        training_performance: latest.training_performance ? String(latest.training_performance) : '',
        notes: latest.notes || '',
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setShowModal(true);
  };

  const saveMetrics = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        date: new Date().toISOString().split('T')[0],
      };
      if (form.body_weight) {
        payload.body_weight_kg = parseFloat(form.body_weight);
        payload.body_weight_unit = form.unit;
      }
      if (form.calories) payload.calories = parseInt(form.calories, 10);
      if (form.protein) payload.protein_g = parseInt(form.protein, 10);
      if (form.sleep) payload.sleep_hours = parseFloat(form.sleep);
      if (form.mood) payload.mood = parseInt(form.mood, 10);
      if (form.training_performance) payload.training_performance = parseInt(form.training_performance, 10);
      if (form.notes.trim()) payload.notes = form.notes.trim();

      const res = await api.metrics.log(payload as Parameters<typeof api.metrics.log>[0]);
      if (res.success) {
        setShowModal(false);
        refreshLatest();
        refreshHistory();
      } else {
        Alert.alert('Error', res.error || 'Failed to save metrics');
      }
    } catch {
      Alert.alert('Connection Error', 'Could not reach the server. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  // Weight trend — last 7 entries that have a weight value, oldest first
  const weightEntries = metrics
    .filter(m => m.body_weight_kg !== null)
    .slice(0, 7)
    .reverse();

  const maxW = weightEntries.length > 0 ? Math.max(...weightEntries.map(m => m.body_weight_kg!)) : 1;
  const minW = weightEntries.length > 0 ? Math.min(...weightEntries.map(m => m.body_weight_kg!)) : 0;
  const range = maxW - minW || 1;

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatWeight = (w: number | null, unit: string) => {
    if (w === null) return '—';
    if (unit === 'lb') return `${(w * 2.2046).toFixed(1)} lb`;
    return `${w.toFixed(1)} kg`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#0A0A0F', '#1A1A26']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#1A1A26']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.inner}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Body</Text>
          <TouchableOpacity style={styles.logBtn} onPress={openLog} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color={colors.background} />
            <Text style={styles.logBtnText}>Log Today</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brandPrimary}
            />
          }
        >
          {/* ── Weight Hero ── */}
          <View style={styles.weightHero}>
            <Text style={styles.weightLabel}>CURRENT WEIGHT</Text>
            <Text style={styles.weightValue}>
              {latest?.body_weight_kg
                ? formatWeight(latest.body_weight_kg, latest.body_weight_unit)
                : '—'}
            </Text>
            {latest?.date ? (
              <Text style={styles.weightDate}>Last logged {formatDate(latest.date)}</Text>
            ) : (
              <Text style={styles.weightDate}>No entries yet</Text>
            )}
          </View>

          {/* ── Daily Stats Grid ── */}
          <View style={styles.grid}>
            <StatCard icon="flame-outline" label="Calories" value={latest?.calories ? `${latest.calories}` : '—'} unit="kcal" />
            <StatCard icon="fish-outline" label="Protein" value={latest?.protein_g ? `${latest.protein_g}` : '—'} unit="g" />
            <StatCard icon="moon-outline" label="Sleep" value={latest?.sleep_hours ? `${latest.sleep_hours}` : '—'} unit="hrs" />
            <StatCard icon="happy-outline" label="Mood" value={latest?.mood ? `${latest.mood}` : '—'} unit="/10" />
          </View>

          {/* ── Weight Trend Chart ── */}
          {weightEntries.length > 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weight Trend</Text>
              <View style={styles.chartCard}>
                <View style={styles.chart}>
                  {weightEntries.map((m) => {
                    const barH = Math.max(8, ((m.body_weight_kg! - minW) / range) * 72 + 8);
                    return (
                      <View key={m.id} style={styles.barCol}>
                        <View style={[styles.bar, { height: barH }]} />
                        <Text style={styles.barLabel}>{formatDate(m.date)}</Text>
                      </View>
                    );
                  })}
                </View>
                <View style={styles.chartLegend}>
                  <Text style={styles.chartLegendText}>
                    Low: {formatWeight(minW, latest?.body_weight_unit || 'kg')}
                  </Text>
                  <Text style={styles.chartLegendText}>
                    High: {formatWeight(maxW, latest?.body_weight_unit || 'kg')}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ── History List ── */}
          {metrics.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>History</Text>
              {metrics.slice(0, 14).map((m) => (
                <View key={m.id} style={styles.histRow}>
                  <View style={styles.histLeft}>
                    <Text style={styles.histDate}>{formatDate(m.date)}</Text>
                    {m.notes ? (
                      <Text style={styles.histNotes} numberOfLines={1}>{m.notes}</Text>
                    ) : null}
                  </View>
                  <View style={styles.histRight}>
                    {m.body_weight_kg ? (
                      <Text style={styles.histWeight}>
                        {formatWeight(m.body_weight_kg, m.body_weight_unit)}
                      </Text>
                    ) : null}
                    <View style={styles.histPills}>
                      {m.calories ? <Text style={styles.pill}>{m.calories} kcal</Text> : null}
                      {m.sleep_hours ? <Text style={styles.pill}>{m.sleep_hours}h sleep</Text> : null}
                      {m.mood ? <Text style={styles.pill}>mood {m.mood}</Text> : null}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="body-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap "Log Today" to start tracking your body metrics.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ── Log Modal ── */}
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
                <Text style={styles.modalTitle}>Log Body Metrics</Text>
                <TouchableOpacity onPress={saveMetrics} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.brandPrimary} />
                  ) : (
                    <Text style={styles.modalSave}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.modalScroll}
                keyboardShouldPersistTaps="handled"
              >
                {/* Unit toggle */}
                <View style={styles.unitRow}>
                  <Text style={styles.fieldLabel}>Weight Unit</Text>
                  <View style={styles.unitToggle}>
                    {(['kg', 'lb'] as const).map(u => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.unitBtn, form.unit === u && styles.unitBtnActive]}
                        onPress={() => setForm(f => ({ ...f, unit: u }))}
                      >
                        <Text style={[styles.unitBtnText, form.unit === u && styles.unitBtnTextActive]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <ModalField
                  icon="scale-outline"
                  label={`Body Weight (${form.unit})`}
                  value={form.body_weight}
                  onChange={v => setForm(f => ({ ...f, body_weight: v }))}
                  placeholder="0.0"
                  keyboardType="decimal-pad"
                />
                <ModalField
                  icon="flame-outline"
                  label="Calories"
                  value={form.calories}
                  onChange={v => setForm(f => ({ ...f, calories: v }))}
                  placeholder="2000"
                  keyboardType="number-pad"
                />
                <ModalField
                  icon="fish-outline"
                  label="Protein (g)"
                  value={form.protein}
                  onChange={v => setForm(f => ({ ...f, protein: v }))}
                  placeholder="150"
                  keyboardType="number-pad"
                />
                <ModalField
                  icon="moon-outline"
                  label="Sleep (hours)"
                  value={form.sleep}
                  onChange={v => setForm(f => ({ ...f, sleep: v }))}
                  placeholder="8.0"
                  keyboardType="decimal-pad"
                />
                <ModalField
                  icon="happy-outline"
                  label="Mood (1–10)"
                  value={form.mood}
                  onChange={v => setForm(f => ({ ...f, mood: v }))}
                  placeholder="7"
                  keyboardType="number-pad"
                />
                <ModalField
                  icon="barbell-outline"
                  label="Training Performance (1–10)"
                  value={form.training_performance}
                  onChange={v => setForm(f => ({ ...f, training_performance: v }))}
                  placeholder="8"
                  keyboardType="number-pad"
                />

                {/* Notes */}
                <View style={styles.fieldBlock}>
                  <View style={styles.fieldHeaderRow}>
                    <Ionicons name="document-text-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.fieldLabel}>Notes</Text>
                  </View>
                  <TextInput
                    style={[styles.inputBox, styles.notesBox]}
                    value={form.notes}
                    onChangeText={v => setForm(f => ({ ...f, notes: v }))}
                    placeholder="Optional notes…"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    // @ts-ignore
                    color={colors.textPrimary}
                  />
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, unit,
}: { icon: string; label: string; value: string; unit: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={22} color={colors.brandPrimary} />
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        {value !== '—' && <Text style={styles.statUnit}>{unit}</Text>}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ModalField({
  icon, label, value, onChange, placeholder, keyboardType,
}: {
  icon: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboardType?: 'decimal-pad' | 'number-pad';
}) {
  return (
    <View style={styles.fieldBlock}>
      <View style={styles.fieldHeaderRow}>
        <Ionicons name={icon as any} size={16} color={colors.textMuted} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <TextInput
        style={styles.inputBox}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        // @ts-ignore
        color={colors.textPrimary}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  inner: { flex: 1, paddingHorizontal: 20 },

  // Header
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
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
  },
  logBtnText: { fontSize: 13, fontWeight: '700', color: colors.background },

  scroll: { paddingBottom: 40 },

  // Weight hero card
  weightHero: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weightLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textMuted,
    marginBottom: 8,
  },
  weightValue: {
    fontSize: 54,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -2,
    lineHeight: 58,
  },
  weightDate: { fontSize: 13, color: colors.textMuted, marginTop: 6 },

  // Stats grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 6 },
  statValue: { fontSize: 22, fontWeight: '900', color: colors.textPrimary },
  statUnit: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  statLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },

  // Section
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
    color: colors.textPrimary,
    marginBottom: 12,
  },

  // Chart
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 88,
    gap: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  bar: {
    width: '70%',
    backgroundColor: colors.brandPrimary,
    borderRadius: 4,
    opacity: 0.85,
  },
  barLabel: { fontSize: 9, color: colors.textMuted, textAlign: 'center' },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chartLegendText: { fontSize: 12, color: colors.textMuted },

  // History
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  histLeft: { flex: 1 },
  histDate: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  histNotes: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  histRight: { alignItems: 'flex-end', gap: 5 },
  histWeight: { fontSize: 16, fontWeight: '700', color: colors.brandPrimary },
  histPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'flex-end' },
  pill: {
    fontSize: 11,
    color: colors.textMuted,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 20,
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
  modalSave: { fontSize: 16, fontWeight: '700', color: colors.brandPrimary, minWidth: 60, textAlign: 'right' },
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
  unitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 8,
  },
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
  notesBox: { height: 88, textAlignVertical: 'top', paddingTop: 14 },
});
