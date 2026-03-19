'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ExerciseMetaBadges from '@/components/ui/ExerciseMetaBadges';
import ExercisePreviewModal from '@/components/ui/ExercisePreviewModal';
import api, {
  ApiProgramFull,
  ApiProgramMonth,
  ApiWorkoutDay,
  ApiExercise,
  ApiExercisePrescription,
} from '@/lib/api';
import { 
  Target, 
  ChevronRight, 
  Zap, 
  Calendar, 
  ArrowLeft, 
  Sparkles, 
  Play,
  Activity,
  User,
  Clock
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseRepRange(range: string | null): { min: number; max: number } {
  if (!range) return { min: 8, max: 12 };
  const parts = range.split('-').map(Number);
  return { min: parts[0] ?? 8, max: parts[1] ?? parts[0] ?? 12 };
}

const PHASE_LABELS = [
  { name: 'Foundation', desc: 'Build movement patterns & establish baseline strength' },
  { name: 'Development', desc: 'Progressive overload & volume accumulation' },
  { name: 'Intensification', desc: 'Peak intensity & maximum effort sets' },
];

const MUSCLE_HEX: Record<string, string> = {
  Chest:      '#e8824a',
  Back:       '#4a9fe8',
  Shoulders:  '#e8c44a',
  Quads:      '#4ae87a',
  Hamstrings: '#3fcc6a',
  Glutes:     '#3fcc6a',
  Biceps:     '#a44ae8',
  Triceps:    '#c04ae8',
  Core:       '#e84a4a',
  Abs:        '#e84a4a',
  Calves:     '#4ae87a',
  Forearms:   '#a44ae8',
};

function getMuscleHex(mg?: string | null): string {
  if (!mg) return '#666';
  return MUSCLE_HEX[mg] ?? '#888';
}

// ── Exercise Card (Unified with Workout Flow) ──────────────────────────────────

function ExerciseCard({
  ep,
  onPreview,
}: {
  ep: ApiExercisePrescription;
  onPreview: (ex: ApiExercise) => void;
}) {
  const ex = ep.exercise;
  const { min, max } = parseRepRange(ep.targetRepRange);
  const muscleGroup = ex.muscleGroup ?? ex.bodyPart ?? null;
  const hex = getMuscleHex(muscleGroup);

  return (
    <button
      onClick={() => onPreview(ex)}
      className="w-full text-left flex items-center gap-4 p-4 rounded-[24px] bg-white/[0.02] border border-white/[0.04] hover:border-accent/30 hover:bg-white/[0.04] transition-all duration-300 group"
    >
      <div className="w-14 h-14 rounded-2xl bg-background border border-white/[0.04] overflow-hidden shrink-0 flex items-center justify-center relative">
        {ex.mediaUrl ? (
          <img src={ex.mediaUrl} alt={ex.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted/40 font-bold text-xs" style={{ color: hex }}>
            {ex.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors truncate">
          {ex.name}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{(ep as any).setCount || 3} Sets · {min}-{max} Reps</span>
          <div className="w-1 h-1 rounded-full bg-white/10" />
          <span className="text-[10px] font-bold text-text-muted/60 uppercase tracking-tight">{muscleGroup}</span>
        </div>
      </div>

      <ChevronRight size={16} className="text-text-muted/30 group-hover:text-accent transition-colors" />
    </button>
  );
}

// ── Workout Day Panel ──────────────────────────────────────────────────────────

function WorkoutDayPanel({
  day,
  onPreview,
}: {
  day: ApiWorkoutDay;
  onPreview: (ex: ApiExercise) => void;
}) {
  const muscleGroups = [
    ...new Set(
      day.exercisePrescriptions
        .map((ep) => ep.exercise.muscleGroup ?? ep.exercise.bodyPart)
        .filter(Boolean) as string[]
    ),
  ].slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-2">
         <div className="flex items-center gap-3">
            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Day {day.sortOrder} · {day.workoutType}</h3>
            {muscleGroups.length > 0 && (
              <div className="flex items-center gap-1">
                {muscleGroups.map((mg) => (
                  <div key={mg} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getMuscleHex(mg) }} title={mg} />
                ))}
              </div>
            )}
         </div>
         <div className="h-px flex-1 bg-white/[0.06] ml-4" />
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {day.exercisePrescriptions.length === 0 ? (
          <div className="p-8 rounded-[32px] bg-white/[0.01] border border-dashed border-white/[0.06] flex flex-col items-center justify-center text-center">
            <span className="text-2xl mb-2">🧘</span>
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Active Recovery / Rest</p>
          </div>
        ) : (
          day.exercisePrescriptions.map((ep) => (
            <ExerciseCard key={ep.id} ep={ep} onPreview={onPreview} />
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;

  const [program, setProgram] = useState<ApiProgramFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMonthIdx, setActiveMonthIdx] = useState(0);
  const [activeWeekIdx, setActiveWeekIdx] = useState(0);
  const [starting, setStarting] = useState(false);
  const [previewExercise, setPreviewExercise] = useState<ApiExercise | null>(null);

  useEffect(() => {
    api.programs.get(programId)
      .then(({ program: prog }) => {
        setProgram(prog);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load program');
      })
      .finally(() => setLoading(false));
  }, [programId]);

  function handleMonthChange(idx: number) {
    setActiveMonthIdx(idx);
    setActiveWeekIdx(0);
  }

  async function handleStartToday() {
    setStarting(true);
    try {
      await api.programs.assign(programId);
    } catch {
      // Already assigned
    }
    router.push('/dashboard/workout');
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Synchronizing Protocol...</span>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="max-w-xl mx-auto space-y-6 pt-10">
        <button onClick={() => router.push('/dashboard/programs')} className="flex items-center gap-2 text-[10px] font-black text-text-muted hover:text-accent uppercase tracking-widest transition-colors">
          <ArrowLeft size={14} /> Back to Systems
        </button>
        <div className="p-6 rounded-[32px] bg-danger/10 border border-danger/20 text-danger text-xs font-bold text-center uppercase tracking-widest">
          {error ?? 'System Archive Not Found'}
        </div>
      </div>
    );
  }

  const months: ApiProgramMonth[] = program.programMonths ?? [];
  const activeMonth = months[activeMonthIdx];
  const activeWeek = activeMonth?.programWeeks[activeWeekIdx] ?? null;

  return (
    <div className="max-w-xl mx-auto pb-32">
      {/* Back Link */}
      <button 
        onClick={() => router.push('/dashboard/programs')} 
        className="flex items-center gap-2 text-[10px] font-black text-text-muted hover:text-accent uppercase tracking-[0.2em] mb-8 transition-colors group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        Return to Fleet
      </button>

      {/* Hero Header (Mirrored from Workout Page) */}
      <div className="text-center mb-12">
        {/* Context Chip */}
        <div className="inline-flex bg-white/[0.03] border border-white/[0.08] rounded-2xl p-1.5 mb-8 shadow-xl">
           <div className="px-4 py-1.5 rounded-xl bg-accent text-white text-[10px] font-black uppercase tracking-widest shadow-accent-sm">
             Protocol Matrix
           </div>
           {program.experienceLevel && (
             <div className="px-4 py-1.5 text-text-muted text-[10px] font-bold uppercase tracking-widest">
               {program.experienceLevel}
             </div>
           )}
        </div>

        <div className="relative mb-8 flex justify-center group">
           <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-accent to-[#7B61FF] rotate-12 flex items-center justify-center shadow-accent-elevated group-hover:rotate-0 transition-transform duration-500">
              <Zap size={40} fill="white" className="text-white -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
           </div>
           <div className="absolute -top-2 right-[38%] w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center border border-white/10 shadow-lg">
              <span className="text-xs">⚙️</span>
           </div>
        </div>

        <h1 className="text-5xl font-bold text-text-primary tracking-tight leading-[0.9] mb-4">
          {program.name}
        </h1>
        
        <p className="text-text-muted text-lg max-w-sm mx-auto font-medium mb-6">
          {program.description ?? `A high-performance ${program.totalWeeks}-week training system optimized for ${program.goalType || 'physical development'}.`}
        </p>

        <div className="mt-10">
          <Button 
            variant="primary" 
            fullWidth
            onClick={handleStartToday} 
            loading={starting} 
            className="h-20 rounded-[32px] text-xl font-bold tracking-tight shadow-accent-elevated flex gap-4 group"
          >
            Deploy System
            <Play size={24} fill="currentColor" className="group-hover:scale-125 transition-transform duration-300" />
          </Button>
        </div>
      </div>

      {/* Phase / Month Selector */}
      {months.length > 0 && (
        <div className="space-y-10 mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Phase Tabs */}
          <div className="grid grid-cols-3 gap-3">
            {months.map((month, idx) => {
              const label = PHASE_LABELS[idx] || { name: `Phase ${idx+1}`, desc: 'Active Training Block' };
              const isActive = activeMonthIdx === idx;
              
              return (
                <button
                  key={month.id}
                  onClick={() => handleMonthChange(idx)}
                  className={`relative p-4 rounded-[28px] text-left transition-all duration-300 border ${
                    isActive 
                      ? 'bg-surface-elevated border-accent shadow-accent-sm scale-105 z-10' 
                      : 'bg-white/[0.02] border-white/[0.06] opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${
                    isActive ? 'bg-accent text-white' : 'bg-white/[0.05] text-text-muted'
                  }`}>
                    <span className="text-xs font-black">{idx + 1}</span>
                  </div>
                  <h4 className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-text-primary' : 'text-text-muted'}`}>
                    {label.name}
                  </h4>
                  <p className="text-[10px] font-medium text-text-muted/60 mt-1 leading-tight line-clamp-2">
                    {month.description || label.desc}
                  </p>
                  {isActive && (
                    <div className="absolute top-3 right-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Week Selector */}
          {activeMonth && (
            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.04] p-2 rounded-[24px]">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-4 shrink-0">Training Week</span>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {activeMonth.programWeeks.map((week, idx) => (
                  <button
                    key={week.id}
                    onClick={() => setActiveWeekIdx(idx)}
                    className={`min-w-[44px] h-[44px] rounded-2xl text-xs font-black transition-all ${
                      activeWeekIdx === idx
                        ? 'bg-accent text-white shadow-accent-sm'
                        : 'bg-white/[0.04] text-text-muted hover:bg-white/[0.08]'
                    }`}
                  >
                    {week.weekNumber}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Workout Days List */}
          <div className="space-y-12 pt-4">
            {activeWeek ? (
              activeWeek.workoutDays.length === 0 ? (
                <div className="p-12 text-center rounded-[40px] bg-white/[0.01] border border-dashed border-white/[0.06]">
                   <p className="text-text-muted text-sm font-bold uppercase tracking-widest">No Protocol Defined for this cycle</p>
                </div>
              ) : (
                activeWeek.workoutDays.map((day) => (
                  <WorkoutDayPanel key={day.id} day={day} onPreview={setPreviewExercise} />
                ))
              )
            ) : (
              <div className="p-12 text-center rounded-[40px] bg-white/[0.01] border border-dashed border-white/[0.06]">
                 <p className="text-text-muted text-sm font-bold uppercase tracking-widest">Select an active training week</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fallback for unstructured programs */}
      {months.length === 0 && (
        <div className="mt-16 p-12 text-center rounded-[40px] bg-white/[0.01] border border-dashed border-white/[0.06]">
           <p className="text-text-muted text-sm font-bold uppercase tracking-widest">System Architecture Incomplete</p>
           <p className="text-text-muted/60 text-xs mt-2 uppercase tracking-tight font-medium">Verify protocol month/week/day structure in database</p>
        </div>
      )}

      {/* Exercise preview modal */}
      {previewExercise && (
        <ExercisePreviewModal
          exercise={previewExercise}
          onClose={() => setPreviewExercise(null)}
        />
      )}
    </div>
  );
}
