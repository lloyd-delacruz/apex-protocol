'use client';

import { useState } from 'react';
import { Target, Calendar, Dumbbell, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Sparkles, X, User, LayoutList } from 'lucide-react';
import Button from '@/components/ui/Button';
import ExerciseMetaBadges from '@/components/ui/ExerciseMetaBadges';
import ExercisePreviewModal from '@/components/ui/ExercisePreviewModal';
import api, { ApiProgramFull, ApiWorkoutDay, ApiExercise } from '@/lib/api';
import { GeneratorState } from './ProgramGeneratorModal';

interface Props {
  program: ApiProgramFull;
  state: GeneratorState;
  onSuccess: (programId: string) => void;
  onClose: () => void;
  onBusyChange: (busy: boolean) => void;
}

export default function ProgramGeneratorPreview({ program, state, onSuccess, onClose, onBusyChange }: Props) {
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewExercise, setPreviewExercise] = useState<ApiExercise | null>(null);

  const firstMonth = program.programMonths?.[0];
  const firstWeek = firstMonth?.programWeeks?.[0];
  const previewDays = firstWeek?.workoutDays ?? [];
  const hasPreview = previewDays.length > 0;

  const handleAssign = async () => {
    // Duplicate-submit guard
    if (assigning) return;

    setAssigning(true);
    onBusyChange(true);
    setError(null);

    try {
      await api.programs.assignGenerated(program.id);
      // Note: do not reset busy — caller closes modal immediately on success
      onSuccess(program.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign program. Please try again.');
      setAssigning(false);
      onBusyChange(false);
    }
  };

  const getGoalLabel = (goals: string[]) => {
    if (!goals || goals.length === 0) return '—';
    return goals
      .map((g) => g.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
      .join(' + ');
  };

  const getExperienceLabel = (exp: string | null) => {
    if (!exp) return '—';
    return exp.charAt(0).toUpperCase() + exp.slice(1);
  };

  return (
    <div className="space-y-6 animate-fade-in py-2">

      {previewExercise && (
        <ExercisePreviewModal
          exercise={previewExercise}
          onClose={() => setPreviewExercise(null)}
        />
      )}

      {/* Generation success callout */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-success/[0.08] border border-success/20">
        <Sparkles className="w-5 h-5 text-success shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-success">Protocol Generated</p>
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
            Review your program below, then assign it to begin training.
          </p>
        </div>
      </div>

      {/* Program header */}
      <div className="p-5 rounded-xl bg-surface border border-white/[0.08]">
        <h3 className="font-heading text-2xl font-bold text-text-primary tracking-tight">
          {program.name || 'Generated Program'}
        </h3>
        {program.description && (
          <p className="text-sm text-text-muted leading-relaxed mt-2">{program.description}</p>
        )}
        {(program.goalType || program.trainingFocus) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {program.goalType && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 font-medium">
                {getGoalLabel(program.goalType.split(',').map((g) => g.trim()).filter(Boolean))}
              </span>
            )}
            {program.trainingFocus && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] text-text-muted border border-white/[0.08] font-medium">
                {program.trainingFocus}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-surface border border-white/[0.08] text-center">
          <Target className="w-4 h-4 text-accent mx-auto mb-1.5" />
          <div className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Goal</div>
          <div className="text-sm font-semibold text-text-primary">{getGoalLabel(state.goals)}</div>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-white/[0.08] text-center">
          <User className="w-4 h-4 text-accent mx-auto mb-1.5" />
          <div className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Level</div>
          <div className="text-sm font-semibold text-text-primary">{getExperienceLabel(state.experience)}</div>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-white/[0.08] text-center">
          <Calendar className="w-4 h-4 text-accent mx-auto mb-1.5" />
          <div className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Frequency</div>
          <div className="text-sm font-semibold text-text-primary">{state.days} days/wk</div>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-white/[0.08] text-center">
          <Dumbbell className="w-4 h-4 text-accent mx-auto mb-1.5" />
          <div className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Duration</div>
          <div className="text-sm font-semibold text-text-primary">
            {program.totalWeeks != null ? `${program.totalWeeks} weeks` : '—'}
          </div>
        </div>
      </div>

      {/* Week 1 workout structure preview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Week 1 Preview</h4>
          {hasPreview && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-text-muted border border-white/[0.06]">
              {previewDays.length} sessions
            </span>
          )}
        </div>

        {hasPreview ? (
          <div className="space-y-2">
            {previewDays.map((day) => (
              <WorkoutDayPreview key={day.id} day={day} onPreviewExercise={setPreviewExercise} />
            ))}
          </div>
        ) : (
          /* Fallback when backend returns no structured week data */
          <div className="flex items-start gap-3 p-4 rounded-xl bg-surface border border-white/[0.08]">
            <LayoutList className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
            <p className="text-sm text-text-muted leading-relaxed">
              Workout structure will be available once the program is assigned and loaded.
            </p>
          </div>
        )}
      </div>

      {/* Assignment error */}
      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border-l-4 border-danger text-sm flex items-start gap-3 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-danger block mb-1">Assignment Failed</span>
            <span className="text-danger/90 leading-relaxed">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-danger/70 hover:text-danger">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-white/[0.06]">
        <Button
          variant="primary"
          size="lg"
          onClick={handleAssign}
          loading={assigning}
          disabled={assigning}
          className="w-full sm:w-auto shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.5)]"
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Assign Program
        </Button>
        <Button variant="ghost" onClick={onClose} disabled={assigning} className="w-full sm:w-auto">
          Close
        </Button>
      </div>
    </div>
  );
}

function WorkoutDayPreview({ day, onPreviewExercise }: { day: ApiWorkoutDay; onPreviewExercise: (ex: ApiExercise) => void }) {
  const [expanded, setExpanded] = useState(false);
  const exercises = day.exercisePrescriptions ?? [];

  return (
    <div className="rounded-xl bg-surface border border-white/[0.08] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-accent uppercase tracking-wider min-w-[1.5rem]">
            {day.dayCode || '—'}
          </span>
          <div>
            <span className="text-sm font-medium text-text-primary">{day.workoutType || 'Session'}</span>
            {day.phase && <span className="text-xs text-text-muted ml-2">· {day.phase}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-text-muted">{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-text-muted" />
            : <ChevronDown className="w-4 h-4 text-text-muted" />
          }
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/[0.06] animate-fade-in">
          {exercises.length > 0 ? (
            <div className="divide-y divide-white/[0.04]">
              {exercises.map((ep) => (
                <div key={ep.id} className="px-4 py-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => ep.exercise && onPreviewExercise(ep.exercise)}
                      className="text-left group w-full"
                    >
                      <span className="text-sm text-text-primary group-hover:text-accent transition-colors truncate block">
                        {ep.exercise?.name ?? 'Unknown exercise'}
                      </span>
                      {ep.exercise && (
                        <ExerciseMetaBadges
                          exercise={ep.exercise}
                          fields={['equipment', 'bodyPart', 'movementPattern']}
                          className="mt-1"
                        />
                      )}
                    </button>
                  </div>
                  {ep.targetRepRange && (
                    <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-md shrink-0 border border-accent/20 mt-0.5">
                      {ep.targetRepRange}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-xs text-text-muted">
              No exercises listed for this session.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
