'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SetRow from '@/components/workout/SetRow';
import StatusBadge from '@/components/ui/StatusBadge';
import { TrainingStatus } from '@apex/shared';
import { summarizeSetStatuses } from '@/lib/progression';
import api, { ApiTodayWorkout, ApiExercisePrescription, ApiPendingProgression, ApiExercise } from '@/lib/api';
import ProgressionPromptBanner from '@/components/workout/ProgressionPromptBanner';
import ExerciseMetaBadges from '@/components/ui/ExerciseMetaBadges';
import ExercisePreviewModal from '@/components/ui/ExercisePreviewModal';

// ── Constants ──────────────────────────────────────────────────────────────────
const SET_DURATION = 45;
const REST_DURATION = 30;

// ── Types ──────────────────────────────────────────────────────────────────────
interface LoggedSet {
  setNumber: number;
  weight: number;
  reps: number;
  status: TrainingStatus;
}

interface WorkoutExercise {
  prescriptionId: string;
  exerciseId: string;
  name: string;
  muscleGroup: string;
  setCount: number;
  repMin: number;
  repMax: number;
  // Enriched metadata
  equipment?: string | null;
  bodyPart?: string | null;
  primaryMuscle?: string | null;
  movementPattern?: string | null;
  difficulty?: string | null;
}

interface ExerciseTimerState {
  phase: 'idle' | 'set' | 'rest' | 'done';
  currentSet: number;
  totalSets: number;
  secondsLeft: number;
  setDuration: number;
  restDuration: number;
}

interface TimerConfig {
  setMin: string;
  setSec: string;
  restMin: string;
  restSec: string;
}

type WorkoutState = 'idle' | 'active' | 'completed' | 'saving';
type WeightUnit = 'kg' | 'lb';

// ── Helpers ────────────────────────────────────────────────────────────────────
function parsePrescription(ep: ApiExercisePrescription): WorkoutExercise {
  const parts = ep.targetRepRange?.split('-').map(Number) ?? [8, 12];
  return {
    prescriptionId: ep.id,
    exerciseId: ep.exerciseId,
    name: ep.exercise.name,
    muscleGroup: ep.exercise.muscleGroup ?? '',
    setCount: 3,
    repMin: parts[0] ?? 8,
    repMax: parts[1] ?? parts[0] ?? 12,
    equipment: ep.exercise.equipment,
    bodyPart: ep.exercise.bodyPart,
    primaryMuscle: ep.exercise.primaryMuscle,
    movementPattern: ep.exercise.movementPattern,
    difficulty: ep.exercise.difficulty,
  };
}

