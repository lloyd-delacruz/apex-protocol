import React, { useState, useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BodyStackParamList } from '../../navigation/types';
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
import { useLatestMetrics, useMetricsHistory } from '../../hooks/useMetrics';
import ScreenErrorState from '../../components/ScreenErrorState';
import BodyDashboardCard from '../../components/body/BodyDashboardCard';

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

export default function BodyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<BodyStackParamList>>();
  const { metrics: latest, loading: loadingLatest, error: errorLatest, refresh: refreshLatest } = useLatestMetrics();
  const { entries: metrics, loading: loadingHistory, error: errorHistory, refresh: refreshHistory } = useMetricsHistory(7);
  
  const loading = loadingLatest || loadingHistory;
  const error = errorLatest ?? errorHistory ?? null;
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
      Alert.alert('Connection Error', 'Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  const weightTrend = useMemo(() => {
    if (metrics.length < 2) return undefined;
    const latestW = metrics[0].body_weight_kg;
    const prevW = metrics[1].body_weight_kg;
    if (latestW === null || prevW === null) return undefined;
    const diff = latestW - prevW;
    const absDiff = Math.abs(diff).toFixed(1);
    const unit = metrics[0].body_weight_unit || 'kg';
    return {
      value: `${diff > 0 ? '+' : diff < 0 ? '-' : ''}${absDiff} ${unit}`,
      isPositive: diff <= 0, // In weight loss context, down is positive (green)
    };
  }, [metrics]);

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#0A0A0F', '#1A1A26']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#0A0A0F', '#1A1A26']} style={StyleSheet.absoluteFill} />
        <ScreenErrorState message={error} onRetry={onRefresh} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#1A1A26']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Body</Text>
          <TouchableOpacity style={styles.logBtn} onPress={openLog} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color={colors.background} />
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
          {/* Main Dashboard Cards */}
          <BodyDashboardCard
            title="Body Weight"
            icon="speedometer-outline"
            value={latest?.body_weight_kg ? `${latest.body_weight_kg}` : '—'}
            unit={latest?.body_weight_unit || 'kg'}
            subtitle={latest?.date ? `Last logged ${formatDate(latest.date)}` : 'No data yet'}
            trend={weightTrend}
            onPress={() => navigation.navigate('BodyWeightDetail')}
          />

          <BodyDashboardCard
            title="Body Fat %"
            icon="fitness-outline"
            value="—"
            unit="%"
            subtitle="Analyze your lean mass"
            onPress={() => navigation.navigate('BodyFatDetail')}
          />

          <BodyDashboardCard
            title="Measurements"
            icon="body-outline"
            value="—"
            unit="items"
            subtitle="Track dimensions of 13 parts"
            onPress={() => navigation.navigate('BodyMeasurements')}
          />

          <BodyDashboardCard
            title="Body Photos"
            icon="camera-outline"
            value="—"
            unit="photos"
            subtitle="Front, Back, Side"
            onPress={() => navigation.navigate('BodyPhotos')}
          />

          <BodyDashboardCard
            title="Body Statistics"
            icon="bar-chart-outline"
            value="View"
            subtitle="BMI, BMR, TDEE, Lean Mass"
            onPress={() => navigation.navigate('BodyStatistics')}
          />

          {/* Health Metrics Grid (Legacy Support) */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Health</Text>
          </View>
          <View style={styles.statsGrid}>
            <StatSmallCard label="Calories" value={latest?.calories ? `${latest.calories}` : '—'} unit="kcal" icon="flame-outline" />
            <StatSmallCard label="Protein" value={latest?.protein_g ? `${latest.protein_g}` : '—'} unit="g" icon="fish-outline" />
            <StatSmallCard label="Sleep" value={latest?.sleep_hours ? `${latest.sleep_hours}` : '—'} unit="hrs" icon="moon-outline" />
            <StatSmallCard label="Mood" value={latest?.mood ? `${latest.mood}` : '—'} unit="/10" icon="happy-outline" />
          </View>

          <TouchableOpacity style={styles.targetsBtn} onPress={() => navigation.navigate('Targets')}>
            <Ionicons name="flag-outline" size={18} color={colors.brandPrimary} />
            <Text style={styles.targetsBtnText}>Manage Goals & Targets</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Log Modal (Existing Logic Preserved) */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#0A0A0F', '#1A1A26']} style={StyleSheet.absoluteFill} />
          <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
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

              <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
                <View style={styles.unitRow}>
                  <Text style={styles.fieldLabel}>Weight Unit</Text>
                  <View style={styles.unitToggle}>
                    {(['kg', 'lb'] as const).map(u => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.unitBtn, form.unit === u && styles.unitBtnActive]}
                        onPress={() => setForm(f => ({ ...f, unit: u }))}
                      >
                        <Text style={[styles.unitBtnText, form.unit === u && styles.unitBtnTextActive]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <ModalField icon="scale-outline" label={`Body Weight (${form.unit})`} value={form.body_weight} onChange={(v: string) => setForm(f => ({ ...f, body_weight: v }))} placeholder="0.0" keyboardType="decimal-pad" />
                <ModalField icon="flame-outline" label="Calories" value={form.calories} onChange={(v: string) => setForm(f => ({ ...f, calories: v }))} placeholder="2000" keyboardType="number-pad" />
                <ModalField icon="fish-outline" label="Protein (g)" value={form.protein} onChange={(v: string) => setForm(f => ({ ...f, protein: v }))} placeholder="150" keyboardType="number-pad" />
                <ModalField icon="moon-outline" label="Sleep (hours)" value={form.sleep} onChange={(v: string) => setForm(f => ({ ...f, sleep: v }))} placeholder="8.0" keyboardType="decimal-pad" />
                <ModalField icon="happy-outline" label="Mood (1–10)" value={form.mood} onChange={(v: string) => setForm(f => ({ ...f, mood: v }))} placeholder="7" keyboardType="number-pad" />
                
                <View style={styles.fieldBlock}>
                  <View style={styles.fieldHeaderRow}>
                    <Ionicons name="document-text-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.fieldLabel}>Notes</Text>
                  </View>
                  <TextInput
                    style={[styles.inputBox, styles.notesBox, { color: colors.textPrimary }]}
                    value={form.notes}
                    onChangeText={(v: string) => setForm(f => ({ ...f, notes: v }))}
                    placeholder="Optional notes…"
                    placeholderTextColor={colors.textMuted}
                    multiline
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

function StatSmallCard({ label, value, unit, icon }: { label: string; value: string; unit: string; icon: string }) {
  return (
    <View style={styles.statSmallCard}>
      <Ionicons name={icon as any} size={16} color={colors.brandPrimary} />
      <View>
        <Text style={styles.statSmallValue}>{value}<Text style={styles.statSmallUnit}>{unit}</Text></Text>
        <Text style={styles.statSmallLabel}>{label}</Text>
      </View>
    </View>
  );
}

function ModalField({ icon, label, value, onChange, placeholder, keyboardType }: {
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
        style={[styles.inputBox, { color: colors.textPrimary }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  inner: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  logBtnText: { fontSize: 14, fontWeight: '800', color: colors.background },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionHeader: { marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statSmallCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statSmallValue: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  statSmallUnit: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginLeft: 2 },
  statSmallLabel: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  targetsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    marginTop: 10,
  },
  targetsBtnText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },

  // Modal styles (Existing)
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
  unitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  unitToggle: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 10, padding: 3 },
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
  },
  notesBox: { height: 88, textAlignVertical: 'top', paddingTop: 14 },
});
