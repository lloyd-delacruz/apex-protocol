'use client';

import { useState } from 'react';
import { TrendingUp, X, CheckCircle2, AlertCircle, Minus, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ApiPendingProgression } from '@/lib/api';

interface Props {
  progression: ApiPendingProgression;
  onConfirm: (incrementPct: number) => Promise<void>;
  onDismiss: () => Promise<void>;
  onClose: () => void;
}

const PRESET_PCTS = [1, 2, 2.5, 5];

export default function ProgressionConfirmModal({ progression, onConfirm, onDismiss, onClose }: Props) {
  const [selectedPct, setSelectedPct] = useState(2.5);
  const [customPct, setCustomPct] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePct = isCustom ? parseFloat(customPct) || 0 : selectedPct;
  const currentWeight = progression.achievedWeight ?? 0;
  const newWeight = currentWeight > 0
    ? Math.round(currentWeight * (1 + activePct / 100) * 2) / 2
    : null;
  const unit = progression.weightUnit;

  async function handleConfirm() {
    if (activePct <= 0 || activePct > 20) {
      setError('Increment must be between 0.5% and 20%.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onConfirm(activePct);
    } catch {
      setError('Failed to save progression. Try again.');
      setSaving(false);
    }
  }

  async function handleDismiss() {
    setSaving(true);
    try {
      await onDismiss();
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-surface-elevated border border-white/[0.08] rounded-modal w-full max-w-sm shadow-elevated animate-slide-up">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-text-primary">Increase Weight</h3>
              <p className="text-xs text-text-muted mt-0.5">{progression.exerciseName}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={saving} className="text-text-muted hover:text-text-primary transition-colors p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Achievement callout */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-success/[0.06] border border-success/20">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <p className="text-sm text-success leading-snug">
              All sets achieved at <span className="font-bold">{currentWeight > 0 ? `${currentWeight}${unit}` : '—'}</span>
              {progression.sessionDate && (
                <span className="text-success/70 ml-1">
                  ({new Date(progression.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                </span>
              )}
            </p>
          </div>

          {/* Increment selector */}
          <div>
            <p className="text-xs text-text-muted font-medium mb-3 uppercase tracking-wider">Select increment</p>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PRESET_PCTS.map((pct) => (
                <button
                  key={pct}
                  onClick={() => { setSelectedPct(pct); setIsCustom(false); setCustomPct(''); }}
                  className={`py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    !isCustom && selectedPct === pct
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-white/[0.08] text-text-muted hover:border-white/20 hover:text-text-primary'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setIsCustom(true); setCustomPct(''); }}
                className={`flex-shrink-0 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                  isCustom
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-white/[0.08] text-text-muted hover:border-white/20'
                }`}
              >
                Custom
              </button>
              {isCustom && (
                <div className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => setCustomPct((prev) => String(Math.max(0.5, (parseFloat(prev) || 1) - 0.5)))}
                    className="w-7 h-7 flex items-center justify-center rounded border border-white/[0.08] text-text-muted hover:text-text-primary transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="20"
                      value={customPct}
                      onChange={(e) => setCustomPct(e.target.value)}
                      placeholder="e.g. 3"
                      autoFocus
                      className="w-full bg-background text-text-primary text-sm text-center border border-white/[0.08] rounded-lg px-2 py-1.5 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">%</span>
                  </div>
                  <button
                    onClick={() => setCustomPct((prev) => String(Math.min(20, (parseFloat(prev) || 1) + 0.5)))}
                    className="w-7 h-7 flex items-center justify-center rounded border border-white/[0.08] text-text-muted hover:text-text-primary transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Weight preview */}
          {newWeight !== null && currentWeight > 0 && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-white/[0.06]">
              <div className="text-center flex-1">
                <div className="text-xs text-text-muted mb-1">Current</div>
                <div className="text-lg font-bold text-text-primary">{currentWeight}<span className="text-sm text-text-muted ml-1">{unit}</span></div>
              </div>
              <div className="text-accent">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-center flex-1">
                <div className="text-xs text-text-muted mb-1">Next session</div>
                <div className="text-lg font-bold text-success">{newWeight}<span className="text-sm text-success/70 ml-1">{unit}</span></div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 flex flex-col gap-2">
          <Button
            variant="primary"
            fullWidth
            onClick={handleConfirm}
            loading={saving}
            disabled={saving || activePct <= 0}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Confirm +{activePct > 0 ? activePct : '—'}%
            {newWeight && currentWeight > 0 && ` → ${newWeight}${unit}`}
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={handleDismiss}
            disabled={saving}
            className="text-text-muted"
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
