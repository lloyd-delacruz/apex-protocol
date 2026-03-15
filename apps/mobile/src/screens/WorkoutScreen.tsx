import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, statusColors, statusBackgrounds } from '../theme/colors';
import { TrainingStatus } from '@apex/shared';
import api from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

interface LoggedSet {
  setNumber: number;
  weight: string;
  reps: string;
  rir: string;
  status: TrainingStatus | null;
}

interface PersistedSession {
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
      exercise: { id: string; name: string; muscleGroup: string | null };
    }>;
  } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_KEY = 'apex_active_session';
const DEFAULT_SETS = 3;

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
        suggestedWeight: 0,
      };
    });
}

async function saveSession(session: PersistedSession): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

async function loadSession(): Promise<PersistedSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as PersistedSession) : null;
  } catch {
    return null;
  }
}

async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

// ─── SetInputRow ──────────────────────────────────────────────────────────────

function SetInputRow({
  setNum,
  repMin,
  repMax,
  rirTarget,
  suggestedWeight,
  onLog,
  loggedSet,
}: {
  setNum: number;
  repMin: number;
  repMax: number;
  rirTarget: number;
  suggestedWeight: number;
  onLog: (data: { weight: string; reps: string; rir: string }) => void;
  loggedSet?: LoggedSet;
}) {
  const [weight, setWeight] = useState(suggestedWeight > 0 ? suggestedWeight.toString() : '');
  const [reps, setReps] = useState('');
  const [rir, setRir] = useState(rirTarget.toString());

  const isLogged = !!loggedSet;
  const status = loggedSet?.status;

  return (
    <View style={[setRowStyles.row, isLogged && setRowStyles.rowLogged]}>
      <Text style={setRowStyles.setNum}>{setNum}</Text>

      <TextInput
        style={[setRowStyles.input, isLogged && setRowStyles.inputDisabled]}
        value={isLogged ? loggedSet.weight : weight}
        onChangeText={setWeight}
        editable={!isLogged}
        keyboardType="decimal-pad"
        placeholder="kg"
        placeholderTextColor={colors.textMuted}
        selectTextOnFocus
      />

      <TextInput
        style={[setRowStyles.input, isLogged && setRowStyles.inputDisabled]}
        value={isLogged ? loggedSet.reps : reps}
        onChangeText={setReps}
        editable={!isLogged}
        keyboardType="number-pad"
        placeholder={`${repMin}-${repMax}`}
        placeholderTextColor={colors.textMuted}
        selectTextOnFocus
      />

      <TextInput
        style={[setRowStyles.input, isLogged && setRowStyles.inputDisabled]}
        value={isLogged ? loggedSet.rir : rir}
        onChangeText={setRir}
        editable={!isLogged}
        keyboardType="number-pad"
        placeholder={`@${rirTarget}`}
        placeholderTextColor={colors.textMuted}
        selectTextOnFocus
      />

      {isLogged ? (
        <View style={[setRowStyles.badge, { backgroundColor: statusBackgrounds[status!] }]}>
          <Text style={[setRowStyles.badgeText, { color: statusColors[status!] }]}>
            {status === 'ACHIEVED' ? '✓' : status === 'PROGRESS' ? '~' : '✗'}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[setRowStyles.logBtn, weight && reps && rir ? setRowStyles.logBtnActive : setRowStyles.logBtnDisabled]}
          onPress={() => {
            if (!weight || !reps || !rir) return;
            onLog({ weight, reps, rir });
          }}
          activeOpacity={0.7}
          disabled={!weight || !reps || !rir}
        >
          <Text style={setRowStyles.logBtnText}>✓</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const setRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  rowLogged: {
    borderColor: 'rgba(16, 185, 129, 0.12)',
    backgroundColor: 'rgba(16, 185, 129, 0.02)',
  },
  setNum: { width: 20, fontSize: 12, fontWeight: '700', color: colors.textMuted, textAlign: 'center' },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    textAlign: 'center',
  },
  inputDisabled: { opacity: 0.6, borderColor: 'rgba(255,255,255,0.04)' },
  badge: { width: 30, height: 30, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 14, fontWeight: '700' },
  logBtn: { width: 30, height: 30, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  logBtnActive: { borderColor: 'rgba(0, 194, 255, 0.4)', backgroundColor: 'rgba(0, 194, 255, 0.08)' },
  logBtnDisabled: { borderColor: 'rgba(255,255,255,0.06)' },
  logBtnText: { color: colors.accent, fontSize: 13, fontWeight: '700' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

type WorkoutState = 'loading' | 'idle' | 'active' | 'saving' | 'completed' | 'error' | 'rest';

export default function WorkoutScreen() {
  const [screenState, setScreenState] = useState<WorkoutState>('loading');
  const [workout, setWorkout] = useState<TodayWorkout | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loggedSets, setLoggedSets] = useState<Record<string, LoggedSet[]>>({});
  const [expandedIdx, setExpandedIdx] = useState<number>(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (screenState !== 'active' || !startTime) return;
    const iv = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [screenState, startTime]);

  // ── Persist session as sets are logged ────────────────────────────────────
  useEffect(() => {
    if (screenState !== 'active' || !workout?.workoutDay || !startTime) return;
    saveSession({
      workoutDayId: workout.workoutDay.id,
      startTimeISO: startTime.toISOString(),
      exercises,
      loggedSets,
      elapsedSec,
    });
  }, [loggedSets, elapsedSec]);

  // ── Load today's workout ──────────────────────────────────────────────────
  const loadWorkout = useCallback(async () => {
    setScreenState('loading');
    try {
      const res = await api.workouts.today();
      if (!res.success) {
        setErrorMessage(res.error ?? 'Failed to load workout');
        setScreenState('error');
        return;
      }

      const data = res.data?.workout as TodayWorkout | null;
      if (!data || !data.workoutDay) {
        setScreenState('rest');
        return;
      }

      // Check if it's a rest day
      if (data.workoutDay.phase === 'Rest') {
        setScreenState('rest');
        return;
      }

      setWorkout(data);
      const mapped = mapToExercises(data);
      setExercises(mapped);

      // Check for a saved in-progress session
      const saved = await loadSession();
      if (saved && saved.workoutDayId === data.workoutDay.id) {
        Alert.alert(
          'Resume Workout?',
          'You have an unfinished workout session. Would you like to continue?',
          [
            {
              text: 'Start Fresh',
              style: 'destructive',
              onPress: async () => {
                await clearSession();
                setScreenState('idle');
              },
            },
            {
              text: 'Resume',
              onPress: () => {
                setLoggedSets(saved.loggedSets);
                setElapsedSec(saved.elapsedSec);
                setStartTime(new Date(saved.startTimeISO));
                setScreenState('active');
              },
            },
          ]
        );
      } else {
        setScreenState('idle');
      }
    } catch {
      setErrorMessage('Unable to connect to server');
      setScreenState('error');
    }
  }, []);

  useEffect(() => {
    loadWorkout();
  }, [loadWorkout]);

  // ── Actions ────────────────────────────────────────────────────────────────
  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  function startWorkout() {
    const now = new Date();
    setStartTime(now);
    setLoggedSets({});
    setExpandedIdx(0);
    setElapsedSec(0);
    setScreenState('active');
  }

  function logSet(
    exerciseId: string,
    setNum: number,
    data: { weight: string; reps: string; rir: string },
    repMin: number,
    repMax: number
  ) {
    const repsNum = parseInt(data.reps, 10);
    const status = calculateStatus(repsNum, repMin, repMax);
    setLoggedSets((prev) => {
      const existing = prev[exerciseId] ?? [];
      const filtered = existing.filter((s) => s.setNumber !== setNum);
      return { ...prev, [exerciseId]: [...filtered, { setNumber: setNum, ...data, status }] };
    });
  }

  async function finishWorkout() {
    Alert.alert(
      'Finish Workout?',
      `You have logged ${totalLogged} sets in ${formatTime(elapsedSec)}.`,
      [
        { text: 'Keep Going', style: 'cancel' },
        { text: 'Finish', onPress: submitWorkout },
      ]
    );
  }

  async function submitWorkout() {
    if (!workout?.workoutDay) {
      setScreenState('completed');
      return;
    }

    setScreenState('saving');
    const today = new Date().toISOString().split('T')[0];

    try {
      const submissions = exercises
        .map((exercise) => {
          const sets = (loggedSets[exercise.id] ?? []).sort((a, b) => a.setNumber - b.setNumber);
          if (sets.length === 0) return null;
          return api.trainingLog.log({
            exerciseId: exercise.id,
            sessionDate: today,
            programId: workout.assignment.programId,
            programWeekId: workout.currentWeek.id,
            workoutDayId: workout.workoutDay!.id,
            exercisePrescriptionId: exercise.prescriptionId,
            weight: sets[0]?.weight ? parseFloat(sets[0].weight) : undefined,
            weightUnit: 'kg',
            set1Reps: sets[0] ? parseInt(sets[0].reps, 10) : undefined,
            set2Reps: sets[1] ? parseInt(sets[1].reps, 10) : undefined,
            set3Reps: sets[2] ? parseInt(sets[2].reps, 10) : undefined,
            set4Reps: sets[3] ? parseInt(sets[3].reps, 10) : undefined,
            rir: sets[0]?.rir ? parseInt(sets[0].rir, 10) : undefined,
          });
        })
        .filter(Boolean);

      await Promise.allSettled(submissions as Promise<unknown>[]);
      await clearSession();
      setScreenState('completed');
    } catch {
      await clearSession();
      setScreenState('completed');
    }
  }

  const totalLogged = Object.values(loggedSets).flat().length;
  const totalPrescribed = exercises.reduce((s, e) => s + e.sets, 0);
  const workoutName = workout?.workoutDay?.workoutType ?? 'Workout';

  // ── Render states ──────────────────────────────────────────────────────────

  if (screenState === 'loading') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (screenState === 'error') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.centeredState}>
          <Text style={styles.errorTitle}>Could not load workout</Text>
          <Text style={styles.errorSub}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadWorkout} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (screenState === 'rest') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.centeredState}>
          <Text style={{ fontSize: 48 }}>🌙</Text>
          <Text style={styles.restTitle}>Rest Day</Text>
          <Text style={styles.restSub}>Recovery is part of the program.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (screenState === 'completed') {
    const allSets = Object.values(loggedSets).flat();
    const achieved = allSets.filter((s) => s.status === 'ACHIEVED').length;
    const progress = allSets.filter((s) => s.status === 'PROGRESS').length;
    const failed = allSets.filter((s) => s.status === 'FAILED').length;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <ScrollView contentContainerStyle={[styles.scroll, { alignItems: 'center', paddingTop: 40 }]}>
          <View style={styles.completeBadge}>
            <Text style={{ fontSize: 32 }}>🎯</Text>
          </View>
          <Text style={styles.completeTitle}>Workout Complete!</Text>
          <Text style={styles.completeSub}>{workoutName} · {formatTime(elapsedSec)}</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{allSets.length}</Text>
                <Text style={styles.summaryLabel}>Total Sets</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.accent }]}>{formatTime(elapsedSec)}</Text>
                <Text style={styles.summaryLabel}>Duration</Text>
              </View>
            </View>

            <View style={styles.statusSummaryRow}>
              <View style={[styles.statusSummaryItem, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
                <Text style={[styles.statusSummaryValue, { color: colors.success }]}>{achieved}</Text>
                <Text style={[styles.statusSummaryLabel, { color: colors.success }]}>Achieved</Text>
              </View>
              <View style={[styles.statusSummaryItem, { backgroundColor: 'rgba(0, 194, 255, 0.08)' }]}>
                <Text style={[styles.statusSummaryValue, { color: colors.accent }]}>{progress}</Text>
                <Text style={[styles.statusSummaryLabel, { color: colors.accent }]}>Progress</Text>
              </View>
              <View style={[styles.statusSummaryItem, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}>
                <Text style={[styles.statusSummaryValue, { color: colors.danger }]}>{failed}</Text>
                <Text style={[styles.statusSummaryLabel, { color: colors.danger }]}>Failed</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.startBtn, { width: '100%' }]}
            onPress={() => { setScreenState('idle'); setLoggedSets({}); }}
            activeOpacity={0.8}
          >
            <Text style={styles.startBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screenState === 'idle') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={styles.pageTitle}>Workout</Text>
          <View style={styles.previewCard}>
            <Text style={styles.workoutName}>{workoutName}</Text>
            <Text style={styles.workoutMeta}>
              Week {workout?.currentWeek?.absoluteWeekNumber} · {exercises.length} exercises · {totalPrescribed} sets
            </Text>

            {exercises.map((ex, idx) => (
              <View key={ex.id} style={styles.exercisePreviewRow}>
                <View style={styles.exerciseNum}>
                  <Text style={styles.exerciseNumText}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exercisePreviewName}>{ex.name}</Text>
                  <Text style={styles.exercisePreviewMeta}>
                    {ex.sets} × {ex.repMin}–{ex.repMax}
                    {ex.muscle ? ` · ${ex.muscle}` : ''}
                  </Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.startBtn} onPress={startWorkout} activeOpacity={0.8}>
              <Text style={styles.startBtnText}>⚡  Start Workout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Active workout view ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.liveHeader}>
        <View>
          <Text style={styles.liveTitle}>{workoutName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <View style={styles.liveDotContainer}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTime}>{formatTime(elapsedSec)}</Text>
            </View>
            <Text style={styles.liveSets}>{totalLogged}/{totalPrescribed} sets</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.finishBtn, screenState === 'saving' && { opacity: 0.6 }]}
          onPress={finishWorkout}
          activeOpacity={0.8}
          disabled={screenState === 'saving'}
        >
          {screenState === 'saving' ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.finishBtnText}>Finish</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${totalPrescribed > 0 ? (totalLogged / totalPrescribed) * 100 : 0}%` },
          ]}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}>
        <View style={styles.colHeader}>
          {['#', 'Weight', 'Reps', 'RIR', 'Status'].map((h) => (
            <Text key={h} style={styles.colHeaderText}>{h}</Text>
          ))}
        </View>

        {exercises.map((exercise, exIdx) => {
          const logged = loggedSets[exercise.id] ?? [];
          const complete = logged.length >= exercise.sets;
          const isExpanded = expandedIdx === exIdx;

          return (
            <View key={exercise.id} style={[styles.exerciseCard, complete && styles.exerciseCardComplete]}>
              <TouchableOpacity
                style={styles.exerciseHeader}
                onPress={() => setExpandedIdx(isExpanded ? -1 : exIdx)}
                activeOpacity={0.7}
              >
                <View style={[styles.exerciseNum, complete && { backgroundColor: colors.success }]}>
                  <Text style={[styles.exerciseNumText, complete && { color: 'white' }]}>
                    {complete ? '✓' : exIdx + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseCardName}>{exercise.name}</Text>
                  <Text style={styles.exerciseCardMeta}>
                    {exercise.sets} sets · {exercise.repMin}–{exercise.repMax} · @{exercise.rirTarget} RIR
                  </Text>
                </View>
                <Text style={styles.expandChevron}>{isExpanded ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.setsContainer}>
                  {Array.from({ length: exercise.sets }).map((_, sIdx) => {
                    const setNum = sIdx + 1;
                    const loggedSet = logged.find((s) => s.setNumber === setNum);
                    return (
                      <SetInputRow
                        key={setNum}
                        setNum={setNum}
                        repMin={exercise.repMin}
                        repMax={exercise.repMax}
                        rirTarget={exercise.rirTarget}
                        suggestedWeight={exercise.suggestedWeight}
                        loggedSet={loggedSet}
                        onLog={(data) => {
                          logSet(exercise.id, setNum, data, exercise.repMin, exercise.repMax);
                          if (setNum === exercise.sets && exIdx < exercises.length - 1) {
                            setTimeout(() => setExpandedIdx(exIdx + 1), 300);
                          }
                        }}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 16 },
  errorSub: { fontSize: 13, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 11, marginTop: 20 },
  retryBtnText: { color: colors.background, fontSize: 14, fontWeight: '700' },
  restTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: 14 },
  restSub: { fontSize: 14, color: colors.textMuted, marginTop: 6 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, paddingTop: 16, marginBottom: 16 },
  previewCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  workoutName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  workoutMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2, marginBottom: 14 },
  exercisePreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  exerciseNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  exerciseNumText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  exercisePreviewName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  exercisePreviewMeta: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  startBtn: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  startBtnText: { color: colors.background, fontSize: 14, fontWeight: '700' },
  liveHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  liveTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  liveDotContainer: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  liveTime: { fontSize: 12, color: colors.textMuted },
  liveSets: { fontSize: 12, color: colors.textMuted },
  finishBtn: { backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8, minWidth: 64, alignItems: 'center' },
  finishBtnText: { color: colors.background, fontSize: 13, fontWeight: '700' },
  progressBar: { height: 3, backgroundColor: 'rgba(255,255,255,0.06)' },
  progressFill: { height: '100%', backgroundColor: colors.accent },
  colHeader: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, gap: 6 },
  colHeaderText: { flex: 1, fontSize: 10, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', textAlign: 'center' },
  exerciseCard: { backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 8, overflow: 'hidden' },
  exerciseCardComplete: { borderColor: 'rgba(16, 185, 129, 0.15)' },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  exerciseCardName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  exerciseCardMeta: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  expandChevron: { fontSize: 10, color: colors.textMuted },
  setsContainer: { borderTopWidth: 1, borderTopColor: colors.border, padding: 8, gap: 6 },
  completeBadge: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  completeTitle: { fontSize: 26, fontWeight: '700', color: colors.textPrimary },
  completeSub: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 24 },
  summaryCard: { width: '100%', backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 26, fontWeight: '700' },
  summaryLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  statusSummaryRow: { flexDirection: 'row', gap: 8 },
  statusSummaryItem: { flex: 1, alignItems: 'center', borderRadius: 8, paddingVertical: 10 },
  statusSummaryValue: { fontSize: 20, fontWeight: '700' },
  statusSummaryLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});
