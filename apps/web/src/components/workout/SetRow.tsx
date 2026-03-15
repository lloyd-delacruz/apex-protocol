'use client';

import { useState, useEffect } from 'react';
import StatusBadge from '../ui/StatusBadge';
import { TrainingStatus } from '@apex/shared';
import { calculateStatus } from '@/lib/progression';

const SET_NAMES = ['First Set', 'Second Set', 'Third Set', 'Fourth Set', 'Fifth Set'];

interface SetRowProps {
  setNumber: number;
  repMin: number;
  repMax: number;
  weightUnit: 'kg' | 'lb';
  isCurrentSet?: boolean;
  suggestedWeight?: number;
  onSetComplete: (data: {
    setNumber: number;
    weight: number;
    reps: number;
    status: TrainingStatus;
  }) => void;
  completed?: boolean;
  completedData?: {
    weight: number;
    reps: number;
    status: TrainingStatus;
  };
}

export default function SetRow({
  setNumber,
  repMin,
  repMax,
  weightUnit,
  isCurrentSet = false,
  suggestedWeight,
  onSetComplete,
  completed = false,
  completedData,
}: SetRowProps) {
  const [weight, setWeight] = useState(suggestedWeight?.toString() ?? '');
  const [reps, setReps] = useState('');
  const [status, setStatus] = useState<TrainingStatus | null>(null);

  const setLabel = SET_NAMES[setNumber - 1] ?? `Set ${setNumber}`;

  useEffect(() => {
    if (completed && completedData) {
      setWeight(completedData.weight.toString());
      setReps(completedData.reps.toString());
      setStatus(completedData.status);
    }
  }, [completed, completedData]);

  useEffect(() => {
    const repsNum = parseInt(reps, 10);
    if (!isNaN(repsNum) && repsNum > 0) {
      setStatus(calculateStatus(repsNum, repMin, repMax));
    } else {
      setStatus(null);
    }
  }, [reps, repMin, repMax]);

  function handleLog() {
    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps, 10);
    if (isNaN(weightNum) || isNaN(repsNum)) return;
    const computedStatus = calculateStatus(repsNum, repMin, repMax);
    onSetComplete({ setNumber, weight: weightNum, reps: repsNum, status: computedStatus });
  }

  const inputClass = `
    w-full bg-background text-text-primary text-center text-sm
    border rounded-[6px] px-2 py-2
    focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20
    transition-colors duration-150
    ${completed ? 'border-white/[0.04] opacity-60' : 'border-white/[0.08] hover:border-white/[0.14]'}
  `;

  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-card border transition-colors duration-150
        ${completed
          ? 'bg-success/[0.04] border-success/[0.12]'
          : isCurrentSet
            ? 'bg-accent/[0.03] border-accent/20'
            : 'bg-background border-white/[0.05] hover:border-white/[0.09]'
        }
      `}
    >
      {/* Set label + rep target */}
      <div className="w-20 flex-shrink-0">
        <span className={`text-xs font-semibold block ${
          completed ? 'text-success/80' : isCurrentSet ? 'text-accent' : 'text-text-muted'
        }`}>
          {setLabel}
        </span>
        <span className="text-[10px] text-text-muted leading-tight">
          {repMin}–{repMax} reps
        </span>
      </div>

      {/* Weight input */}
      <div className="flex-1 min-w-0">
        <input
          type="number"
          step="0.5"
          min="0"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="0"
          disabled={completed}
          className={inputClass}
        />
      </div>

      {/* Reps input */}
      <div className="flex-1 min-w-0">
        <input
          type="number"
          min="1"
          max="100"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder={`${repMin}–${repMax}`}
          disabled={completed}
          className={inputClass}
        />
      </div>

      {/* Status */}
      <div className="flex items-center justify-center w-20 flex-shrink-0">
        {status ? (
          <StatusBadge status={status} />
        ) : (
          <span className="text-xs text-text-muted">—</span>
        )}
      </div>

      {/* Log / Done */}
      <div className="flex items-center justify-center flex-shrink-0">
        {completed ? (
          <div className="w-7 h-7 rounded-full bg-success/15 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        ) : (
          <button
            onClick={handleLog}
            disabled={!weight || !reps}
            className={`
              w-7 h-7 rounded-[6px] flex items-center justify-center
              border transition-transform duration-150
              ${weight && reps
                ? 'border-accent/40 text-accent hover:bg-accent/10 active:scale-95'
                : 'border-white/[0.06] text-text-muted cursor-not-allowed'
              }
            `}
            title="Log set"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
