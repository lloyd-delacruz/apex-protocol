'use client';

import { useState } from 'react';
import { TrendingUp, ChevronDown, ChevronUp, X } from 'lucide-react';
import api, { ApiPendingProgression } from '@/lib/api';
import ProgressionConfirmModal from './ProgressionConfirmModal';

interface Props {
  progressions: ApiPendingProgression[];
  onUpdate: (updated: ApiPendingProgression[]) => void;
}

export default function ProgressionPromptBanner({ progressions, onUpdate }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [activeProgression, setActiveProgression] = useState<ApiPendingProgression | null>(null);

  if (progressions.length === 0) return null;

  async function handleConfirm(progression: ApiPendingProgression, incrementPct: number) {
    if (!progression.achievedWeight) return;
    await api.progression.confirm({
      trainingLogId: progression.trainingLogId,
      exerciseId: progression.exerciseId,
      currentWeight: progression.achievedWeight,
      incrementPct,
      weightUnit: progression.weightUnit as 'kg' | 'lb',
    });
    onUpdate(progressions.filter((p) => p.trainingLogId !== progression.trainingLogId));
    setActiveProgression(null);
  }

  async function handleDismiss(progression: ApiPendingProgression) {
    await api.progression.dismiss(progression.trainingLogId);
    onUpdate(progressions.filter((p) => p.trainingLogId !== progression.trainingLogId));
    setActiveProgression(null);
  }

  async function handleDismissAll() {
    await Promise.all(progressions.map((p) => api.progression.dismiss(p.trainingLogId).catch(() => null)));
    onUpdate([]);
  }

  return (
    <>
      <div className="rounded-xl border border-success/20 bg-success/[0.04] overflow-hidden">
        {/* Banner header */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-success/[0.04] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-success/10">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <div>
              <span className="text-sm font-semibold text-success">
                {progressions.length} exercise{progressions.length !== 1 ? 's' : ''} ready to progress
              </span>
              <p className="text-xs text-success/60 mt-0.5">
                You hit all target reps — time to increase the weight
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); handleDismissAll(); }}
              className="text-text-muted hover:text-text-primary transition-colors p-1 rounded"
              title="Dismiss all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {expanded
              ? <ChevronUp className="w-4 h-4 text-success/60" />
              : <ChevronDown className="w-4 h-4 text-success/60" />
            }
          </div>
        </button>

        {/* Progression list */}
        {expanded && (
          <div className="border-t border-success/10 divide-y divide-success/[0.06]">
            {progressions.map((p) => (
              <div key={p.trainingLogId} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{p.exerciseName}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {p.achievedWeight != null
                      ? `Achieved ${p.achievedWeight}${p.weightUnit}`
                      : 'Target achieved'}
                    {p.muscleGroup && <span className="ml-2 text-text-muted/60">· {p.muscleGroup}</span>}
                  </p>
                </div>
                <button
                  onClick={() => setActiveProgression(p)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20 text-success text-xs font-semibold hover:bg-success/20 transition-colors"
                >
                  <TrendingUp className="w-3 h-3" />
                  Set weight
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeProgression && (
        <ProgressionConfirmModal
          progression={activeProgression}
          onConfirm={(pct) => handleConfirm(activeProgression, pct)}
          onDismiss={() => handleDismiss(activeProgression)}
          onClose={() => setActiveProgression(null)}
        />
      )}
    </>
  );
}
