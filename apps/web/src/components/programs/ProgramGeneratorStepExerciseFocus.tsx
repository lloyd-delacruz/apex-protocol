'use client';

import { Layers, Zap, CheckCircle2 } from 'lucide-react';
import { GeneratorState } from './ProgramGeneratorModal';

interface Props {
  state: GeneratorState;
  updateState: (updates: Partial<GeneratorState>) => void;
}

const COMPOUND_OPTIONS: { id: GeneratorState['compoundPreference']; label: string; desc: string }[] = [
  {
    id: 'compound',
    label: 'Compound Focus',
    desc: 'Prioritise multi-joint movements — builds strength and size efficiently across multiple muscle groups.',
  },
  {
    id: 'mixed',
    label: 'Mixed (Recommended)',
    desc: 'A balance of compound and isolation exercises for complete development and muscle detail.',
  },
  {
    id: 'isolation',
    label: 'Isolation Focus',
    desc: 'Emphasise single-joint exercises to target specific muscles and maximise hypertrophy detail.',
  },
];

export default function ProgramGeneratorStepExerciseFocus({ state, updateState }: Props) {
  return (
    <div className="space-y-6 animate-fade-in py-4">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Layers className="w-6 h-6 text-accent" />
          </div>
          Exercise Focus
        </h3>
        <p className="text-text-muted text-base">
          Choose how the program should prioritise exercise types when building your workout days.
        </p>
      </div>

      <div className="space-y-3">
        {COMPOUND_OPTIONS.map((opt) => {
          const isSelected = state.compoundPreference === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => updateState({ compoundPreference: opt.id })}
              className={`
                group w-full flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all duration-200
                ${isSelected
                  ? 'bg-accent/10 border-accent/50 shadow-sm'
                  : 'bg-surface border-white/[0.08] hover:border-white/20 hover:bg-white/[0.02]'}
              `}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isSelected ? 'bg-accent border-accent text-white' : 'border-text-muted/40 group-hover:border-text-muted/70'}`}>
                {isSelected && <CheckCircle2 className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-base font-semibold transition-colors ${isSelected ? 'text-accent' : 'text-text-primary'}`}>
                    {opt.label}
                  </p>
                  {opt.id === 'mixed' && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-accent/20 text-accent border border-accent/30">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-muted mt-1 leading-relaxed">{opt.desc}</p>
              </div>
              {isSelected && (
                <Zap className="w-4 h-4 text-accent shrink-0 mt-1" />
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-text-muted px-1 pt-2">
        This influences which exercises are selected during generation. You can always swap individual exercises after the program is created.
      </p>
    </div>
  );
}
