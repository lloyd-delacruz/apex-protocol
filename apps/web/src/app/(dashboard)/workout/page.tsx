'use client';

import { useState, useEffect, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SetRow from '@/components/workout/SetRow';
import StatusBadge from '@/components/ui/StatusBadge';
import { TrainingStatus } from '@apex/shared';
import { calculateStatus, summarizeSetStatuses } from '@/lib/progression';
import api, { ApiTodayWorkout, ApiExercisePrescription } from '@/lib/api';

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
}

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
  };
}

type WorkoutState = 'idle' | 'active' | 'completed' | 'saving';
type WeightUnit = 'kg' | 'lb';

export default function WorkoutPage() {
  const [todayWorkout, setTodayWorkout] = useState<ApiTodayWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [workoutState, setWorkoutState] = useState<WorkoutState>('idle');
  const [activeExerciseIdx, setActiveExerciseIdx] = useState(0);
  const [loggedSets, setLoggedSets] = useState<Record<string, LoggedSet[]>>({});
  const [weightUnits, setWeightUnits] = useState<Record<string, WeightUnit>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [notes, setNotes] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    api.workouts.today()
      .then((w) => {
        setTodayWorkout(w);
        if (w?.workoutDay?.exercisePrescriptions) {
          setExercises(w.workoutDay.exercisePrescriptions.map(parsePrescription));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Timer
  useEffect(() => {
    if (workoutState !== 'active' || !startTime) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [workoutState, startTime]);

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

  function toggleUnit(prescriptionId: string) {
    setWeightUnits((prev) => ({
      ...prev,
      [prescriptionId]: prev[prescriptionId] === 'lb' ? 'kg' : 'lb',
    }));
  }

  function handleSetComplete(exerciseId: string, setData: { setNumber: number; weight: number; reps: number; status: TrainingStatus }) {
    setLoggedSets((prev) => {
      const existing = prev[exerciseId] ?? [];
      const filtered = existing.filter((s) => s.setNumber !== setData.setNumber);
      return { ...prev, [exerciseId]: [...filtered, setData] };
    });
  }

  const finishWorkout = useCallback(async () => {
    setWorkoutState('saving');
    setSaveError(null);

    const today = new Date().toISOString().split('T')[0];
    const workoutDayId = todayWorkout?.workoutDay?.id;
    const programId = todayWorkout?.assignment?.programId;
    const programWeekId = todayWorkout?.currentWeek?.id;

    const promises = exercises
      .filter((ex) => (loggedSets[ex.prescriptionId]?.length ?? 0) > 0)
      .map((ex) => {
        const sets = (loggedSets[ex.prescriptionId] ?? []).sort((a, b) => a.setNumber - b.setNumber);
        const firstWeight = sets[0]?.weight;
        const unit = weightUnits[ex.prescriptionId] ?? 'kg';
        return api.trainingLog.log({
          exerciseId: ex.exerciseId,
          sessionDate: today,
          programId,
          programWeekId,
          workoutDayId,
          exercisePrescriptionId: ex.prescriptionId,
          weight: firstWeight,
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

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-muted text-sm">Loading workout...</div>
      </div>
    );
  }

  // ── No workout today ──────────────────────────────────────────────────────
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

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (workoutState === 'idle') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-xl font-bold text-text-primary">Today&apos;s Workout</h2>
          <p className="text-text-muted text-sm mt-0.5">
            {dayName}{weekNumber ? ` · Week ${weekNumber}` : ''}
          </p>
        </div>

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

          <div className="space-y-2">
            {exercises.map((ex, idx) => (
              <div key={ex.prescriptionId} className="flex items-center justify-between p-3 bg-background rounded-card border border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-surface-elevated flex items-center justify-center text-xs font-bold text-text-muted">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{ex.name}</p>
                    <p className="text-xs text-text-muted">
                      {ex.setCount} sets · {ex.repMin}–{ex.repMax} reps
                    </p>
                  </div>
                </div>
                {ex.muscleGroup && (
                  <span className="text-xs text-text-muted px-2 py-0.5 rounded bg-surface-elevated">{ex.muscleGroup}</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // ── Completed ─────────────────────────────────────────────────────────────
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

          <div className="grid grid-cols-3 gap-3 mb-4">
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

          {saveError && (
            <p className="text-xs text-danger text-center">{saveError}</p>
          )}
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

  // ── Active ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Active workout header */}
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
            <div className="text-xs text-text-muted text-right">
              <span className="text-text-primary font-medium">{completionPct}%</span> done
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={finishWorkout}
              loading={workoutState === 'saving'}
            >
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

          return (
            <Card
              key={exercise.prescriptionId}
              elevated={isActive}
              className={`overflow-hidden transition-transform duration-200 ${
                exerciseComplete ? 'border-success/15' : isActive ? 'border-accent/20' : ''
              }`}
            >
              {/* Exercise header */}
              <button
                className="w-full flex items-center justify-between p-4 text-left"
                onClick={() => setActiveExerciseIdx(isActive ? -1 : exIdx)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    exerciseComplete ? 'bg-success text-white' : 'bg-surface-elevated text-text-muted'
                  }`}>
                    {exerciseComplete
                      ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      : exIdx + 1
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">{exercise.name}</p>
                    <p className="text-xs text-text-muted">
                      {exercise.setCount} sets · {exercise.repMin}–{exercise.repMax} reps
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">{exerciseSets.length}/{exercise.setCount}</span>
                  <svg
                    className={`w-4 h-4 text-text-muted transition-transform ${isActive ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Sets */}
              {isActive && (
                <div className="border-t border-white/[0.06]">
                  {/* Column labels + unit toggle */}
                  <div className="flex items-center justify-between px-4 py-2 bg-background/50">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xs text-text-muted font-medium w-20">Set</span>
                      <span className="text-xs text-text-muted font-medium flex-1">Weight</span>
                      <span className="text-xs text-text-muted font-medium flex-1">Reps</span>
                      <span className="text-xs text-text-muted font-medium w-20 text-center">Status</span>
                      <span className="w-7" />
                    </div>
                    {/* lb / kg toggle */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleUnit(exercise.prescriptionId); }}
                      className="ml-3 flex items-center gap-0 rounded-[6px] border border-white/[0.08] overflow-hidden text-[10px] font-semibold flex-shrink-0"
                    >
                      <span className={`px-2 py-1 transition-colors duration-150 ${unit === 'kg' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}>
                        kg
                      </span>
                      <span className={`px-2 py-1 transition-colors duration-150 ${unit === 'lb' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}>
                        lb
                      </span>
                    </button>
                  </div>

                  {/* Set rows */}
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
                          completed={!!completedSet}
                          completedData={completedSet}
                          onSetComplete={(data) => {
                            handleSetComplete(exercise.prescriptionId, data);
                            if (setNum === exercise.setCount) {
                              setTimeout(() => {
                                if (exIdx < exercises.length - 1) {
                                  setActiveExerciseIdx(exIdx + 1);
                                }
                              }, 400);
                            }
                          }}
                        />
                      );
                    })}
                  </div>
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
