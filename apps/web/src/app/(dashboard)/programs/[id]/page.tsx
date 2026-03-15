'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { ApiProgramFull, ApiProgramWeek, ApiWorkoutDay } from '@/lib/api';

const muscleGroupColors: Record<string, string> = {
  Chest: 'bg-accent/10 text-accent border-accent/20',
  Back: 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20',
  Shoulders: 'bg-warning/10 text-warning border-warning/20',
  Quads: 'bg-success/10 text-success border-success/20',
  Hamstrings: 'bg-danger/10 text-danger border-danger/20',
  Glutes: 'bg-success/10 text-success border-success/20',
  default: 'bg-white/[0.06] text-text-muted border-white/[0.08]',
};

function MuscleTag({ group }: { group: string | null }) {
  if (!group) return null;
  const classes = muscleGroupColors[group] ?? muscleGroupColors.default;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${classes}`}>
      {group}
    </span>
  );
}

function parseRepRange(range: string | null): { min: number; max: number } {
  if (!range) return { min: 8, max: 12 };
  const parts = range.split('-').map(Number);
  return { min: parts[0] ?? 8, max: parts[1] ?? parts[0] ?? 12 };
}

function WorkoutDayRow({ day }: { day: ApiWorkoutDay }) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">
            Day {day.sortOrder} — {day.workoutType}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {day.exercisePrescriptions.length} exercises
            {day.phase ? ` · ${day.phase}` : ''}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Exercise', 'Muscle', 'Sets', 'Reps', 'RIR'].map((h) => (
                <th
                  key={h}
                  className={`py-1.5 pr-4 label font-medium ${h === 'Exercise' ? 'text-left' : h === 'Muscle' ? 'text-left' : 'text-center'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {day.exercisePrescriptions.map((ep) => {
              const { min, max } = parseRepRange(ep.targetRepRange);
              return (
                <tr key={ep.id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                  <td className="py-2 pr-4 font-medium text-text-primary">{ep.exercise.name}</td>
                  <td className="py-2 pr-4">
                    <MuscleTag group={ep.exercise.muscleGroup} />
                  </td>
                  <td className="py-2 pr-4 text-center text-text-muted">3</td>
                  <td className="py-2 pr-4 text-center text-text-muted">{min}–{max}</td>
                  <td className="py-2 text-center text-text-muted">@2</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;

  const [program, setProgram] = useState<ApiProgramFull | null>(null);
  const [weeks, setWeeks] = useState<ApiProgramWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [{ program: prog }, { weeks: wks }] = await Promise.all([
          api.programs.get(programId),
          api.programs.getWeeks(programId),
        ]);
        setProgram(prog);
        setWeeks(wks);
        // Expand first week by default
        if (wks.length > 0) {
          setExpandedWeeks(new Set([wks[0].id]));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load program');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [programId]);

  function toggleWeek(weekId: string) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekId)) next.delete(weekId);
      else next.add(weekId);
      return next;
    });
  }

  async function handleStartToday() {
    setStarting(true);
    try {
      await api.programs.assign(programId);
    } catch {
      // If already assigned, ignore the error and navigate anyway
    }
    router.push('/workout');
  }

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
        <button
          onClick={() => router.push('/programs')}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Programs
        </button>
        <div className="p-3 rounded-card bg-danger/10 border border-danger/20 text-danger text-sm">
          {error ?? 'Program not found'}
        </div>
      </div>
    );
  }

  const totalSessions = weeks.reduce((s, w) => s + w.workoutDays.length, 0);
  const totalExercises = weeks.reduce((s, w) => s + w.workoutDays.reduce((d, day) => d + day.exercisePrescriptions.length, 0), 0);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push('/programs')}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Programs
      </button>

      {/* Program header */}
      <Card elevated className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20 mb-3">
              Training Program
            </span>
            <h2 className="font-heading text-2xl font-bold text-text-primary">{program.name}</h2>
            <p className="text-text-muted text-sm mt-2 max-w-2xl leading-relaxed">
              {program.description ?? `${program.totalWeeks}-week training program`}
            </p>
          </div>
          <Button variant="primary" onClick={handleStartToday} loading={starting}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Start Today
          </Button>
        </div>

        <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-white/[0.06]">
          {[
            { label: 'Duration', value: `${program.totalWeeks} weeks` },
            { label: 'Weeks loaded', value: weeks.length },
            { label: 'Total sessions', value: totalSessions },
            { label: 'Total exercises', value: totalExercises },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="label">{stat.label}</p>
              <p className="text-base font-semibold text-text-primary mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Week accordion */}
      <div className="space-y-3">
        {weeks.map((week) => {
          const isExpanded = expandedWeeks.has(week.id);
          const weekSessions = week.workoutDays.length;

          return (
            <div key={week.id} className="card overflow-hidden">
              <button
                onClick={() => toggleWeek(week.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-card bg-surface-elevated flex items-center justify-center">
                    <span className="font-heading text-sm font-bold text-accent">{week.weekNumber}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-text-primary text-sm">Week {week.weekNumber}</p>
                    <p className="text-xs text-text-muted">
                      {weekSessions} session{weekSessions !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
                  {week.workoutDays.length === 0 ? (
                    <p className="p-4 text-sm text-text-muted">No workout days in this week.</p>
                  ) : (
                    week.workoutDays.map((day) => (
                      <WorkoutDayRow key={day.id} day={day} />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
