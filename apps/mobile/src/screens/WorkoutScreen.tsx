import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, statusColors, statusBackgrounds } from '../theme/colors';
import { TrainingStatus } from '@apex/shared';
import api from '../lib/api';
import ExercisePicker from '../components/ExercisePicker';

const { width } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionExercise {
  id: string;
  exerciseId: string;
  orderIndex: number;
}

interface ActiveSession {
  sessionId: string;
  workoutDayId: string;
  exercises: SessionExercise[];
}

interface WorkoutExercise {
  id: string;
  prescriptionId: string;
  name: string;
  muscle: string | null;
  sets: number;
  repMin: number;
  repMax: number;
  rirTarget: number;
  suggestedWeight: number;
  mediaUrl?: string | null;
}

interface LoggedSet {
  setNumber: number;
  weight: string;
  reps: string;
  rir: string;
  setType: 'warmup' | 'working';
  status: TrainingStatus | null;
}

interface PersistedSession {
  sessionId: string;
  workoutDayId: string;
  startTimeISO: string;
  exercises: WorkoutExercise[];
  loggedSets: Record<string, LoggedSet[]>;
  elapsedSec: number;
}

interface TodayWorkout {
  assignment: { id: string; programId: string; startDate: string | null };
  program: { id: string; name: string; totalWeeks: number };
  currentWeek: { id: string; weekNumber: number; absoluteWeekNumber: number };
  workoutDay: {
    id: string;
    workoutType: string;
    phase: string;
    exercisePrescriptions: Array<{
      id: string;
      exerciseId: string;
      targetRepRange: string | null;
      sortOrder: number;
      exercise: { id: string; name: string; muscleGroup: string | null; mediaUrl?: string | null };
    }>;
  } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_KEY = 'apex_active_session';
const DEFAULT_SETS = 3;
const DEFAULT_REST_SEC = 120; // 2:00

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateStatus(reps: number, repMin: number, repMax: number): TrainingStatus {
  if (reps >= repMax) return 'ACHIEVED';
  if (reps >= repMin) return 'PROGRESS';
  return 'FAILED';
}

function parseRepRange(range: string | null): { repMin: number; repMax: number } {
  if (!range) return { repMin: 8, repMax: 12 };
  const match = range.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (match) return { repMin: parseInt(match[1], 10), repMax: parseInt(match[2], 10) };
  const single = parseInt(range, 10);
  if (!isNaN(single)) return { repMin: single, repMax: single };
  return { repMin: 8, repMax: 12 };
}

function mapToExercises(workout: TodayWorkout): WorkoutExercise[] {
  if (!workout.workoutDay) return [];
  return [...workout.workoutDay.exercisePrescriptions]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => {
      const { repMin, repMax } = parseRepRange(p.targetRepRange);
      return {
        id: p.exercise.id,
        prescriptionId: p.id,
        name: p.exercise.name,
        muscle: p.exercise.muscleGroup,
        sets: DEFAULT_SETS,
        repMin,
        repMax,
        rirTarget: 2,
        suggestedWeight: (p as any).suggestedWeight || 0,
        mediaUrl: p.exercise.mediaUrl || null,
      };
    });
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

async function saveSession(session: PersistedSession) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
async function loadSession(): Promise<PersistedSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}

// ─── SetInputRow ──────────────────────────────────────────────────────────────

function SetInputRow({
  setNum,
  isWarmup,
  repMin,
  repMax,
  rirTarget,
  suggestedWeight,
  onLog,
  loggedSet,
}: {
  setNum: number;
  isWarmup: boolean;
  repMin: number;
  repMax: number;
  rirTarget: number;
  suggestedWeight: number;
  onLog: (data: { weight: string; reps: string; rir: string; setType: 'warmup' | 'working' }) => void;
  loggedSet?: LoggedSet;
}) {
  const [weight, setWeight] = useState(suggestedWeight > 0 ? suggestedWeight.toString() : '');
  const [reps, setReps] = useState('');

  const isLogged = !!loggedSet;
  const displayReps = isLogged ? loggedSet.reps : reps;
  const displayWeight = isLogged ? loggedSet.weight : weight;

  return (
    <View style={[setRowStyles.row, isLogged && setRowStyles.rowLogged]}>
      {/* Set badge */}
      <View style={[setRowStyles.badge, isLogged && setRowStyles.badgeLogged, isWarmup && setRowStyles.badgeWarmup]}>
        {isLogged ? (
          <Ionicons name="checkmark" size={16} color="#fff" />
        ) : (
          <Text style={setRowStyles.badgeText}>{isWarmup ? 'W' : setNum}</Text>
        )}
      </View>

      {/* Reps input */}
      <View style={setRowStyles.inputGroup}>
        <TextInput
          style={[setRowStyles.input, isLogged && setRowStyles.inputLogged]}
          value={displayReps}
          onChangeText={setReps}
          editable={!isLogged}
          keyboardType="number-pad"
          placeholder={`${repMin}`}
          placeholderTextColor="rgba(255,255,255,0.2)"
        />
      </View>

      {/* Weight input */}
      <View style={setRowStyles.inputGroup}>
        <TextInput
          style={[setRowStyles.input, isLogged && setRowStyles.inputLogged]}
          value={displayWeight}
          onChangeText={setWeight}
          editable={!isLogged}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor="rgba(255,255,255,0.2)"
        />
      </View>

      {/* Log button (only for unlogged sets, triggered by parent) */}
    </View>
  );
}

const setRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowLogged: {},
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLogged: { backgroundColor: '#10B981' },
  badgeWarmup: { backgroundColor: 'rgba(255,255,255,0.06)' },
  badgeText: { color: colors.textMuted, fontSize: 14, fontWeight: '800' },
  inputGroup: { flex: 1 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 14,
    textAlign: 'center',
  },
  inputLogged: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.04)',
    color: colors.textMuted,
  },
});

// ─── RestTimerSheet ───────────────────────────────────────────────────────────

function RestTimerSheet({
  visible,
  timeLeft,
  onSkip,
  onAdjust,
  onPauseToggle,
  isPaused,
}: {
  visible: boolean;
  timeLeft: number;
  onSkip: () => void;
  onAdjust: (delta: number) => void;
  onPauseToggle: () => void;
  isPaused: boolean;
}) {
  if (!visible) return null;

  return (
    <View style={restStyles.container}>
      <View style={restStyles.sheet}>
        <View style={restStyles.header}>
          <Text style={restStyles.title}>Rest</Text>
          <TouchableOpacity onPress={onSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={restStyles.timerRow}>
          <TouchableOpacity onPress={() => onAdjust(-10)} style={restStyles.adjustBtn}>
            <Ionicons name="timer-outline" size={24} color={colors.textMuted} />
            <Text style={restStyles.adjustLabel}>-10</Text>
          </TouchableOpacity>

          <Text style={restStyles.time}>{fmtTime(timeLeft)}</Text>

          <TouchableOpacity onPress={() => onAdjust(10)} style={restStyles.adjustBtn}>
            <Ionicons name="timer-outline" size={24} color={colors.textMuted} />
            <Text style={restStyles.adjustLabel}>+10</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onPauseToggle} style={restStyles.pauseBtn}>
          <Ionicons name={isPaused ? 'play' : 'pause'} size={32} color={colors.brandPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const restStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  sheet: {
    backgroundColor: '#1C1C28',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 50,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 24,
  },
  adjustBtn: { alignItems: 'center', gap: 4 },
  adjustLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  time: { fontSize: 64, fontWeight: '900', color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  pauseBtn: { alignSelf: 'center', padding: 12 },
});

// ─── FinishModal ──────────────────────────────────────────────────────────────

function FinishModal({
  visible,
  elapsed,
  exercises,
  loggedSets,
  syncPrefs,
  onSyncChange,
  onResume,
  onLog,
}: {
  visible: boolean;
  elapsed: number;
  exercises: WorkoutExercise[];
  loggedSets: Record<string, LoggedSet[]>;
  syncPrefs: { appleHealth: boolean; strava: boolean; fitbit: boolean };
  onSyncChange: (key: 'appleHealth' | 'strava' | 'fitbit', val: boolean) => void;
  onResume: () => void;
  onLog: () => void;
}) {
  const totalVolume = useMemo(() => {
    let v = 0;
    Object.values(loggedSets).forEach(sets => sets.forEach(s => {
      const w = parseFloat(s.weight); const r = parseInt(s.reps, 10);
      if (!isNaN(w) && !isNaN(r)) v += w * r;
    }));
    return v;
  }, [loggedSets]);

  const totalSets = Object.values(loggedSets).flat().length;
  const cals = Math.floor(elapsed / 12);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={finishStyles.overlay}>
        {/* Top area — shows workout behind */}
        <View style={finishStyles.topFade}>
          <TouchableOpacity style={finishStyles.closeTop} onPress={onResume}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={finishStyles.elapsedTime}>{fmtTime(elapsed)}</Text>

          {/* Exercise summary cards */}
          <ScrollView style={finishStyles.exerciseScroll} showsVerticalScrollIndicator={false}>
            {exercises.map(ex => {
              const sets = loggedSets[ex.id] ?? [];
              const restSec = 33; // placeholder
              return (
                <View key={ex.id} style={finishStyles.exCard}>
                  <View style={finishStyles.exThumb}>
                    {ex.mediaUrl ? (
                      <Image source={{ uri: ex.mediaUrl }} style={finishStyles.exThumbImg} />
                    ) : (
                      <View style={finishStyles.exThumbPlaceholder}>
                        <Ionicons name="barbell-outline" size={20} color={colors.textMuted} />
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={finishStyles.focusLabel}>FOCUS EXERCISE</Text>
                    <Text style={finishStyles.exName}>{ex.name}</Text>
                    <Text style={finishStyles.exMeta}>{sets.length}/{ex.sets} logged</Text>
                    <Text style={finishStyles.exRest}>⏱ 00:{restSec.toString().padStart(2, '0')} Rest</Text>
                  </View>
                  <TouchableOpacity>
                    <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Bottom panel */}
        <View style={finishStyles.bottomPanel}>
          <View style={finishStyles.accentLine} />

          <View style={finishStyles.headerRow}>
            <Text style={finishStyles.finishHeading}>Finish and log your workout?</Text>
            <TouchableOpacity>
              <Ionicons name="help-circle-outline" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Stats grid */}
          <View style={finishStyles.statsRow}>
            <View style={finishStyles.statCell}>
              <Text style={finishStyles.statLabel}>DURATION</Text>
              <Text style={finishStyles.statValue}>{fmtTime(elapsed)}</Text>
            </View>
            <View style={finishStyles.statCell}>
              <Text style={finishStyles.statLabel}>EXERCISES</Text>
              <Text style={finishStyles.statValue}>{exercises.length}</Text>
            </View>
            <View style={finishStyles.statCell}>
              <Text style={finishStyles.statLabel}>VOLUME</Text>
              <Text style={finishStyles.statValue}>{totalVolume.toLocaleString()} lb</Text>
            </View>
            <View style={finishStyles.statCell}>
              <Text style={finishStyles.statLabel}>CALORIES</Text>
              <Text style={finishStyles.statValue}>{cals} kcal</Text>
            </View>
          </View>

          {/* Sync toggles */}
          <View style={finishStyles.syncSection}>
            <View style={finishStyles.syncRow}>
              <Ionicons name="heart" size={20} color="#FF2D55" />
              <Text style={finishStyles.syncLabel}>Sync to Apple Health</Text>
              <Switch
                value={syncPrefs.appleHealth}
                onValueChange={v => onSyncChange('appleHealth', v)}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(0,194,255,0.3)' }}
                thumbColor={syncPrefs.appleHealth ? colors.brandPrimary : '#555'}
              />
            </View>
            <View style={finishStyles.syncRow}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FC4C02" />
              <Text style={finishStyles.syncLabel}>Post to Strava</Text>
              <Switch
                value={syncPrefs.strava}
                onValueChange={v => onSyncChange('strava', v)}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(0,194,255,0.3)' }}
                thumbColor={syncPrefs.strava ? colors.brandPrimary : '#555'}
              />
            </View>
            <View style={finishStyles.syncRow}>
              <Ionicons name="fitness" size={20} color="#00B0B9" />
              <Text style={finishStyles.syncLabel}>Post to Fitbit</Text>
              <Switch
                value={syncPrefs.fitbit}
                onValueChange={v => onSyncChange('fitbit', v)}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(0,194,255,0.3)' }}
                thumbColor={syncPrefs.fitbit ? colors.brandPrimary : '#555'}
              />
            </View>
          </View>

          {/* Action buttons */}
          <View style={finishStyles.actions}>
            <TouchableOpacity style={finishStyles.resumeBtn} onPress={onResume}>
              <Text style={finishStyles.resumeBtnText}>Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity style={finishStyles.logBtn} onPress={onLog}>
              <Text style={finishStyles.logBtnText}>Log Workout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const finishStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  topFade: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  closeTop: { position: 'absolute', right: 20, top: 60, zIndex: 10 },
  elapsedTime: { fontSize: 28, fontWeight: '800', color: 'rgba(0, 194, 255, 0.5)', textAlign: 'center', marginBottom: 24 },
  exerciseScroll: { flex: 1 },
  exCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  exThumb: { width: 56, height: 56, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)' },
  exThumbImg: { width: '100%', height: '100%' },
  exThumbPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  focusLabel: { fontSize: 10, fontWeight: '800', color: colors.brandPrimary, letterSpacing: 1 },
  exName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  exMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  exRest: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  bottomPanel: {
    backgroundColor: '#111118',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 40,
  },
  accentLine: { height: 3, backgroundColor: colors.brandPrimary, marginBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  finishHeading: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  statCell: { alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginBottom: 6 },
  statValue: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  syncSection: { gap: 2, marginBottom: 24 },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  syncLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  actions: { flexDirection: 'row', gap: 12 },
  resumeBtn: { flex: 1, paddingVertical: 18, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  resumeBtnText: { color: colors.textPrimary, fontWeight: '800', fontSize: 16 },
  logBtn: { flex: 1.5, paddingVertical: 18, borderRadius: 14, backgroundColor: colors.brandPrimary, alignItems: 'center' },
  logBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

type WorkoutState = 'loading' | 'idle' | 'active' | 'saving' | 'completed' | 'error' | 'rest' | 'no-program';

export default function WorkoutScreen() {
  const [screenState, setScreenState] = useState<WorkoutState>('loading');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [workout, setWorkout] = useState<TodayWorkout | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loggedSets, setLoggedSets] = useState<Record<string, LoggedSet[]>>({});
  const [expandedIdx, setExpandedIdx] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Rest timer
  const [restTimeLeft, setRestTimeLeft] = useState<number | null>(null);
  const [restPaused, setRestPaused] = useState(false);
  const [restDuration, setRestDuration] = useState(DEFAULT_REST_SEC);

  // Set type toggle per exercise
  const [setTabMode, setSetTabMode] = useState<'working' | 'warmup'>('working');

  // Exercise picker
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  // Finish modal
  const [showFinishModal, setShowFinishModal] = useState(false);

  // Sync
  const [syncPrefs, setSyncPrefs] = useState({ appleHealth: false, strava: false, fitbit: false });

  // ── Elapsed timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (screenState !== 'active' || !startTime) return;
    const iv = setInterval(() => setElapsedSec(Math.floor((Date.now() - startTime.getTime()) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [screenState, startTime]);

  // ── Rest timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (restTimeLeft === null || restTimeLeft <= 0 || restPaused) return;
    const iv = setInterval(() => {
      setRestTimeLeft(p => {
        if (p !== null && p > 0) return p - 1;
        return null;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [restTimeLeft, restPaused]);

  // Auto-dismiss rest when done
  useEffect(() => {
    if (restTimeLeft === 0) setRestTimeLeft(null);
  }, [restTimeLeft]);

  // ── Persist session ────────────────────────────────────────────────────────
  useEffect(() => {
    if (screenState !== 'active' || !workout?.workoutDay || !startTime || !activeSession) return;
    saveSession({
      sessionId: activeSession.sessionId,
      workoutDayId: workout.workoutDay.id,
      startTimeISO: startTime.toISOString(),
      exercises,
      loggedSets,
      elapsedSec,
    });
  }, [loggedSets, elapsedSec]);

  // ── Load workout ───────────────────────────────────────────────────────────
  const loadWorkout = useCallback(async () => {
    setScreenState('loading');
    try {
      const res = await api.workouts.today();
      if (!res.success) {
        setErrorMessage(res.error ?? 'Failed to connect');
        setScreenState('error');
        return;
      }
      const data = res.data as TodayWorkout | null;
      if (!data || !data.program) {
        setScreenState('no-program');
        return;
      }
      if (!data.workoutDay || data.workoutDay.phase === 'Rest') {
        setScreenState('rest');
        return;
      }
      setWorkout(data);
      const mapped = mapToExercises(data);
      setExercises(mapped);

      const saved = await loadSession();
      if (saved && saved.workoutDayId === data.workoutDay.id) {
        Alert.alert('Resume Session?', 'Continue from where you left off?', [
          { text: 'Fresh Start', style: 'destructive', onPress: () => { clearSession(); setScreenState('idle'); } },
          { text: 'Resume', onPress: () => {
            setLoggedSets(saved.loggedSets);
            setElapsedSec(saved.elapsedSec);
            setStartTime(new Date(saved.startTimeISO));
            setActiveSession({ sessionId: saved.sessionId, workoutDayId: saved.workoutDayId, exercises: [] });
            setScreenState('active');
          }},
        ]);
      } else {
        setScreenState('idle');
      }
    } catch {
      setErrorMessage('Server unreachable');
      setScreenState('error');
    }
  }, []);

  useEffect(() => { loadWorkout(); }, [loadWorkout]);

  async function startWorkout() {
    if (!workout?.workoutDay) return;
    setScreenState('loading');
    try {
      const res = await api.request<{ session: { id: string }; sessionExercises: any[] }>('POST', '/api/workouts/session/start', {
        workoutDayId: workout.workoutDay.id,
      });
      if (!res.success || !res.data) throw new Error(res.error || 'Failed to start');
      setActiveSession({
        sessionId: res.data.session.id,
        workoutDayId: workout.workoutDay.id,
        exercises: res.data.sessionExercises,
      });
      setStartTime(new Date());
      setLoggedSets({});
      setExpandedIdx(0);
      setElapsedSec(0);
      setScreenState('active');
    } catch (err: any) {
      Alert.alert('Error', err.message);
      setScreenState('idle');
    }
  }

  async function logSet(exId: string, setNum: number, data: any, repMin: number, repMax: number) {
    if (!activeSession) return;
    const sessionEx = activeSession.exercises.find(e => e.exerciseId === exId) || { id: exId };
    const status = calculateStatus(parseInt(data.reps, 10), repMin, repMax);
    try {
      await api.request('POST', `/api/workouts/session/exercises/${sessionEx.id}/sets`, {
        setType: data.setType,
        setOrder: setNum,
        actualReps: parseInt(data.reps, 10),
        actualWeight: parseFloat(data.weight),
        rir: parseInt(data.rir, 10),
        completed: true,
      });
      setLoggedSets(prev => {
        const existing = prev[exId] ?? [];
        return { ...prev, [exId]: [...existing.filter(s => s.setNumber !== setNum), { setNumber: setNum, ...data, status }] };
      });
      // Start rest timer
      setRestTimeLeft(restDuration);
      setRestPaused(false);
    } catch (err: any) {
      Alert.alert('Log Failed', err.message);
    }
  }

  function logAllSets(ex: WorkoutExercise) {
    // Collect refs from set inputs — for now, log with default values
    Alert.alert('Log All Sets', 'This will log all sets with the current values.');
  }

  async function submitWorkout() {
    setScreenState('saving');
    setShowFinishModal(false);
    try {
      for (const ex of exercises) {
        const sets = loggedSets[ex.id];
        if (!sets?.length) continue;
        const payload: any = {
          exerciseId: ex.id,
          sessionDate: new Date().toISOString().split('T')[0],
          weight: parseFloat(sets[0].weight) || 0,
          programId: workout?.program?.id,
          workoutDayId: workout?.workoutDay?.id,
          exercisePrescriptionId: ex.prescriptionId,
        };
        sets.forEach((s, i) => { if (i < 4) payload[`set${i+1}Reps`] = parseInt(s.reps, 10) || 0; });
        await api.request('POST', '/api/training-log', payload);
      }
      if (activeSession) {
        await api.request('POST', '/api/workouts/session/finish', {
          sessionId: activeSession.sessionId,
          syncToAppleHealth: syncPrefs.appleHealth,
          postToStrava: syncPrefs.strava,
          postToFitbit: syncPrefs.fitbit,
        });
      }
      await clearSession();
      setScreenState('completed');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message);
      setScreenState('active');
    }
  }

  const totalPrescribed = exercises.reduce((s, e) => s + e.sets, 0);
  const totalLogged = Object.values(loggedSets).flat().length;
  const workoutName = workout?.workoutDay?.workoutType ?? 'Workout';
  const phaseText = workout?.workoutDay?.phase ?? '';
  const weekNum = workout?.currentWeek?.absoluteWeekNumber ?? 1;

  const Background = () => <LinearGradient colors={['#0A0A0F', '#1A1A26']} style={StyleSheet.absoluteFill} />;

  // ═══ Loading ═══════════════════════════════════════════════════════════════
  if (screenState === 'loading') {
    return (
      <View style={ms.container}><Background />
        <SafeAreaView style={ms.centeredState}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </SafeAreaView>
      </View>
    );
  }

  // ═══ Error ══════════════════════════════════════════════════════════════════
  if (screenState === 'error') {
    return (
      <View style={ms.container}><Background />
        <SafeAreaView style={ms.centeredState}>
          <Text style={ms.errorTitle}>Connection error</Text>
          <Text style={ms.errorSub}>{errorMessage}</Text>
          <TouchableOpacity style={ms.retryBtn} onPress={loadWorkout}><Text style={ms.retryBtnText}>RETRY</Text></TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  // ═══ No Program ════════════════════════════════════════════════════════════
  if (screenState === 'no-program') {
    return (
      <View style={ms.container}><Background />
        <SafeAreaView style={ms.centeredState}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0, 194, 255, 0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Ionicons name="barbell-outline" size={36} color={colors.brandPrimary} />
          </View>
          <Text style={ms.restDayTitle}>No Program Yet</Text>
          <Text style={ms.restDaySub}>Generate a training program from the Home tab{'\n'}to start your workouts.</Text>
          <TouchableOpacity style={ms.primaryBtn} onPress={() => setShowExercisePicker(true)}>
            <Text style={ms.primaryBtnText}>QUICK WORKOUT</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 12, textAlign: 'center' }}>
            Or pick exercises for a quick session
          </Text>
        </SafeAreaView>
        <ExercisePicker
          visible={showExercisePicker}
          onClose={() => setShowExercisePicker(false)}
          onSelect={(ex) => {
            setExercises(prev => [...prev, {
              id: ex.id, prescriptionId: '', name: ex.name,
              muscle: ex.bodyPart, sets: DEFAULT_SETS, repMin: 8, repMax: 12,
              rirTarget: 2, suggestedWeight: 0, mediaUrl: ex.mediaUrl,
            }]);
            if (exercises.length === 0) {
              setScreenState('idle');
            }
          }}
        />
      </View>
    );
  }

  // ═══ Rest Day ══════════════════════════════════════════════════════════════
  if (screenState === 'rest') {
    return (
      <View style={ms.container}><Background />
        <SafeAreaView style={ms.centeredState}>
          <Text style={{ fontSize: 60, marginBottom: 20 }}>🌙</Text>
          <Text style={ms.restDayTitle}>Recovery Protocol</Text>
          <Text style={ms.restDaySub}>Rest is where the growth happens. See you tomorrow.</Text>
        </SafeAreaView>
      </View>
    );
  }

  // ═══ Completed ══════════════════════════════════════════════════════════════
  if (screenState === 'completed') {
    return (
      <View style={ms.container}><Background />
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={ms.summaryScroll}>
            <View style={ms.completeBadge}><Text style={{ fontSize: 40 }}>⚡</Text></View>
            <Text style={ms.completeTitle}>PROTOCOL{'\n'}<Text style={ms.italic}>COMPLETE</Text></Text>
            <View style={ms.summaryGrid}>
              <View style={ms.summaryBox}><Text style={ms.summaryVal}>{fmtTime(elapsedSec)}</Text><Text style={ms.summaryLabel}>Time</Text></View>
              <View style={ms.summaryBox}><Text style={ms.summaryVal}>{exercises.length}</Text><Text style={ms.summaryLabel}>Exercises</Text></View>
              <View style={ms.summaryBox}><Text style={ms.summaryVal}>{totalLogged}</Text><Text style={ms.summaryLabel}>Sets</Text></View>
            </View>
            <TouchableOpacity style={ms.primaryBtn} onPress={() => { setScreenState('idle'); loadWorkout(); }}>
              <Text style={ms.primaryBtnText}>RETURN HOME</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ═══ Idle (Preview) ════════════════════════════════════════════════════════
  if (screenState === 'idle') {
    return (
      <View style={ms.container}><Background />
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ms.scroll}>
            <Text style={ms.pageTitle}>Today's{'\n'}<Text style={ms.italic}>Protocol</Text></Text>
            <View style={ms.previewCard}>
              <View style={ms.previewHeaderRow}>
                <Text style={ms.workoutName}>{workoutName}</Text>
                <TouchableOpacity onPress={() => setShowExercisePicker(true)}>
                  <Ionicons name="add-circle-outline" size={28} color={colors.brandPrimary} />
                </TouchableOpacity>
              </View>
              <Text style={ms.workoutMeta}>Week {weekNum} · {exercises.length} exercises</Text>

              {exercises.map((ex, idx) => (
                <View key={ex.id} style={ms.previewRow}>
                  <View style={ms.previewIndex}><Text style={ms.previewIndexText}>{idx + 1}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={ms.previewName}>{ex.name}</Text>
                    <Text style={ms.previewSub}>{ex.sets} sets · {ex.repMin}-{ex.repMax} reps</Text>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={ms.primaryBtn} onPress={startWorkout}>
                <Text style={ms.primaryBtnText}>IGNITE PROTOCOL</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>

        <ExercisePicker
          visible={showExercisePicker}
          onClose={() => setShowExercisePicker(false)}
          onSelect={(ex) => {
            setExercises(prev => [...prev, {
              id: ex.id, prescriptionId: '', name: ex.name,
              muscle: ex.bodyPart, sets: DEFAULT_SETS, repMin: 8, repMax: 12,
              rirTarget: 2, suggestedWeight: 0, mediaUrl: ex.mediaUrl,
            }]);
          }}
        />
      </View>
    );
  }

  // ═══ Active Workout ═════════════════════════════════════════════════════════

  const currentEx = exercises[expandedIdx] ?? exercises[0];
  const currentLogged = loggedSets[currentEx?.id] ?? [];
  const currentComplete = currentLogged.length >= (currentEx?.sets ?? 0);


  return (
    <View style={ms.container}>
      <Background />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        {/* ── Exercise image/header area ─────────────── */}
        <View style={ms.exDetailHeader}>
          {currentEx?.mediaUrl ? (
            <Image source={{ uri: currentEx.mediaUrl }} style={ms.exImage} resizeMode="cover" />
          ) : (
            <View style={ms.exImagePlaceholder}>
              <Ionicons name="barbell-outline" size={48} color="rgba(255,255,255,0.15)" />
            </View>
          )}

          {/* Gradient overlay + exercise name */}
          <LinearGradient
            colors={['transparent', 'rgba(10,10,15,0.85)']}
            style={ms.exHeaderGradient}
          >
            <Text style={ms.exHeaderName} numberOfLines={1}>{currentEx?.name ?? ''}</Text>
            {currentEx?.muscle ? (
              <Text style={ms.exHeaderMuscle}>{currentEx.muscle}</Text>
            ) : null}
          </LinearGradient>

          <TouchableOpacity style={ms.closeBtn} onPress={() => setShowFinishModal(true)}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Exercise navigation pills */}
          <View style={ms.exNavPills}>
            {exercises.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setExpandedIdx(i)} style={[ms.navPill, i === expandedIdx && ms.navPillActive]} />
            ))}
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* ── Working / Warm-up tabs ───────────────── */}
          <View style={ms.setTabRow}>
            <TouchableOpacity
              style={[ms.setTab, setTabMode === 'working' && ms.setTabActive]}
              onPress={() => setSetTabMode('working')}
            >
              <Text style={[ms.setTabText, setTabMode === 'working' && ms.setTabTextActive]}>Working Sets</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ms.setTab, setTabMode === 'warmup' && ms.setTabActive]}
              onPress={() => setSetTabMode('warmup')}
            >
              <Text style={[ms.setTabText, setTabMode === 'warmup' && ms.setTabTextActive]}>Warm-up Sets</Text>
            </TouchableOpacity>
          </View>

          {/* ── Rest timer inline toggle ─────────────── */}
          <View style={ms.restTimerToggleRow}>
            <Ionicons name="timer-outline" size={20} color={colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={ms.restTimerLabel}>Rest Timer</Text>
              <Text style={ms.restTimerSub}>Between Sets</Text>
            </View>
            <Switch
              value={restDuration > 0}
              onValueChange={v => setRestDuration(v ? DEFAULT_REST_SEC : 0)}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(0, 194, 255, 0.3)' }}
              thumbColor={restDuration > 0 ? colors.brandPrimary : '#555'}
            />
          </View>

          {/* ── Rest time selector ────────────────────── */}
          {restDuration > 0 && (
            <View style={ms.restPickerRow}>
              <TouchableOpacity onPress={() => setRestDuration(d => Math.max(10, d - 10))} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={[ms.restPickerTime, { opacity: 0.3 }]}>{fmtTime(Math.max(10, restDuration - 10))}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRestDuration(d => Math.max(10, d - 5))} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={[ms.restPickerTime, { opacity: 0.5 }]}>{fmtTime(Math.max(10, restDuration - 5))}</Text>
              </TouchableOpacity>
              <View style={ms.restPickerHighlight}>
                <Text style={ms.restPickerTimeActive}>{fmtTime(restDuration)}</Text>
              </View>
              <TouchableOpacity onPress={() => setRestDuration(d => d + 5)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={[ms.restPickerTime, { opacity: 0.5 }]}>{fmtTime(restDuration + 5)}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRestDuration(d => d + 10)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={[ms.restPickerTime, { opacity: 0.3 }]}>{fmtTime(restDuration + 10)}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Phase info ────────────────────────────── */}
          <View style={ms.phaseInfo}>
            <View style={ms.phaseIcon}><Text style={{ fontSize: 22 }}>✨</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={ms.phaseTitle}>Phase {weekNum} of 4: {phaseText || 'Building Momentum'}</Text>
              <Text style={ms.phaseSub}>Today should feel challenging but controlled. Focus on form and move with intent.</Text>
            </View>
          </View>
          <Text style={ms.adjustNote}>Adjust weights if necessary.</Text>

          {/* ── Set header ─────────────────────────────── */}
          <View style={ms.setHeaderRow}>
            <View style={{ width: 32 }} />
            <Text style={[ms.setHeaderLabel, { flex: 1 }]}>
              {setTabMode === 'warmup' ? 'Warm-up Reps' : 'Reps'}
            </Text>
            <Text style={[ms.setHeaderLabel, { flex: 1 }]}>Weight (lb)</Text>
          </View>

          {/* ── Set rows ───────────────────────────────── */}
          {currentEx && Array.from({ length: currentEx.sets }).map((_, si) => {
            const num = si + 1;
            const log = currentLogged.find(s => s.setNumber === num);
            const isWarmup = setTabMode === 'warmup' && si === 0;
            return (
              <View key={num} style={ms.setRowContainer}>
                <SetInputRow
                  setNum={num}
                  isWarmup={isWarmup}
                  repMin={currentEx.repMin}
                  repMax={currentEx.repMax}
                  rirTarget={currentEx.rirTarget}
                  suggestedWeight={currentEx.suggestedWeight}
                  loggedSet={log}
                  onLog={() => {}}
                />
                {log && si === 0 && (
                  <Text style={ms.barPlates}>Bar + Plates</Text>
                )}
              </View>
            );
          })}

          {/* ── Add Set ────────────────────────────────── */}
          <TouchableOpacity style={ms.addSetRow} onPress={() => {
            if (!currentEx) return;
            setExercises(prev => prev.map(e => e.id === currentEx.id ? { ...e, sets: e.sets + 1 } : e));
          }}>
            <View style={ms.addSetIcon}><Ionicons name="add" size={18} color={colors.brandPrimary} /></View>
            <Text style={ms.addSetText}>Add Set</Text>
          </TouchableOpacity>

          <View style={{ height: 140 }} />
        </ScrollView>

        {/* ── Bottom action buttons ────────────────── */}
        <View style={ms.bottomActions}>
          <TouchableOpacity style={ms.startBtn} onPress={() => {
            setRestTimeLeft(restDuration > 0 ? restDuration : DEFAULT_REST_SEC);
            setRestPaused(false);
          }}>
            <Ionicons name="play" size={16} color={colors.textPrimary} style={{ marginBottom: 2 }} />
            <Text style={ms.startBtnText}>Start</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[ms.logSetBtn, currentComplete && ms.logSetBtnDone]}
            onPress={() => {
              if (!currentEx) return;
              const nextUnlogged = Array.from({ length: currentEx.sets }).findIndex((_, i) => !currentLogged.find(s => s.setNumber === i + 1));
              if (nextUnlogged === -1) {
                // All sets done — move to next exercise
                if (expandedIdx < exercises.length - 1) setExpandedIdx(expandedIdx + 1);
                return;
              }
              const setNum = nextUnlogged + 1;
              logSet(currentEx.id, setNum, {
                weight: currentEx.suggestedWeight > 0 ? currentEx.suggestedWeight.toString() : '100',
                reps: currentEx.repMin.toString(),
                rir: currentEx.rirTarget.toString(),
                setType: setTabMode,
              }, currentEx.repMin, currentEx.repMax);
            }}
          >
            <Text style={ms.logSetBtnText}>
              {currentComplete ? 'Next Exercise' : `Log Set ${currentLogged.length + 1}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Rest timer bottom sheet ──────────────── */}
        <RestTimerSheet
          visible={restTimeLeft !== null && restTimeLeft > 0}
          timeLeft={restTimeLeft ?? 0}
          onSkip={() => setRestTimeLeft(null)}
          onAdjust={(delta) => setRestTimeLeft(p => Math.max(0, (p ?? 0) + delta))}
          onPauseToggle={() => setRestPaused(p => !p)}
          isPaused={restPaused}
        />

        {/* ── Finish modal ─────────────────────────── */}
        <FinishModal
          visible={showFinishModal}
          elapsed={elapsedSec}
          exercises={exercises}
          loggedSets={loggedSets}
          syncPrefs={syncPrefs}
          onSyncChange={(k, v) => setSyncPrefs(p => ({ ...p, [k]: v }))}
          onResume={() => setShowFinishModal(false)}
          onLog={submitWorkout}
        />

        {/* ── Exercise picker ──────────────────────── */}
        <ExercisePicker
          visible={showExercisePicker}
          onClose={() => setShowExercisePicker(false)}
          onSelect={(ex) => {
            setExercises(prev => [...prev, {
              id: ex.id, prescriptionId: '', name: ex.name,
              muscle: ex.bodyPart, sets: DEFAULT_SETS, repMin: 8, repMax: 12,
              rirTarget: 2, suggestedWeight: 0, mediaUrl: ex.mediaUrl,
            }]);
          }}
        />
      </SafeAreaView>
    </View>
  );
}

// ─── Main styles ──────────────────────────────────────────────────────────────

const ms = StyleSheet.create({
  container: { flex: 1 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  errorTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  errorSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  retryBtn: { marginTop: 20, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.brandPrimary },
  retryBtnText: { color: '#fff', fontWeight: '900' },
  restDayTitle: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  restDaySub: { fontSize: 16, color: colors.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 24 },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  pageTitle: { fontSize: 36, fontWeight: '800', color: colors.textPrimary, marginTop: 20, marginBottom: 20 },
  italic: { fontStyle: 'italic', fontWeight: '900' },
  previewCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 20 },
  previewHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  workoutName: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  workoutMeta: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 20 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  previewIndex: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  previewIndexText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  previewName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  previewSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  primaryBtn: { backgroundColor: colors.brandPrimary, paddingVertical: 18, borderRadius: 14, alignItems: 'center', marginTop: 24 },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic' },
  summaryScroll: { padding: 24, alignItems: 'center', paddingTop: 60 },
  completeBadge: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0, 194, 255, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  completeTitle: { fontSize: 40, fontWeight: '900', color: colors.textPrimary, textAlign: 'center', marginBottom: 40 },
  summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 40, width: '100%' },
  summaryBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  summaryVal: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  summaryLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },

  // Active workout
  exDetailHeader: { height: 220, backgroundColor: '#0E0E18', position: 'relative' },
  exImage: { width: '100%', height: '100%' },
  exImagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0E0E18' },
  exHeaderGradient: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 100,
    justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 28,
  },
  exHeaderName: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  exHeaderMuscle: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  closeBtn: { position: 'absolute', right: 16, top: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  exNavPills: { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  navPill: { width: 40, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  navPillActive: { backgroundColor: 'rgba(255,255,255,0.7)' },

  setTabRow: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, gap: 0 },
  setTab: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, backgroundColor: 'transparent' },
  setTabActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  setTabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  setTabTextActive: { color: colors.textPrimary, fontWeight: '700' },

  restTimerToggleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  restTimerLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  restTimerSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },

  restPickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 16 },
  restPickerTime: { fontSize: 16, fontWeight: '600', color: colors.textMuted },
  restPickerHighlight: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20 },
  restPickerTimeActive: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },

  phaseInfo: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 14 },
  phaseIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  phaseTitle: { fontSize: 15, fontWeight: '700', color: colors.brandPrimary },
  phaseSub: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  adjustNote: { paddingHorizontal: 20, paddingBottom: 16, fontSize: 13, color: colors.textMuted },

  setHeaderRow: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 8, gap: 12 },
  setHeaderLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },

  setRowContainer: { paddingHorizontal: 20 },
  barPlates: { fontSize: 12, color: colors.textMuted, textAlign: 'right', marginTop: -6, marginBottom: 8 },

  addSetRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  addSetIcon: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: colors.brandPrimary, alignItems: 'center', justifyContent: 'center' },
  addSetText: { fontSize: 15, fontWeight: '700', color: colors.brandPrimary },

  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
    backgroundColor: '#0A0A0F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  startBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  startBtnText: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
  logSetBtn: {
    flex: 2,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logSetBtnDone: { backgroundColor: '#10B981' },
  logSetBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