// ── SVG circle countdown ───────────────────────────────────────────────────────
function CircleTimer({
  secondsLeft,
  total,
  color,
  size = 'md',
}: {
  secondsLeft: number;
  total: number;
  color: string;
  size?: 'md' | 'lg';
}) {
  const r = size === 'lg' ? 34 : 26;
  const sw = size === 'lg' ? 5 : 5;
  const dim = size === 'lg' ? 80 : 64;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, secondsLeft) / total);
  const sizeClass = size === 'lg' ? 'w-20 h-20' : 'w-16 h-16';
  return (
    <div className={`relative ${sizeClass} flex-shrink-0`}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${dim} ${dim}`}>
        <circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <circle
          cx={dim/2} cy={dim/2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.95s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-bold text-text-primary tabular-nums leading-none ${secondsLeft >= 60 ? 'text-xs' : 'text-base'}`}>
          {secondsLeft >= 60
            ? `${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60).toString().padStart(2, '0')}`
            : secondsLeft}
        </span>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function WorkoutPage() {
  const [todayWorkout, setTodayWorkout] = useState<ApiTodayWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [workoutState, setWorkoutState] = useState<WorkoutState>('idle');
  const [activeExerciseIdx, setActiveExerciseIdx] = useState(0);
  const [loggedSets, setLoggedSets] = useState<Record<string, LoggedSet[]>>({});
  const [weightUnits, setWeightUnits] = useState<Record<string, WeightUnit>>({});
  const [exerciseTimers, setExerciseTimers] = useState<Record<string, ExerciseTimerState>>({});
  const [pausedTimers, setPausedTimers] = useState<Record<string, boolean>>({});
  const pausedTimersRef = useRef<Record<string, boolean>>({});
  const [timerConfigs, setTimerConfigs] = useState<Record<string, TimerConfig>>({});
  const [initialWeights, setInitialWeights] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [notes, setNotes] = useState('');
  const [pendingProgressions, setPendingProgressions] = useState<ApiPendingProgression[]>([]);
  const [previewExercise, setPreviewExercise] = useState<ApiExercise | null>(null);
  // exerciseId → suggestedWeight (confirmed working weight)
  const [suggestedWeights, setSuggestedWeights] = useState<Record<string, number>>({});
  const [suggestedWeightUnits, setSuggestedWeightUnits] = useState<Record<string, string>>({});

  // Load today's workout + pending progressions
  useEffect(() => {
    api.workouts.today()
      .then((w) => {
        setTodayWorkout(w);
        if (w?.workoutDay?.exercisePrescriptions) {
          const parsed = w.workoutDay.exercisePrescriptions.map(parsePrescription);
          setExercises(parsed);

          // Batch fetch suggested weights for exercises in today's workout
          const exerciseIds = parsed.map((e) => e.exerciseId);
          if (exerciseIds.length > 0) {
            api.progression.suggestedWeights(exerciseIds)
              .then(({ weights }) => {
                const wMap: Record<string, number> = {};
                const uMap: Record<string, string> = {};
                for (const [exId, val] of Object.entries(weights)) {
                  wMap[exId] = val.suggestedWeight;
                  uMap[exId] = val.weightUnit;
                }
                setSuggestedWeights(wMap);
                setSuggestedWeightUnits(uMap);
                // Pre-fill initialWeights from suggestions (don't override user-entered values)
                setInitialWeights((prev) => {
                  const next = { ...prev };
                  for (const ex of parsed) {
                    if (!next[ex.prescriptionId] && wMap[ex.exerciseId] != null) {
                      next[ex.prescriptionId] = String(wMap[ex.exerciseId]);
                    }
                  }
                  return next;
                });
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch pending progressions independently
    api.progression.pending()
      .then(({ progressions }) => setPendingProgressions(progressions))
      .catch(() => {});
  }, []);

  // Global session timer
  useEffect(() => {
    if (workoutState !== 'active' || !startTime) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [workoutState, startTime]);

  // Per-exercise set/rest countdown timers
  useEffect(() => {
    if (workoutState !== 'active') return;
    const interval = setInterval(() => {
      setExerciseTimers((prev) => {
        const hasActive = Object.values(prev).some(
          (t) => t.phase === 'set' || t.phase === 'rest'
        );
        if (!hasActive) return prev;

        const next = { ...prev };
        for (const id of Object.keys(next)) {
          const t = next[id];
          if (t.phase !== 'set' && t.phase !== 'rest') continue;
          if (pausedTimersRef.current[id]) continue;

          if (t.secondsLeft > 1) {
            next[id] = { ...t, secondsLeft: t.secondsLeft - 1 };
          } else if (t.phase === 'set') {
            next[id] = { ...t, phase: 'rest', secondsLeft: t.restDuration };
          } else {
            const nextSet = t.currentSet + 1;
            if (nextSet > t.totalSets) {
              next[id] = { ...t, phase: 'done', secondsLeft: 0 };
            } else {
              next[id] = { ...t, phase: 'set', currentSet: nextSet, secondsLeft: t.setDuration };
            }
          }
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [workoutState]);

  function formatElapsed(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function startWorkout() {
    setWorkoutState('active');
    setStartTime(new Date());
    setLoggedSets({});
    setActiveExerciseIdx(0);
  }

  function togglePause(id: string) {
    const next = !pausedTimersRef.current[id];
    pausedTimersRef.current[id] = next;
    setPausedTimers((prev) => ({ ...prev, [id]: next }));
  }

  function toggleUnit(prescriptionId: string) {
    setWeightUnits((prev) => ({
      ...prev,
      [prescriptionId]: prev[prescriptionId] === 'lb' ? 'kg' : 'lb',
    }));
  }

  function resetTimer(id: string) {
    setExerciseTimers((prev) => {
      const t = prev[id];
      if (!t) return prev;
      return {
        ...prev,
        [id]: {
          ...t,
          secondsLeft: t.phase === 'set' ? t.setDuration : t.restDuration
        }
      };
    });
    // Ensure it is unpaused when reset
    pausedTimersRef.current[id] = false;
    setPausedTimers((prev) => ({ ...prev, [id]: false }));
  }

  function getTimerDurations(id: string): { setDuration: number; restDuration: number } {
    const cfg = timerConfigs[id];
    const setMin  = Math.max(0, parseInt(cfg?.setMin  || '0', 10) || 0);
    const setSec  = Math.max(0, parseInt(cfg?.setSec  || '0', 10) || 0);
    const restMin = Math.max(0, parseInt(cfg?.restMin || '0', 10) || 0);
    const restSec = Math.max(0, parseInt(cfg?.restSec || '0', 10) || 0);
    return {
      setDuration:  setMin  * 60 + setSec  || SET_DURATION,
      restDuration: restMin * 60 + restSec || REST_DURATION,
    };
  }

  function startExerciseTimer(prescriptionId: string, totalSets: number) {
    const { setDuration, restDuration } = getTimerDurations(prescriptionId);
    setExerciseTimers((prev) => ({
      ...prev,
      [prescriptionId]: {
        phase: 'set', currentSet: 1, totalSets,
        secondsLeft: setDuration, setDuration, restDuration,
      },
    }));
  }

  function handleSetComplete(
    exerciseId: string,
    setData: { setNumber: number; weight: number; reps: number; status: TrainingStatus }
  ) {
    setLoggedSets((prev) => {
      const existing = prev[exerciseId] ?? [];
      const filtered = existing.filter((s) => s.setNumber !== setData.setNumber);
      return { ...prev, [exerciseId]: [...filtered, setData] };
    });
  }

  function completeExercise(exIdx: number) {
    if (exIdx < exercises.length - 1) {
      setActiveExerciseIdx(exIdx + 1);
    }
  }

  function getOverallExerciseStatus(exerciseId: string): TrainingStatus | null {
    const sets = loggedSets[exerciseId] ?? [];
    if (sets.length === 0) return null;
    if (sets.some((s) => s.status === 'FAILED')) return 'FAILED';
    if (sets.every((s) => s.status === 'ACHIEVED')) return 'ACHIEVED';
    return 'PROGRESS';
  }

  const finishWorkout = useCallback(async () => {
    setWorkoutState('saving');

    const today = new Date().toISOString().split('T')[0];
    const workoutDayId = todayWorkout?.workoutDay?.id;
    const programId = todayWorkout?.assignment?.programId;
    const programWeekId = todayWorkout?.currentWeek?.id;

    const promises = exercises
      .filter((ex) => (loggedSets[ex.prescriptionId]?.length ?? 0) > 0)
      .map((ex) => {
        const sets = (loggedSets[ex.prescriptionId] ?? []).sort((a, b) => a.setNumber - b.setNumber);
        const unit = weightUnits[ex.prescriptionId] ?? 'kg';
        return api.trainingLog.log({
          exerciseId: ex.exerciseId,
          sessionDate: today,
          programId,
          programWeekId,
          workoutDayId,
          exercisePrescriptionId: ex.prescriptionId,
          weight: sets[0]?.weight,
          weightUnit: unit,
          set1Reps: sets[0]?.reps,
          set2Reps: sets[1]?.reps,
          set3Reps: sets[2]?.reps,
          set4Reps: sets[3]?.reps,
          notes: notes || undefined,
        }).catch(() => null);
      });

    await Promise.all(promises);
    setWorkoutState('completed');
  }, [exercises, loggedSets, weightUnits, notes, todayWorkout]);

  const totalSets = Object.values(loggedSets).flat().length;
  const allExerciseSets = Object.values(loggedSets).flat();
  const summary = summarizeSetStatuses(allExerciseSets);
  const totalPrescribedSets = exercises.reduce((s, e) => s + e.setCount, 0);
  const completionPct = totalPrescribedSets > 0 ? Math.round((totalSets / totalPrescribedSets) * 100) : 0;
  const dayName = todayWorkout?.workoutDay?.workoutType;
  const weekNumber = todayWorkout?.currentWeek?.weekNumber;

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-muted text-sm">Loading workout...</div>
      </div>
    );
  }

  // ── No workout today ──────────────────────────────────────────────────────────
  if (!todayWorkout || !todayWorkout.workoutDay) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-xl font-bold text-text-primary">Today&apos;s Workout</h2>
          <p className="text-text-muted text-sm mt-0.5">
            {todayWorkout?.message ?? 'No program assigned'}
          </p>
        </div>
        <Card elevated className="p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-surface-elevated flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-text-primary font-semibold">Rest Day</p>
          <p className="text-text-muted text-sm mt-1">
            {todayWorkout?.message ?? 'Assign a program from the Programs page to get started.'}
          </p>
        </Card>
      </div>
    );
  }

  // ── Idle ──────────────────────────────────────────────────────────────────────
  if (workoutState === 'idle') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-xl font-bold text-text-primary">Today&apos;s Workout</h2>
          <p className="text-text-muted text-sm mt-0.5">
            {dayName}{weekNumber ? ` · Week ${weekNumber}` : ''}
          </p>
        </div>

        {/* Progression prompts — shown when exercises from any recent session were achieved */}
        {pendingProgressions.length > 0 && (
          <ProgressionPromptBanner
            progressions={pendingProgressions}
            onUpdate={setPendingProgressions}
          />
        )}

        <Card elevated className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="font-heading text-lg font-semibold text-text-primary">{dayName}</h3>
              <p className="text-text-muted text-sm mt-0.5">
                {exercises.length} exercises · {totalPrescribedSets} sets
              </p>
            </div>
            <Button variant="primary" size="lg" onClick={startWorkout}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Workout
            </Button>
          </div>
          <div className="space-y-3">
            {exercises.map((ex, idx) => {
              const suggested = suggestedWeights[ex.exerciseId];
              const suggestedUnit = suggestedWeightUnits[ex.exerciseId];
              return (
                <div key={ex.prescriptionId} className="flex items-center justify-between p-4 bg-background rounded-card border border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-sm font-bold text-text-muted shadow-sm">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-base font-bold text-text-primary tracking-tight">{ex.name}</p>
                      <p className="text-sm font-medium text-text-muted mt-0.5">
                        {ex.setCount} sets · {ex.repMin}–{ex.repMax} reps
                        {suggested != null && (
                          <span className="ml-2 text-accent font-semibold">
                            · {suggested}{suggestedUnit ?? 'kg'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {ex.muscleGroup && (
                    <span className="text-sm font-medium text-text-muted px-3 py-1 rounded-md bg-surface-elevated">
                      {ex.muscleGroup}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  // ── Completed ─────────────────────────────────────────────────────────────────
  if (workoutState === 'completed') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="text-center space-y-3">
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10B981, #00C2FF)' }}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-heading text-3xl font-bold text-text-primary">Workout Complete!</h2>
          <p className="text-text-muted">{dayName} · {formatElapsed(elapsedSeconds)}</p>
        </div>
        <Card elevated className="p-6">
          <h3 className="section-title mb-4">Session Summary</h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="font-heading text-2xl font-bold text-text-primary">{totalSets}</p>
              <p className="text-xs text-text-muted mt-1">Total Sets</p>
            </div>
            <div className="text-center">
              <p className="font-heading text-2xl font-bold text-text-primary">{formatElapsed(elapsedSeconds)}</p>
              <p className="text-xs text-text-muted mt-1">Duration</p>
            </div>
            <div className="text-center">
              <p className="font-heading text-2xl font-bold text-text-primary">{completionPct}%</p>
              <p className="text-xs text-text-muted mt-1">Completion</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-card bg-success/[0.05] border border-success/10">
              <p className="text-lg font-bold text-success">{summary.achieved}</p>
              <p className="text-xs text-success/70 mt-0.5">Achieved</p>
            </div>
            <div className="text-center p-3 rounded-card bg-accent/[0.05] border border-accent/10">
              <p className="text-lg font-bold text-accent">{summary.progress}</p>
              <p className="text-xs text-accent/70 mt-0.5">Progress</p>
            </div>
            <div className="text-center p-3 rounded-card bg-danger/[0.05] border border-danger/10">
              <p className="text-lg font-bold text-danger">{summary.failed}</p>
              <p className="text-xs text-danger/70 mt-0.5">Failed</p>
            </div>
          </div>
        </Card>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => { setWorkoutState('idle'); setLoggedSets({}); }}>
            Back to Dashboard
          </Button>
          <Button variant="primary" fullWidth onClick={() => window.location.href = '/progress'}>
            View Progress
          </Button>
        </div>
      </div>
    );
  }

  // ── Active ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {previewExercise && (
        <ExercisePreviewModal
          exercise={previewExercise}
          onClose={() => setPreviewExercise(null)}
        />
      )}

      {/* Session header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm pb-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold text-text-primary">{dayName}</h2>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Live · {formatElapsed(elapsedSeconds)}
              </span>
              <span className="text-xs text-text-muted">{totalSets}/{totalPrescribedSets} sets</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">
              <span className="text-text-primary font-medium">{completionPct}%</span> done
            </span>
            <Button variant="primary" size="sm" onClick={finishWorkout} loading={workoutState === 'saving'}>
              Finish
            </Button>
          </div>
        </div>
        <div className="mt-3 h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent-secondary rounded-full transition-transform duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Exercise cards */}
      <div className="space-y-4">
        {exercises.map((exercise, exIdx) => {
          const exerciseSets = loggedSets[exercise.prescriptionId] ?? [];
          const isActive = exIdx === activeExerciseIdx;
          const exerciseComplete = exerciseSets.length >= exercise.setCount;
          const unit = weightUnits[exercise.prescriptionId] ?? 'kg';
          const timer = exerciseTimers[exercise.prescriptionId];
          const overallStatus = timer?.phase === 'done'
            ? getOverallExerciseStatus(exercise.prescriptionId)
            : null;

          return (
            <Card
              key={exercise.prescriptionId}
              elevated={isActive}
              className={`overflow-hidden transition-transform duration-200 ${
                exerciseComplete ? 'border-success/15' : isActive ? 'border-accent/20' : ''
              }`}
            >
              {/* ── Exercise header ─────────────────────────────────────── */}
              <button
                className={`w-full flex items-center justify-between p-5 text-left transition-colors ${isActive ? 'bg-white/[0.02]' : 'hover:bg-white/[0.02]'}`}
                onClick={() => setActiveExerciseIdx(isActive ? -1 : exIdx)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-sm ${
                    exerciseComplete ? 'bg-success text-white shadow-success/20' : 'bg-surface-elevated text-text-muted'
                  }`}>
                    {exerciseComplete
                      ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      : exIdx + 1
                    }
                  </div>
                  <div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const ep = todayWorkout?.workoutDay?.exercisePrescriptions?.find(
                          (p) => p.id === exercise.prescriptionId
                        );
                        if (ep?.exercise) setPreviewExercise(ep.exercise);
                      }}
                      className="text-left group/name"
                    >
                      <p className="font-bold text-text-primary text-lg tracking-tight group-hover/name:text-accent transition-colors">
                        {exercise.name}
                      </p>
                    </button>
                    <p className="text-sm text-text-muted mt-0.5 font-medium">
                      {exercise.setCount} sets · {exercise.repMin}–{exercise.repMax} reps
                    </p>
                    <ExerciseMetaBadges
                      exercise={exercise}
                      fields={['equipment', 'bodyPart', 'movementPattern']}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Live timer badge when collapsed */}
                  {!isActive && timer && timer.phase === 'set' && (
                    <span className="text-sm font-bold text-accent tabular-nums bg-accent/10 px-2.5 py-1 rounded-md">{timer.secondsLeft}s</span>
                  )}
                  {!isActive && timer && timer.phase === 'rest' && (
                    <span className="text-sm font-bold text-success tabular-nums bg-success/10 px-2.5 py-1 rounded-md">REST {timer.secondsLeft}s</span>
                  )}
                  {/* Timer Controls — shown when timer is running or paused */}
                  {isActive && (timer?.phase === 'set' || timer?.phase === 'rest') && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); resetTimer(exercise.prescriptionId); }}
                        className="w-14 h-14 rounded-full border border-white/[0.12] bg-white/[0.04] text-text-muted hover:border-white/20 hover:text-text-primary flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm"
                        title="Reset Timer"
                      >
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePause(exercise.prescriptionId); }}
                        className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-200 active:scale-95 ${
                          pausedTimers[exercise.prescriptionId]
                            ? 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 shadow-md shadow-accent/20'
                            : 'border-white/[0.15] bg-white/[0.06] text-text-primary hover:border-white/30 hover:bg-white/[0.08] shadow-md'
                        }`}
                        title={pausedTimers[exercise.prescriptionId] ? 'Resume' : 'Pause'}
                      >
                        {pausedTimers[exercise.prescriptionId] ? (
                          <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                  <span className="text-sm font-semibold text-text-muted bg-surface-elevated px-2.5 py-1 rounded-md">
                    {exerciseSets.length}/{exercise.setCount}
                  </span>
                  <div className={`w-8 h-8 flex flex-shrink-0 items-center justify-center rounded-full transition-colors ${isActive ? 'bg-white/5' : ''}`}>
                    <svg
                      className={`w-5 h-5 text-text-muted transition-transform duration-200 ${isActive ? 'rotate-180 text-text-primary' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* ── Expanded content ────────────────────────────────────── */}
              {isActive && (
                <div className="border-t border-white/[0.06]">

                  {/* Timer zone */}
                  <div className="px-4 py-4 border-b border-white/[0.04] bg-background/20">

                    {/* idle — weight + timer config + Start */}
                    {(!timer || timer.phase === 'idle') && (() => {
                      const id = exercise.prescriptionId;
                      const initVal = initialWeights[id] ?? '';
                      const cfg = timerConfigs[id] ?? { setMin: '', setSec: '', restMin: '', restSec: '' };
                      const canStart = initVal.trim() !== '' && parseFloat(initVal) > 0;

                      function updateCfg(field: keyof TimerConfig, val: string) {
                        setTimerConfigs((prev) => ({
                          ...prev,
                          [id]: { ...cfg, [field]: val },
                        }));
                      }

                      return (
                        <div className="space-y-4">
                          {/* Row 1: Weight + unit */}
                          <div>
                            <p className="text-xs text-text-muted font-medium mb-2">Starting weight</p>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={initVal}
                                onChange={(e) =>
                                  setInitialWeights((prev) => ({ ...prev, [id]: e.target.value }))
                                }
                                placeholder="e.g. 80"
                                className="w-28 bg-background text-text-primary text-sm border border-white/[0.08] rounded-[6px] px-3 py-2 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
                              />
                              {/* kg / lb toggle */}
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleUnit(id); }}
                                className="flex items-center rounded-[5px] border border-white/[0.08] overflow-hidden text-[10px] font-semibold"
                              >
                                <span className={`px-2 py-1.5 transition-colors duration-150 ${unit === 'kg' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}>kg</span>
                                <span className={`px-2 py-1.5 transition-colors duration-150 ${unit === 'lb' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}>lb</span>
                              </button>
                            </div>
                          </div>

                          {/* Row 2: Timer settings */}
                          <div className="grid grid-cols-2 gap-4">
                            {/* Set time */}
                            <div>
                              <p className="text-xs text-text-muted font-medium mb-2">Set time</p>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={cfg.setMin}
                                  onChange={(e) => updateCfg('setMin', e.target.value)}
                                  placeholder="0"
                                  className="w-14 bg-background text-text-primary text-sm text-center border border-white/[0.08] rounded-[6px] px-2 py-2 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
                                />
                                <span className="text-xs text-text-muted">min</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={cfg.setSec}
                                  onChange={(e) => updateCfg('setSec', e.target.value)}
                                  placeholder="45"
                                  className="w-14 bg-background text-text-primary text-sm text-center border border-white/[0.08] rounded-[6px] px-2 py-2 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
                                />
                                <span className="text-xs text-text-muted">sec</span>
                              </div>
                            </div>

                            {/* Rest time */}
                            <div>
                              <p className="text-xs text-text-muted font-medium mb-2">Rest time</p>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={cfg.restMin}
                                  onChange={(e) => updateCfg('restMin', e.target.value)}
                                  placeholder="0"
                                  className="w-14 bg-background text-text-primary text-sm text-center border border-white/[0.08] rounded-[6px] px-2 py-2 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
                                />
                                <span className="text-xs text-text-muted">min</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={cfg.restSec}
                                  onChange={(e) => updateCfg('restSec', e.target.value)}
                                  placeholder="30"
                                  className="w-14 bg-background text-text-primary text-sm text-center border border-white/[0.08] rounded-[6px] px-2 py-2 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
                                />
                                <span className="text-xs text-text-muted">sec</span>
                              </div>
                            </div>
                          </div>

                          {/* Start button */}
                          <div>
                            <button
                              disabled={!canStart}
                              onClick={() => startExerciseTimer(id, exercise.setCount)}
                              className={`flex items-center gap-2 px-5 py-2 rounded-card border text-sm font-semibold transition-colors duration-150 active:scale-95 ${
                                canStart
                                  ? 'border-accent/30 bg-accent/[0.08] text-accent hover:bg-accent/[0.15]'
                                  : 'border-white/[0.06] bg-transparent text-text-muted cursor-not-allowed'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Start
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* set phase */}
                    {timer?.phase === 'set' && (
                      <div className="py-2">
                        <div className="flex items-center gap-6">
                          <CircleTimer secondsLeft={timer.secondsLeft} total={timer.setDuration} color="#00C2FF" size="lg" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
                              SET {timer.currentSet} OF {timer.totalSets}
                              {pausedTimers[exercise.prescriptionId] && (
                                <span className="ml-2 text-accent/70">· PAUSED</span>
                              )}
                            </p>
                            <p className="font-heading font-black leading-none text-5xl text-text-primary tracking-tight">
                              {exercise.repMin}<span className="text-text-muted/40">–</span>{exercise.repMax}
                            </p>
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mt-1.5">reps</p>
                            <div className="mt-3 h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(timer.secondsLeft / timer.setDuration) * 100}%`,
                                  transition: 'width 0.95s linear',
                                  background: 'linear-gradient(90deg, #00C2FF, #818CF8)',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* rest phase */}
                    {timer?.phase === 'rest' && (
                      <div className="py-2">
                        <div className="flex items-center gap-6">
                          <CircleTimer secondsLeft={timer.secondsLeft} total={timer.restDuration} color="#10B981" size="lg" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
                              REST
                              {pausedTimers[exercise.prescriptionId] && (
                                <span className="ml-2 text-accent/70">· PAUSED</span>
                              )}
                            </p>
                            <p className="font-heading font-black leading-none text-5xl text-success tracking-tight">
                              {timer.secondsLeft}<span className="text-2xl font-semibold text-success/60 ml-1">s</span>
                            </p>
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mt-1.5">
                              {timer.currentSet < timer.totalSets
                                ? `Next · Set ${timer.currentSet + 1} of ${timer.totalSets}`
                                : 'Last set done · Log reps below'}
                            </p>
                            <div className="mt-3 h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(timer.secondsLeft / timer.restDuration) * 100}%`,
                                  transition: 'width 0.95s linear',
                                  background: 'linear-gradient(90deg, #10B981, #00C2FF)',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* done phase */}
                    {timer?.phase === 'done' && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">All sets complete</p>
                          <p className="text-xs text-text-muted mt-0.5">Enter your reps below, then press Complete</p>
                        </div>
                        {overallStatus && <StatusBadge status={overallStatus} size="md" />}
                      </div>
                    )}
                  </div>

                  {/* Column headers + set rows — only shown in done phase */}
                  {timer?.phase === 'done' && (
                    <>
                      <div className="flex items-center gap-3 px-4 py-2 bg-background/50">
                        <span className="text-xs text-text-muted font-medium w-20 flex-shrink-0">Set</span>
                        <span className="text-xs text-text-muted font-medium flex-1">
                          Weight <span className="opacity-60">({unit})</span>
                        </span>
                        <span className="text-xs text-text-muted font-medium flex-1">Reps</span>
                        <span className="text-xs text-text-muted font-medium w-20 text-center flex-shrink-0">Status</span>
                        <span className="w-7 flex-shrink-0" />
                      </div>

                      <div className="p-3 space-y-2">
                        {Array.from({ length: exercise.setCount }).map((_, setIdx) => {
                          const setNum = setIdx + 1;
                          const completedSet = exerciseSets.find((s) => s.setNumber === setNum);
                          return (
                            <SetRow
                              key={setNum}
                              setNumber={setNum}
                              repMin={exercise.repMin}
                              repMax={exercise.repMax}
                              weightUnit={unit}
                              isCurrentSet={false}
                              suggestedWeight={
                                initialWeights[exercise.prescriptionId]
                                  ? parseFloat(initialWeights[exercise.prescriptionId])
                                  : undefined
                              }
                              completed={!!completedSet}
                              completedData={completedSet}
                              onSetComplete={(data) => handleSetComplete(exercise.prescriptionId, data)}
                            />
                          );
                        })}
                      </div>

                      {/* Complete button */}
                      <div className="px-3 pb-3">
                        <button
                          onClick={() => completeExercise(exIdx)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-card border border-success/30 bg-success/[0.06] text-success text-sm font-semibold hover:bg-success/[0.12] transition-colors duration-150 active:scale-95"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {exIdx < exercises.length - 1
                            ? `Complete · Next: ${exercises[exIdx + 1].name}`
                            : 'Complete · Finish Workout'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Notes + Finish */}
      <Card className="p-4">
        <label className="label block mb-2">Session Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did the workout feel?"
          rows={3}
          className="input-dark resize-none mb-3"
        />
        <Button
          variant="primary"
          fullWidth
          onClick={finishWorkout}
          disabled={totalSets === 0}
          loading={workoutState === 'saving'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Finish Workout ({totalSets} sets logged)
        </Button>
      </Card>
    </div>
  );
}
