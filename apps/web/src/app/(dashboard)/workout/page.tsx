'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [workoutState, setWorkoutState] = useState<WorkoutState>('idle');
  const [todayWorkout, setTodayWorkout] = useState<ApiTodayWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Session State
  const [exercises, setExercises] = useState<any[]>([]);
  const [loggedSets, setLoggedSets] = useState<Record<string, LoggedSet[]>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // UI State
  const [activeExerciseIdx, setActiveExerciseIdx] = useState<number | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showLogger, setShowLogger] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOptionsIdx, setSelectedOptionsIdx] = useState<number | null>(null);
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
  const startWorkout = () => {
    setWorkoutState('active');
    setStartTime(new Date());
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

  const addExercises = (newExs: ApiExercise[]) => {
    const mapped = newExs.map(ex => ({
      prescriptionId: `custom-${Math.random()}`,
      exerciseId: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup || '',
      primaryMuscle: ex.primaryMuscle,
      setCount: 3,
      repMin: 8,
      repMax: 12,
      mediaUrl: ex.mediaUrl,
      equipment: ex.equipment
    }));
    setExercises([...exercises, ...mapped]);
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

  // ── Idle State ─────────────────────────────────────────────────────────────
  if (workoutState === 'idle') {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-4xl font-black text-text-primary uppercase italic tracking-tighter leading-none mb-2 underline decoration-accent/30 decoration-8 underline-offset-4">
            Today&apos;s Protocol
          </h1>
          <p className="text-sm font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
            <Clock size={14} className="text-accent" /> {todayWorkout?.workoutDay?.workoutType || 'Custom Session'} · {exercises.length} Exercises
          </p>
        </div>

        {pendingProgressions.length > 0 && (
          <ProgressionPromptBanner 
            progressions={pendingProgressions}
            onUpdate={setPendingProgressions}
          />
        )}

        <div className="grid grid-cols-1 gap-4">
          {exercises.map((ex, i) => (
             <div key={ex.prescriptionId} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/20 to-accent-secondary/20 rounded-[32px] blur opacity-0 group-hover:opacity-100 transition duration-500" />
                <Card className="relative p-5 bg-surface border border-white/[0.06] rounded-[30px] flex items-center gap-5">
                   <div className="w-16 h-16 rounded-2xl bg-background overflow-hidden border border-white/[0.04] shrink-0">
                      {ex.mediaUrl ? (
                         <img src={ex.mediaUrl} alt={ex.name} className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center text-text-muted">
                            <Activity size={24} />
                         </div>
                      )}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-accent uppercase tracking-[0.15em] mb-0.5">{ex.primaryMuscle || ex.muscleGroup}</p>
                      <h3 className="text-base font-black text-text-primary uppercase tracking-tight truncate">{ex.name}</h3>
                      <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">{ex.setCount} Sets · {ex.repMin}-{ex.repMax} Reps</p>
                   </div>
                   <ChevronRight size={20} className="text-text-muted group-hover:text-accent transition-colors" />
                </Card>
             </div>
          ))}
        </div>

        <div className="sticky bottom-8 z-20 px-4">
           <Button 
            variant="primary" 
            fullWidth 
            size="lg"
            className="h-20 rounded-[32px] text-lg font-black uppercase italic tracking-widest shadow-accent flex gap-3 group"
            onClick={startWorkout}
           >
             Ignite Protocol <Play size={24} fill="currentColor" className="group-hover:translate-x-1 transition-transform" />
           </Button>
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
          onClose={() => setShowLibrary(false)}
          onSelect={addExercises}
        />

        <ExerciseOptionsBottomSheet 
          isOpen={showOptions}
          onClose={() => setShowOptions(false)}
          exerciseName={selectedOptionsIdx !== null ? exercises[selectedOptionsIdx].name : ''}
          onReplace={() => {
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
              onLogSet={(set) => {
                 setLoggedSets(prev => ({
                   ...prev,
                   [exercises[activeExerciseIdx].prescriptionId]: [
                     ...(prev[exercises[activeExerciseIdx].prescriptionId] || []),
                     { ...set, id: Math.random().toString() } as any
                   ]
                 }));
                 if (set.completed) {
                   setShowLogger(false);
                   setShowRestTimer(true);
                 }
              }}
              onLogAll={(sets) => {
                 setLoggedSets(prev => ({
                   ...prev,
                   [exercises[activeExerciseIdx].prescriptionId]: sets.map(s => ({ ...s, id: Math.random().toString() } as any))
                 }));
                 setShowLogger(false);
                 setShowRestTimer(true);
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
        onClose={() => window.location.href = '/dashboard'}
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
