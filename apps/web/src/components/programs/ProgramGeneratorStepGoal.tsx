'use client';

import { Target } from 'lucide-react';
import { GeneratorState } from './ProgramGeneratorModal';
import { GoalType } from './GoalSelectionModal';

interface Props {
  state: GeneratorState;
  updateState: (updates: Partial<GeneratorState>) => void;
  onNext: () => void;
}

const goals: { id: GoalType; label: string; desc: string }[] = [
  { id: 'strength',    label: 'Strength',       desc: 'Maximize your 1RM and overall power output.' },
  { id: 'hypertrophy', label: 'Muscle Growth',   desc: 'Focus on building muscle mass and size.' },
  { id: 'fat_loss',    label: 'Fat Loss',        desc: 'High intensity to burn fat and retain muscle.' },
  { id: 'endurance',   label: 'Endurance',       desc: 'Improve cardiovascular health and stamina.' },
  { id: 'athletic',    label: 'Athleticism',     desc: 'Functional strength, speed, and agility.' },
  { id: 'general',     label: 'General Fitness', desc: 'Well-rounded approach for overall health.' },
  { id: 'mobility',    label: 'Mobility',        desc: 'Improve flexibility and joint health.' },
];

const MAX_GOALS = 3;

export default function ProgramGeneratorStepGoal({ state, updateState }: Props) {
  const selected = state.goals;

  const toggle = (id: GoalType) => {
    if (selected.includes(id)) {
      // Always allow deselect
      updateState({ goals: selected.filter((g) => g !== id) });
    } else if (selected.length < MAX_GOALS) {
      updateState({ goals: [...selected, id] });
    }
  };

  const isMaxed = selected.length >= MAX_GOALS;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center sm:text-left mb-6">
        <h3 className="text-2xl font-bold text-text-primary mb-2 flex items-center justify-center sm:justify-start gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Target className="w-6 h-6 text-accent" />
          </div>
          Primary Objectives
        </h3>
        <p className="text-text-muted text-base">
          Select up to {MAX_GOALS} goals. Choosing both Strength &amp; Muscle Growth produces a
          Power-Hypertrophy split — the foundation of the Apex Protocol Base Program.
        </p>
      </div>

      {/* Goal count indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              n <= selected.length ? 'bg-accent' : 'bg-white/[0.08]'
            }`}
          />
        ))}
        <span className="text-xs text-text-muted ml-1 tabular-nums">
          {selected.length}/{MAX_GOALS}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {goals.map((goal) => {
          const isSelected = selected.includes(goal.id);
          const isDisabled = !isSelected && isMaxed;
          const selectionIndex = selected.indexOf(goal.id);

          return (
            <button
              key={goal.id}
              onClick={() => toggle(goal.id)}
              disabled={isDisabled}
              className={`
                relative p-5 text-left rounded-xl transition-all duration-200 border-2 overflow-hidden group
                ${isSelected
                  ? 'bg-accent/[0.06] border-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]'
                  : isDisabled
                    ? 'bg-surface border-white/[0.04] opacity-40 cursor-not-allowed'
                    : 'bg-surface border-white/[0.08] hover:border-white/20 hover:bg-white/[0.02]'}
              `}
            >
              {/* Selection badge — shows order of selection (1st, 2nd, 3rd) */}
              <div className={`
                absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold
                transition-all duration-200
                ${isSelected
                  ? 'border-accent bg-accent text-white'
                  : 'border-white/20 group-hover:border-white/40'}
              `}>
                {isSelected && (selectionIndex + 1)}
              </div>

              <span className={`block font-heading text-lg font-bold mb-1.5 pr-8 transition-colors ${
                isSelected ? 'text-accent' : 'text-text-primary group-hover:text-accent/80'
              }`}>
                {goal.label}
              </span>
              <span className="block text-sm text-text-muted leading-relaxed pr-8">
                {goal.desc}
              </span>

              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* Strength + Hypertrophy callout */}
      {selected.includes('strength') && selected.includes('hypertrophy') && (
        <div className="p-4 rounded-xl bg-accent/[0.06] border border-accent/20 text-sm text-accent animate-fade-in">
          <span className="font-semibold">Power-Hypertrophy selected.</span>
          <span className="text-text-muted ml-1">
            Your program will use the Upper/Lower split from the Apex Protocol 12-Week Base Program —
            strength days (4–6 reps) paired with hypertrophy days (8–12 reps).
          </span>
        </div>
      )}
    </div>
  );
}
