'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Play,
  ChevronRight,
  Activity,
  Plus,
  Clock,
  Flame,
  Zap,
  MoreVertical
} from 'lucide-react';
import Button from '@/components/ui/Button';
import api, { ApiTodayWorkout, ApiExercise, ApiPendingProgression } from '@/lib/api';
import ExerciseLibrary from '@/components/workout/ExerciseLibrary';
import ActiveSetLogger from '@/components/workout/ActiveSetLogger';
import RestTimer from '@/components/workout/RestTimer';
import WorkoutExerciseCard from '@/components/workout/WorkoutExerciseCard';
import FinishWorkoutModal from '@/components/workout/FinishWorkoutModal';
import ProgressionPromptBanner from '@/components/workout/ProgressionPromptBanner';
import ExerciseOptionsBottomSheet from '@/components/workout/ExerciseOptionsBottomSheet';
import WorkoutSummary from '@/components/workout/WorkoutSummary';

// ── Types ──────────────────────────────────────────────────────────────────────
type WorkoutState = 'idle' | 'active' | 'saving' | 'completed' | 'streak';

interface LoggedSet {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  status: 'ACHIEVED' | 'PROGRESS' | 'FAILED';
  type: 'warmup' | 'working';
}

export default function WorkoutPage() {
  const router = useRouter();
  const [workoutState, setWorkoutState] = useState<WorkoutState>('idle');
  const [todayWorkout, setTodayWorkout] = useState<ApiTodayWorkout | null>(null);
  const [loading, setLoading] = useState(true);

  // Session State
  const [exercises, setExercises] = useState<any[]>([]);
  const [loggedSets, setLoggedSets] = useState<Record<string, LoggedSet[]>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  // Maps prescriptionId (or custom-* key) → workout_session_exercise.id
  const [sessionExerciseIds, setSessionExerciseIds] = useState<Record<string, string>>({});

  // UI State
  const [activeExerciseIdx, setActiveExerciseIdx] = useState<number | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showLogger, setShowLogger] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOptionsIdx, setSelectedOptionsIdx] = useState<number | null>(null);
  // When non-null, library is in replace mode for this exercise index
  const [replaceIdx, setReplaceIdx] = useState<number | null>(null);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [pendingProgressions, setPendingProgressions] = useState<ApiPendingProgression[]>([]);
  const [restDuration, setRestDuration] = useState(90);

  // Load Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [w, p] = await Promise.all([
          api.workouts.today(),
          api.progression.pending()
        ]);
        setTodayWorkout(w);
        setPendingProgressions(p.progressions || []);
        
        if (w?.workoutDay?.exercisePrescriptions) {
          setExercises(w.workoutDay.exercisePrescriptions.map(ep => ({
            prescriptionId: ep.id,
            exerciseId: ep.exerciseId,
            name: ep.exercise.name,
            muscleGroup: ep.exercise.muscleGroup || '',
            primaryMuscle: ep.exercise.primaryMuscle,
            setCount: 3,
            repMin: parseInt(ep.targetRepRange?.split('-')[0] || '8'),
            repMax: parseInt(ep.targetRepRange?.split('-')[1] || '12'),
            mediaUrl: ep.exercise.mediaUrl,
            equipment: ep.exercise.equipment
          })));
        }
      } catch (err) {
        console.error('Failed to load workout data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Timer Effect
  useEffect(() => {
    if (workoutState === 'active' && startTime) {
      const interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [workoutState, startTime]);

  // Actions
  const startWorkout = async () => {
    setWorkoutState('active');
    setStartTime(new Date());

    try {
      const result = await api.workouts.startSession(todayWorkout?.workoutDay?.id);
      if (result?.session?.id) {
        setSessionId(result.session.id);
        // Build prescriptionId → sessionExerciseId map for set logging
        const idMap: Record<string, string> = {};
        (result.sessionExercises ?? []).forEach((se: any) => {
          if (se.workoutExerciseId) idMap[se.workoutExerciseId] = se.id;
        });
        setSessionExerciseIds(idMap);
      }
    } catch (err) {
      console.error('Failed to start session on backend', err);
    }
  };

  const handleFinishWorkout = async () => {
    setWorkoutState('saving');
    const today = new Date().toISOString().split('T')[0];
    const workoutDayId = todayWorkout?.workoutDay?.id;
    const programId = todayWorkout?.assignment?.programId;
    const programWeekId = todayWorkout?.currentWeek?.id;

    const logPromises = exercises
      .filter(ex => (loggedSets[ex.prescriptionId]?.length ?? 0) > 0)
      .map(ex => {
        const workingSets = (loggedSets[ex.prescriptionId] ?? [])
          .filter((s: LoggedSet) => s.type === 'working')
          .sort((a: LoggedSet, b: LoggedSet) => a.setNumber - b.setNumber);
        if (workingSets.length === 0) return Promise.resolve(null);
        const isCustom = String(ex.prescriptionId).startsWith('custom-');
        return api.trainingLog.log({
          exerciseId: ex.exerciseId,
          sessionDate: today,
          programId,
          programWeekId,
          workoutDayId,
          exercisePrescriptionId: isCustom ? undefined : ex.prescriptionId,
          weight: workingSets[0]?.weight,
          weightUnit: 'kg',
          set1Reps: workingSets[0]?.reps,
          set2Reps: workingSets[1]?.reps,
          set3Reps: workingSets[2]?.reps,
          set4Reps: workingSets[3]?.reps,
        }).catch(() => null);
      });

    await Promise.all(logPromises);
    
    // STEP 15: Finish session on backend
    if (sessionId) {
      try {
        await api.workouts.finishSession(sessionId);
      } catch (err) {
        console.error('Failed to finish session on backend', err);
      }
    }
    
    setWorkoutState('completed');
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    const newExs = [...exercises];
    [newExs[idx - 1], newExs[idx]] = [newExs[idx], newExs[idx - 1]];
    setExercises(newExs);
  };

  const handleMoveDown = (idx: number) => {
    if (idx === exercises.length - 1) return;
    const newExs = [...exercises];
    [newExs[idx + 1], newExs[idx]] = [newExs[idx], newExs[idx + 1]];
    setExercises(newExs);
  };

  const handleLibrarySelect = async (newExs: ApiExercise[]) => {
    if (replaceIdx !== null) {
      // Replace mode: swap the exercise at replaceIdx
      const oldEx = exercises[replaceIdx];
      const newEx = newExs[0];
      const updated = [...exercises];
      updated[replaceIdx] = {
        ...oldEx,
        exerciseId: newEx.id,
        name: newEx.name,
        muscleGroup: newEx.muscleGroup || '',
        primaryMuscle: newEx.primaryMuscle,
        mediaUrl: newEx.mediaUrl,
        equipment: newEx.equipment,
      };
      setExercises(updated);

      // Persist replacement to backend
      const sessionExerciseId = sessionExerciseIds[oldEx.prescriptionId];
      if (sessionExerciseId) {
        try {
          await api.workouts.updateSessionExercise(sessionExerciseId, newEx.id);
        } catch (err) {
          console.error('Failed to update session exercise', err);
        }
      }
      setReplaceIdx(null);
    } else {
      // Add mode: append new exercises
      const mapped = newExs.map(ex => ({
        prescriptionId: `custom-${ex.id}-${Date.now()}`,
        exerciseId: ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup || '',
        primaryMuscle: ex.primaryMuscle,
        setCount: 3,
        repMin: 8,
        repMax: 12,
        mediaUrl: ex.mediaUrl,
        equipment: ex.equipment,
      }));
      setExercises(prev => [...prev, ...mapped]);

      // Register custom exercises in the session
      if (sessionId) {
        for (let i = 0; i < mapped.length; i++) {
          const ex = mapped[i];
          try {
            const se = await api.workouts.addSessionExercise(
              sessionId,
              ex.exerciseId,
              exercises.length + i
            );
            if (se?.id) {
              setSessionExerciseIds(prev => ({ ...prev, [ex.prescriptionId]: se.id }));
            }
          } catch (err) {
            console.error('Failed to add session exercise', err);
          }
        }
      }
    }
    setShowLibrary(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalVolume = useMemo(() => {
    return Object.values(loggedSets).flat().reduce((sum, set) => sum + (set.weight * set.reps), 0);
  }, [loggedSets]);

  const totalSets = useMemo(() => {
    return Object.values(loggedSets).flat().filter(s => s.type === 'working').length;
  }, [loggedSets]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
      <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Assembling Protocol...</span>
    </div>
  );

  // ── Idle State (Day Overview) ──────────────────────────────────────────────
  if (workoutState === 'idle') {
    const workoutName = todayWorkout?.workoutDay?.workoutType || 'Strength Day';
    const uniqueMuscles = [...new Set(exercises.map(ex => ex.muscleGroup).filter(Boolean))].length;
    const weekNum = todayWorkout?.currentWeek?.absoluteWeekNumber || 1;
    const phaseNum = Math.ceil(weekNum / 4);

    return (
      <div className="max-w-xl mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 pt-6 px-1 mb-6">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-xs font-black shrink-0">
            LD
          </div>
          <button className="flex items-center gap-1 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors">
            My Plan <ChevronRight size={14} />
          </button>
        </div>

        {/* Workout Header Card */}
        <div className="bg-surface-elevated border border-white/[0.08] rounded-3xl p-5 mb-5">
          {/* Title row */}
          <div className="flex items-center gap-3 mb-2">
            <h1 className="flex-1 text-3xl font-black italic text-text-primary leading-none truncate">
              {workoutName}
            </h1>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-text-muted hover:text-text-primary text-xs font-bold transition-colors">
              <span className="rotate-90 inline-block">⇄</span> Swap
            </button>
            <button className="p-1 text-text-muted hover:text-text-primary transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>

          {/* Subtitle */}
          <p className="text-sm text-text-muted font-medium mb-4">
            {exercises.length} Exercise{exercises.length !== 1 ? 's' : ''} · {uniqueMuscles || 1} Muscle{uniqueMuscles !== 1 ? 's' : ''}
          </p>

          {/* Filter chips */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-text-muted text-xs font-bold hover:border-accent/40 transition-colors">
              <Clock size={12} /> 1h 15m <ChevronRight size={10} className="rotate-90" />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-text-muted text-xs font-bold hover:border-accent/40 transition-colors">
              Equipment <ChevronRight size={10} className="rotate-90" />
            </button>
          </div>
        </div>

        {pendingProgressions.length > 0 && (
          <div className="mb-5">
            <ProgressionPromptBanner
              progressions={pendingProgressions}
              onUpdate={setPendingProgressions}
            />
          </div>
        )}

        {/* Exercise List */}
        <div className="space-y-0">
          {exercises.map((ex, i) => (
            <div key={ex.prescriptionId} className="relative">
              {/* Vertical connector line */}
              {i < exercises.length - 1 && (
                <div className="absolute left-[28px] top-[72px] w-px h-6 bg-white/[0.08] z-10" />
              )}
              <div className="flex items-center gap-3 py-3 group">
                {/* Split thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex border border-white/[0.06]">
                  <div className="flex-1 bg-black/30 overflow-hidden">
                    {ex.mediaUrl ? (
                      <img src={ex.mediaUrl} alt={ex.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-elevated">
                        <Activity size={16} className="text-text-muted/40" />
                      </div>
                    )}
                  </div>
                  <div className="w-px bg-white/[0.06]" />
                  <div className="flex-1 flex items-center justify-center bg-surface-elevated">
                    <div className="text-text-muted/20 text-center">
                      <Activity size={16} />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {i === 0 && (
                    <p className="text-[10px] font-black text-warning uppercase tracking-widest mb-0.5">FOCUS EXERCISE</p>
                  )}
                  <h4 className="text-sm font-bold text-text-primary truncate">{ex.name}</h4>
                  <p className="text-xs text-text-muted mt-0.5">
                    {ex.setCount} sets · {ex.repMin}-{ex.repMax} reps
                    {(ex as any).suggestedWeight ? ` · ${(ex as any).suggestedWeight} lb` : ''}
                  </p>
                </div>

                {/* Options */}
                <button
                  onClick={() => { setSelectedOptionsIdx(i); setShowOptions(true); }}
                  className="p-1.5 text-text-muted hover:text-text-primary transition-colors opacity-60 group-hover:opacity-100"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          ))}

          {/* Add Exercise */}
          <button
            onClick={() => setShowLibrary(true)}
            className="flex items-center gap-3 py-4 w-full text-left group"
          >
            <div className="w-14 h-14 rounded-xl border-2 border-dashed border-accent/30 flex items-center justify-center group-hover:border-accent transition-colors shrink-0">
              <Plus size={20} className="text-accent/60 group-hover:text-accent transition-colors" />
            </div>
            <span className="text-sm font-bold text-accent/70 group-hover:text-accent transition-colors">Add Exercise</span>
          </button>
        </div>

        {/* Sticky Start Workout */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/95 to-transparent z-40 pointer-events-none">
          <div className="max-w-xl mx-auto pointer-events-auto">
            <Button
              variant="primary"
              fullWidth
              className="h-16 rounded-2xl font-black text-lg italic tracking-tight shadow-[0_0_30px_rgba(var(--accent-rgb),0.25)]"
              onClick={startWorkout}
            >
              <Play size={22} fill="currentColor" className="mr-2" />
              Start Workout
            </Button>
          </div>
        </div>

        {/* Exercise options sheet */}
        <ExerciseOptionsBottomSheet
          isOpen={showOptions}
          onClose={() => setShowOptions(false)}
          exerciseName={selectedOptionsIdx !== null ? exercises[selectedOptionsIdx]?.name ?? '' : ''}
          onReplace={() => {
            setReplaceIdx(selectedOptionsIdx);
            setShowOptions(false);
            setShowLibrary(true);
          }}
          onRemove={() => {
            if (selectedOptionsIdx !== null) {
              setExercises(prev => prev.filter((_, i) => i !== selectedOptionsIdx));
              setShowOptions(false);
            }
          }}
          onMove={(direction) => {
            if (selectedOptionsIdx !== null) {
              if (direction === 'up') handleMoveUp(selectedOptionsIdx);
              else handleMoveDown(selectedOptionsIdx);
              setShowOptions(false);
            }
          }}
          onTogglePreference={(pref) => {
            console.log('Pref toggled:', pref);
            setShowOptions(false);
          }}
        />

        <ExerciseLibrary
          isOpen={showLibrary}
          onClose={() => { setShowLibrary(false); setReplaceIdx(null); }}
          onSelect={handleLibrarySelect}
        />
      </div>
    );
  }

  // ── Active State ─────────────────────────────────────────────────────────────
  if (workoutState === 'active' || workoutState === 'saving') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-32 animate-in slide-in-from-bottom duration-500">
        {/* Active Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/[0.06] -mx-4 px-6 py-4 flex items-center justify-between">
           <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-0.5">
                 <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                 <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Protocol Active</span>
              </div>
              <h2 className="text-xl font-black text-text-primary uppercase italic tracking-tighter tabular-nums line-clamp-1">
                 {formatTime(elapsedSeconds)} <span className="text-text-muted text-sm font-bold uppercase tracking-widest not-italic ml-2">Elapsed</span>
              </h2>
           </div>
           
           <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowLibrary(true)}
                className="w-12 h-12 rounded-2xl bg-surface-elevated flex items-center justify-center text-text-primary hover:bg-white/10 transition-colors"
                title="Add Exercise"
              >
                <Plus size={20} />
              </button>
              <Button 
                variant="primary" 
                size="sm" 
                className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest"
                onClick={() => setShowFinishModal(true)}
                loading={workoutState === 'saving'}
              >
                Finish
              </Button>
           </div>
        </div>

        {/* Mini Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
           <div className="p-4 rounded-3xl bg-surface-elevated border border-white/[0.04] flex flex-col items-center">
              <Flame size={18} className="text-orange-500 mb-1" />
              <span className="text-sm font-black text-text-primary tabular-nums">{totalVolume}kg</span>
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Volume</span>
           </div>
           <div className="p-4 rounded-3xl bg-surface-elevated border border-white/[0.04] flex flex-col items-center">
              <Zap size={18} className="text-yellow-500 mb-1" />
              <span className="text-sm font-black text-text-primary tabular-nums">{totalSets}</span>
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Sets</span>
           </div>
           <div className="p-4 rounded-3xl bg-surface-elevated border border-white/[0.04] flex flex-col items-center">
              <Activity size={18} className="text-accent mb-1" />
              <span className="text-sm font-black text-text-primary tabular-nums">{Math.round(((totalSets || 0) / (exercises.length * 3 || 1)) * 100)}%</span>
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Done</span>
           </div>
        </div>

        {/* Exercise List */}
        <div className="space-y-4">
           {exercises.map((ex, idx) => (
              <WorkoutExerciseCard 
                key={ex.prescriptionId}
                exercise={ex}
                isActive={activeExerciseIdx === idx}
                loggedSets={loggedSets[ex.prescriptionId] || []}
                onActivate={() => setActiveExerciseIdx(activeExerciseIdx === idx ? null : idx)}
                onLog={() => {
                   setActiveExerciseIdx(idx);
                   setShowLogger(true);
                }}
                onOptions={() => {
                   setSelectedOptionsIdx(idx);
                   setShowOptions(true);
                }}
              />
           ))}
        </div>

        {/* Floating Modals */}
        <ExerciseLibrary
          isOpen={showLibrary}
          onClose={() => { setShowLibrary(false); setReplaceIdx(null); }}
          onSelect={handleLibrarySelect}
        />

        <ExerciseOptionsBottomSheet 
          isOpen={showOptions}
          onClose={() => setShowOptions(false)}
          exerciseName={selectedOptionsIdx !== null ? exercises[selectedOptionsIdx].name : ''}
          onReplace={() => {
             setReplaceIdx(selectedOptionsIdx);
             setShowOptions(false);
             setShowLibrary(true);
          }}
          onRemove={() => {
             if (selectedOptionsIdx !== null) {
                setExercises(prev => prev.filter((_, i) => i !== selectedOptionsIdx));
                setShowOptions(false);
             }
          }}
          onMove={(direction) => {
             if (selectedOptionsIdx !== null) {
                if (direction === 'up') handleMoveUp(selectedOptionsIdx);
                else handleMoveDown(selectedOptionsIdx);
                setShowOptions(false);
             }
          }}
          onTogglePreference={(pref) => {
             console.log('Pref toggled:', pref);
             setShowOptions(false);
          }}
        />

        {activeExerciseIdx !== null && (
          <>
            <ActiveSetLogger
              isOpen={showLogger}
              onClose={() => setShowLogger(false)}
              exercise={exercises[activeExerciseIdx]}
              onLogSet={async (set) => {
                const ex = exercises[activeExerciseIdx];
                const localId = Math.random().toString();
                setLoggedSets(prev => ({
                  ...prev,
                  [ex.prescriptionId]: [
                    ...(prev[ex.prescriptionId] || []),
                    { ...set, id: localId } as any,
                  ],
                }));
                if (set.completed) {
                  setShowLogger(false);
                  setShowRestTimer(true);
                }
                // Persist to backend
                const sessionExerciseId = sessionExerciseIds[ex.prescriptionId];
                if (sessionExerciseId) {
                  const existingSets = loggedSets[ex.prescriptionId] ?? [];
                  try {
                    await api.workouts.logSet(sessionExerciseId, {
                      setType: set.type === 'warmup' ? 'warmup' : 'working',
                      setOrder: existingSets.length,
                      actualReps: set.actualReps ?? undefined,
                      actualWeight: set.actualWeight ?? undefined,
                      unit: 'kg',
                      completed: set.completed ?? true,
                    });
                  } catch (err) {
                    console.error('Failed to log set', err);
                  }
                }
              }}
              onLogAll={async (sets) => {
                const ex = exercises[activeExerciseIdx];
                setLoggedSets(prev => ({
                  ...prev,
                  [ex.prescriptionId]: sets.map(s => ({ ...s, id: Math.random().toString() } as any)),
                }));
                setShowLogger(false);
                setShowRestTimer(true);
                // Persist all sets to backend
                const sessionExerciseId = sessionExerciseIds[ex.prescriptionId];
                if (sessionExerciseId) {
                  for (let i = 0; i < sets.length; i++) {
                    const s = sets[i];
                    try {
                      await api.workouts.logSet(sessionExerciseId, {
                        setType: s.type === 'warmup' ? 'warmup' : 'working',
                        setOrder: i,
                        actualReps: s.actualReps ?? undefined,
                        actualWeight: s.actualWeight ?? undefined,
                        unit: 'kg',
                        completed: true,
                      });
                    } catch (err) {
                      console.error('Failed to log set', err);
                    }
                  }
                }
              }}
              initialSets={loggedSets[exercises[activeExerciseIdx].prescriptionId] as any[]}
            />
            
            <RestTimer 
              isOpen={showRestTimer}
              duration={restDuration}
              onFinished={() => setShowRestTimer(false)}
              onClose={() => setShowRestTimer(false)}
            />
          </>
        )}

        <FinishWorkoutModal 
          isOpen={showFinishModal}
          onClose={() => setShowFinishModal(false)}
          onConfirm={handleFinishWorkout}
          stats={{
            duration: formatTime(elapsedSeconds),
            exercises: exercises.length,
            sets: totalSets,
            volume: totalVolume
          }}
        />
      </div>
    );
  }

  // ── Completed State ─────────────────────────────────────────────────────────────
  if (workoutState === 'completed') {
    const exerciseList = exercises.map((ex, i) => ({
      name: ex.name,
      mediaUrl: ex.mediaUrl,
      isFocus: i === 0,
      reps: loggedSets[ex.prescriptionId]?.[0]?.reps,
      weight: loggedSets[ex.prescriptionId]?.[0]?.weight,
    }));

    return (
      <WorkoutSummary
        onClose={() => setWorkoutState('streak')}
        onShare={() => {}}
        workoutName={todayWorkout?.workoutDay?.workoutType || 'Workout'}
        exerciseList={exerciseList}
        stats={{
          duration: formatTime(elapsedSeconds),
          exercises: exercises.length,
          sets: totalSets,
          volume: totalVolume
        }}
      />
    );
  }

  // ── Streak State ─────────────────────────────────────────────────────────────
  if (workoutState === 'streak') {
    const weeklyGoal = 4;
    const completedThisWeek = 1;
    const remaining = weeklyGoal - completedThisWeek;

    return (
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[70vh] gap-8 py-12 animate-in fade-in duration-500">
        <button
          onClick={() => router.push('/dashboard')}
          className="self-start text-text-muted hover:text-text-primary transition-colors"
        >
          ✕
        </button>

        <div className="flex flex-col items-center gap-6 text-center flex-1 justify-center">
          <h2 className="text-4xl font-black italic text-text-primary">Unlock your streak</h2>

          <p className="text-xs font-black text-warning uppercase tracking-[0.2em]">{weeklyGoal} WORKOUTS / WEEK GOAL</p>

          {/* Locked hexagon badge */}
          <div className="w-20 h-20 rounded-2xl border-2 border-warning/50 bg-warning/5 flex items-center justify-center">
            <span className="text-warning text-3xl">🔒</span>
          </div>

          {/* Progress circles */}
          <div className="flex items-center gap-4">
            {Array.from({ length: weeklyGoal }, (_, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center ${
                  i < completedThisWeek
                    ? 'bg-white border-white'
                    : 'bg-transparent border-white/20'
                }`}
              >
                {i < completedThisWeek && (
                  <span className="text-background text-sm font-black">✓</span>
                )}
              </div>
            ))}
          </div>

          <p className="text-xl font-black italic text-text-primary">
            {remaining} to go this week
          </p>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full h-14 rounded-2xl border border-white/20 text-text-primary font-bold hover:border-white/40 transition-colors"
        >
          Continue
        </button>
      </div>
    );
  }

  return null;
}
