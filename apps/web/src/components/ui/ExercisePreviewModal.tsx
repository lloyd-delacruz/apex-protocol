'use client';

import { useState, useEffect } from 'react';
import { X, Dumbbell, Target, BarChart2, Layers, User, Zap } from 'lucide-react';
import api, { ApiExercise, ApiExerciseDetail } from '@/lib/api';
import ExerciseMetaBadges from './ExerciseMetaBadges';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function ExerciseImage({ mediaUrl, name }: { mediaUrl?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);

  if (!mediaUrl || failed) return null;

  return (
    <div className="rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] flex items-center justify-center" style={{ minHeight: 180 }}>
      <img
        src={mediaUrl}
        alt={`${name} demonstration`}
        className="w-full object-contain max-h-52"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-1.5">
      {children}
    </p>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  /** Pass a minimal exercise object (from prescription data). Full detail will be fetched. */
  exercise: ApiExercise;
  onClose: () => void;
}

export default function ExercisePreviewModal({ exercise, onClose }: Props) {
  const [detail, setDetail] = useState<ApiExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.exercises.get(exercise.id)
      .then(({ exercise: ex }) => {
        if (!cancelled) setDetail(ex);
      })
      .catch(() => {
        // Graceful fallback — show what we already have
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [exercise.id]);

  // Use fetched detail or fall back to the base exercise passed in
  const ex: ApiExercise = detail ?? exercise;
  const substitutions = detail?.substitutions ?? [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[85vh] flex flex-col bg-surface-elevated rounded-card border border-white/[0.08] shadow-[0_24px_48px_rgba(0,0,0,0.5)]">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/[0.08]">
          <div className="flex-1 min-w-0">
            <h2 className="font-heading text-base font-bold text-text-primary leading-tight">{ex.name}</h2>
            {ex.exerciseType && (
              <p className="text-xs text-text-muted mt-0.5 capitalize">{formatLabel(ex.exerciseType)}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-card hover:bg-white/[0.06] text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Exercise image/GIF */}
          <ExerciseImage mediaUrl={ex.mediaUrl} name={ex.name} />

          {/* Meta badges */}
          <ExerciseMetaBadges
            exercise={ex}
            fields={['equipment', 'bodyPart', 'movementPattern', 'difficulty']}
            className="gap-1.5"
          />

          {/* Muscle targets */}
          {(ex.primaryMuscle || (ex.secondaryMuscles && ex.secondaryMuscles.length > 0)) && (
            <div>
              <SectionLabel>Muscles</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {ex.primaryMuscle && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                    <Target className="w-3 h-3" />
                    {ex.primaryMuscle}
                  </span>
                )}
                {ex.secondaryMuscles?.map((m) => (
                  <span key={m} className="inline-flex items-center px-2 py-1 rounded-md text-xs text-text-muted bg-white/[0.04] border border-white/[0.08]">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Attributes row */}
          <div className="grid grid-cols-2 gap-2">
            {ex.isCompound !== undefined && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-card bg-white/[0.03] border border-white/[0.06]">
                <Layers className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Type</p>
                  <p className="text-xs font-medium text-text-primary">{ex.isCompound ? 'Compound' : 'Isolation'}</p>
                </div>
              </div>
            )}
            {ex.isUnilateral !== undefined && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-card bg-white/[0.03] border border-white/[0.06]">
                <User className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Load</p>
                  <p className="text-xs font-medium text-text-primary">{ex.isUnilateral ? 'Unilateral' : 'Bilateral'}</p>
                </div>
              </div>
            )}
            {ex.equipment && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-card bg-white/[0.03] border border-white/[0.06]">
                <Dumbbell className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Equipment</p>
                  <p className="text-xs font-medium text-text-primary capitalize">{formatLabel(ex.equipment)}</p>
                </div>
              </div>
            )}
            {ex.movementPattern && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-card bg-white/[0.03] border border-white/[0.06]">
                <BarChart2 className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Pattern</p>
                  <p className="text-xs font-medium text-text-primary">{formatLabel(ex.movementPattern)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Goal tags */}
          {ex.goalTags && ex.goalTags.length > 0 && (
            <div>
              <SectionLabel>Training Goals</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {ex.goalTags.map((g) => (
                  <span key={g} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/[0.06] text-text-muted border border-white/[0.08]">
                    <Zap className="w-2.5 h-2.5" />
                    {formatLabel(g)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {ex.instructions && (
            <div>
              <SectionLabel>Instructions</SectionLabel>
              <p className="text-sm text-text-muted leading-relaxed">{ex.instructions}</p>
            </div>
          )}

          {/* Substitutions */}
          {loading && (
            <p className="text-xs text-text-muted text-center py-2">Loading details...</p>
          )}

          {!loading && substitutions.length > 0 && (
            <div>
              <SectionLabel>Substitutions</SectionLabel>
              <div className="space-y-1">
                {substitutions.slice(0, 5).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-card bg-white/[0.02] border border-white/[0.05]">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{sub.substituteExercise.name}</p>
                      {sub.substituteExercise.primaryMuscle && (
                        <p className="text-[10px] text-text-muted">{sub.substituteExercise.primaryMuscle}</p>
                      )}
                    </div>
                    {sub.notes && (
                      <p className="text-[10px] text-text-muted shrink-0">{sub.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-card text-sm font-medium text-text-primary bg-white/[0.06] hover:bg-white/[0.10] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
