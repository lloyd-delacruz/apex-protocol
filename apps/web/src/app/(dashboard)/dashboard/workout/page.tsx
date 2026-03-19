'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, 
  Settings, 
  ChevronRight, 
  History, 
  Trophy,
  Activity,
  Plus,
  ArrowRight,
  Clock,
  Flame,
  Zap,
  MoreVertical
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
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
type WorkoutState = 'idle' | 'active' | 'saving' | 'completed';

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

  // ── Idle State (Hero View) ──────────────────────────────────────────────────
  if (workoutState === 'idle') {
    const monthNumber = Math.ceil((todayWorkout?.currentWeek?.absoluteWeekNumber || 1) / 4);
    const weekNumber = todayWorkout?.currentWeek?.weekNumber || 1;
    const dayNumber = todayWorkout?.workoutDay?.sortOrder || 1;
    const phaseNames = ['Foundation', 'Development', 'Intensification'];
    const phaseName = phaseNames[monthNumber - 1] || 'Active Phase';

    return (
      <div className="max-w-xl mx-auto pt-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-12">
          {/* Program Context Chip */}
          <div className="inline-flex bg-white/[0.03] border border-white/[0.08] rounded-2xl p-1.5 mb-8 shadow-xl">
             <div className="px-4 py-1.5 rounded-xl bg-accent text-white text-[10px] font-black uppercase tracking-widest shadow-accent-sm">
               Phase {monthNumber}: {phaseName}
             </div>
             <div className="px-4 py-1.5 text-text-muted text-[10px] font-bold uppercase tracking-widest">
               Week {weekNumber} · Day {dayNumber}
             </div>
          </div>

          <div className="relative mb-8 flex justify-center group">
             <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-accent to-[#7B61FF] rotate-12 flex items-center justify-center shadow-accent-elevated group-hover:rotate-0 transition-transform duration-500">
                <Activity size={40} className="text-white -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
             </div>
             <div className="absolute -top-2 right-[38%] w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center border border-white/10 shadow-lg animate-bounce">
                <span className="text-xs">💪</span>
             </div>
          </div>

          <h1 className="text-5xl font-bold text-text-primary tracking-tight leading-[0.9] mb-4">
            Today&apos;s <span className="text-gradient-accent">Protocol</span>
          </h1>
          <p className="text-text-muted text-lg max-w-sm mx-auto font-medium">
            {todayWorkout?.workoutDay?.workoutType || 'Custom Strength Session'}
            <br />
            <span className="text-text-muted/60 text-sm italic">{exercises.length} Exercises · Approx. 45-60 min</span>
          </p>
        </div>

        {pendingProgressions.length > 0 && (
          <div className="mb-10">
            <ProgressionPromptBanner 
              progressions={pendingProgressions}
              onUpdate={setPendingProgressions}
            />
          </div>
        )}

        {/* Start Button Hero */}
        <div className="mb-12">
          <Button 
            variant="primary" 
            fullWidth 
            className="h-20 rounded-[32px] text-xl font-bold tracking-tight shadow-accent-elevated flex gap-4 group overflow-hidden relative"
            onClick={startWorkout}
          >
            <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
            <span className="relative z-10 font-black uppercase tracking-tighter">Ignite Session</span>
            <Play size={24} fill="currentColor" className="relative z-10 group-hover:scale-125 transition-transform duration-300" />
          </Button>
        </div>

        {/* Protocol Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 mb-4">
             <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Protocol Preview</h3>
             <div className="h-px flex-1 bg-white/[0.06] ml-4" />
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {exercises.map((ex, i) => (
              <div 
                key={ex.prescriptionId} 
                className="flex items-center gap-4 p-4 rounded-[24px] bg-white/[0.02] border border-white/[0.04] group hover:border-accent/30 hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-background border border-white/[0.04] overflow-hidden shrink-0 flex items-center justify-center">
                  {ex.mediaUrl ? (
                    <img src={ex.mediaUrl} alt={ex.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted/40">
                      <Activity size={20} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors truncate">{ex.name}</h4>
                  <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest mt-0.5">{ex.setCount} Sets · {ex.repMin}-{ex.repMax} Reps</p>
                </div>
                <ChevronRight size={16} className="text-text-muted/30 group-hover:text-accent transition-colors" />
              </div>
            ))}
          </div>
        </div>
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
    return (
      <WorkoutSummary
        onClose={() => router.push('/dashboard')}
        stats={{
          duration: formatTime(elapsedSeconds),
          exercises: exercises.length,
          sets: totalSets,
          volume: totalVolume
        }}
      />
    );
  }

  return null;
}
