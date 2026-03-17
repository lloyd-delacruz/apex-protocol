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
import { Target, ChevronRight, Zap, Calendar } from 'lucide-react';

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

// Hex colors per muscle group — safe for dynamic inline styles
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

// ── Exercise Thumbnail ─────────────────────────────────────────────────────────

function ExerciseThumbnail({
  mediaUrl,
  name,
  muscleGroup,
}: {
  mediaUrl?: string | null;
  name: string;
  muscleGroup?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const hex = getMuscleHex(muscleGroup);
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();

  if (mediaUrl && !failed) {
    return (
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-black/20 border border-white/[0.06]">
        <img
          src={mediaUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center border"
      style={{
        background: `linear-gradient(135deg, ${hex}26, ${hex}0d)`,
        borderColor: `${hex}33`,
      }}
    >
      <span className="text-sm font-bold" style={{ color: hex }}>
        {initials}
      </span>
    </div>
  );
}

// ── Exercise Card ──────────────────────────────────────────────────────────────

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
      className="w-full text-left flex items-center gap-4 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-accent/25 hover:bg-accent/[0.03] transition-all duration-150 group"
    >
      {/* Thumbnail */}
      <ExerciseThumbnail
        mediaUrl={ex.mediaUrl}
        name={ex.name}
        muscleGroup={muscleGroup}
      />

      {/* Exercise info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="font-semibold text-sm text-text-primary group-hover:text-accent transition-colors truncate">
            {ex.name}
          </p>
          {ex.isCompound !== undefined && (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border flex-shrink-0 ${
                ex.isCompound
                  ? 'bg-accent/10 text-accent border-accent/20'
                  : 'bg-white/[0.05] text-text-muted border-white/[0.08]'
              }`}
            >
              {ex.isCompound ? 'Compound' : 'Isolation'}
            </span>
          )}
        </div>

        <ExerciseMetaBadges
          exercise={ex}
          fields={['equipment', 'bodyPart', 'movementPattern']}
          className="mb-1.5"
        />

        {(ex.primaryMuscle || muscleGroup) && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <Target className="w-3 h-3 flex-shrink-0" style={{ color: hex }} />
            <span className="text-[11px] text-text-muted">
              {ex.primaryMuscle ?? muscleGroup}
            </span>
          </div>
        )}
      </div>

      {/* Sets × Reps */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08]">
          <span className="text-xs font-bold text-text-primary">3</span>
          <span className="text-[10px] text-text-muted mx-0.5">×</span>
          <span className="text-xs font-bold text-text-primary">
            {min}–{max}
          </span>
        </div>
        <span className="text-[10px] text-text-muted">@2 RIR</span>
      </div>

      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors flex-shrink-0 ml-1" />
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
  ].slice(0, 4);

  return (
    <div className="card overflow-hidden">
      {/* Day header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06] bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-white/[0.08] flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-accent">{day.sortOrder}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{day.workoutType}</p>
            <p className="text-[11px] text-text-muted mt-0.5">
              {day.exercisePrescriptions.length} exercise
              {day.exercisePrescriptions.length !== 1 ? 's' : ''}
              {day.phase ? ` · ${day.phase}` : ''}
            </p>
          </div>
        </div>

        {/* Muscle group colour dots */}
        {muscleGroups.length > 0 && (
          <div className="flex items-center gap-1.5">
            {muscleGroups.map((mg) => (
              <span
                key={mg}
                title={mg}
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getMuscleHex(mg) }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Exercise list */}
      {day.exercisePrescriptions.length === 0 ? (
        <p className="p-4 text-sm text-text-muted italic">Rest day</p>
      ) : (
        <div className="p-3 space-y-2">
          {day.exercisePrescriptions.map((ep) => (
            <ExerciseCard key={ep.id} ep={ep} onPreview={onPreview} />
          ))}
        </div>
      )}
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
      // Already assigned — proceed anyway
    }
    router.push('/workout');
  }

  // ── Loading / error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-muted text-sm">Loading program...</div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => router.push('/programs')} />
        <div className="p-3 rounded-card bg-danger/10 border border-danger/20 text-danger text-sm">
          {error ?? 'Program not found'}
        </div>
      </div>
    );
  }

  // ── Derived stats ─────────────────────────────────────────────────────────

  const months: ApiProgramMonth[] = program.programMonths ?? [];
  const allWeeks = months.flatMap((m) => m.programWeeks);
  const totalSessions = allWeeks.reduce((s, w) => s + w.workoutDays.length, 0);
  const totalExercises = allWeeks.reduce(
    (s, w) =>
      s + w.workoutDays.reduce((d, day) => d + day.exercisePrescriptions.length, 0),
    0
  );

  const activeMonth = months[activeMonthIdx];
  const activeWeek = activeMonth?.programWeeks[activeWeekIdx] ?? null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <BackButton onClick={() => router.push('/programs')} />

      {/* ── Program header ─────────────────────────────────────────────────── */}
      <Card elevated className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            {/* Chips row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
                Training Program
              </span>
              {program.experienceLevel && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/[0.06] text-text-muted border border-white/[0.08] capitalize">
                  {program.experienceLevel}
                </span>
              )}
              {program.daysPerWeek && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/[0.06] text-text-muted border border-white/[0.08]">
                  <Calendar className="w-3 h-3" />
                  {program.daysPerWeek}d / wk
                </span>
              )}
              {program.goalType && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/[0.06] text-text-muted border border-white/[0.08] capitalize">
                  <Zap className="w-3 h-3" />
                  {program.goalType.replace(/,/g, ' + ').replace(/_/g, ' ')}
                </span>
              )}
            </div>

            <h2 className="font-heading text-2xl font-bold text-text-primary">
              {program.name}
            </h2>
            <p className="text-text-muted text-sm mt-2 max-w-2xl leading-relaxed">
              {program.description ?? `${program.totalWeeks}-week training program`}
            </p>
          </div>

          <Button variant="primary" onClick={handleStartToday} loading={starting} className="flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Start Today
          </Button>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-white/[0.06]">
          {[
            { label: 'Duration',   value: `${program.totalWeeks} weeks` },
            { label: 'Sessions',   value: totalSessions },
            { label: 'Exercises',  value: totalExercises },
            { label: 'Days / wk',  value: program.daysPerWeek ?? '—' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="label">{stat.label}</p>
              <p className="text-base font-semibold text-text-primary mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Phase / month tabs ──────────────────────────────────────────────── */}
      {months.length > 0 ? (
        <div>
          {/* Month tabs */}
          <div className="flex gap-2 mb-1 overflow-x-auto pb-1">
            {months.map((month, idx) => {
              const fallback = PHASE_LABELS[idx];
              return (
                <button
                  key={month.id}
                  onClick={() => handleMonthChange(idx)}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeMonthIdx === idx
                      ? 'bg-accent text-white shadow-[0_4px_16px_rgba(0,0,0,0.25)]'
                      : 'bg-white/[0.04] text-text-muted hover:text-text-primary hover:bg-white/[0.07] border border-white/[0.06]'
                  }`}
                >
                  {month.name ?? `Month ${idx + 1} — ${fallback?.name ?? ''}`}
                </button>
              );
            })}
          </div>

          {/* Phase description */}
          {activeMonth && (
            <p className="text-xs text-text-muted mb-4 pl-1 mt-2">
              {activeMonth.description ?? PHASE_LABELS[activeMonthIdx]?.desc ?? ''}
            </p>
          )}

          {/* Week pills */}
          {activeMonth && activeMonth.programWeeks.length > 0 && (
            <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
              <span className="text-xs text-text-muted flex-shrink-0">Week:</span>
              {activeMonth.programWeeks.map((week, idx) => (
                <button
                  key={week.id}
                  onClick={() => setActiveWeekIdx(idx)}
                  className={`flex-shrink-0 w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                    activeWeekIdx === idx
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'bg-white/[0.04] text-text-muted hover:text-text-primary border border-white/[0.06]'
                  }`}
                >
                  {week.weekNumber}
                </button>
              ))}
            </div>
          )}

          {/* Workout days */}
          {activeWeek ? (
            <div className="space-y-4">
              {activeWeek.workoutDays.length === 0 ? (
                <Card elevated className="p-8 text-center">
                  <p className="text-text-muted text-sm">No workout days in this week.</p>
                </Card>
              ) : (
                activeWeek.workoutDays.map((day) => (
                  <WorkoutDayPanel key={day.id} day={day} onPreview={setPreviewExercise} />
                ))
              )}
            </div>
          ) : (
            <Card elevated className="p-8 text-center">
              <p className="text-text-muted text-sm">Select a week to view workouts.</p>
            </Card>
          )}
        </div>
      ) : (
        // Fallback for programs without month structure
        <Card elevated className="p-8 text-center">
          <p className="text-text-muted text-sm">No workout structure found for this program.</p>
        </Card>
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

// ── Shared sub-components ──────────────────────────────────────────────────────

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back to Programs
    </button>
  );
}
