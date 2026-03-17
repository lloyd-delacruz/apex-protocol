'use client';

import { Calendar } from 'lucide-react';
import { GeneratorState } from './ProgramGeneratorModal';

interface Props {
  state: GeneratorState;
  updateState: (updates: Partial<GeneratorState>) => void;
}

export default function ProgramGeneratorStepTrainingDays({ state, updateState }: Props) {
  const daysOptions = [2, 3, 4, 5, 6, 7];

  const getDayDescription = (days: number) => {
      switch(days) {
          case 2: return "Maintenance or minimalist scheduling. Typically full-body sessions.";
          case 3: return "Balanced minimum. Usually full-body or upper/lower splits.";
          case 4: return "Optimal for most. Allows for upper/lower or push/pull splits with adequate recovery.";
          case 5: return "High volume. Typically body-part splits or push/pull/legs splits.";
          case 6: return "Very high volume. Requires excellent recovery protocols. Usually PPL splits.";
          case 7: return "Extreme volume. Not recommended for most without active recovery days included.";
          default: return "";
      }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto py-4">
      <div className="text-center sm:text-left mb-10">
         <h3 className="text-2xl font-bold text-text-primary mb-2 flex items-center justify-center sm:justify-start gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
                <Calendar className="w-6 h-6 text-accent" /> 
            </div>
            Training Frequency
        </h3>
        <p className="text-text-muted text-base">How many days per week can you realistically commit to training?</p>
      </div>

      <div className="bg-surface rounded-2xl border border-white/[0.08] p-6 sm:p-10 shadow-inner">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-8">
            {daysOptions.map(d => {
                const isSelected = state.days === d;
                return (
                <button 
                    key={d}
                    onClick={() => updateState({ days: d })}
                    className={`
                        relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl text-xl sm:text-2xl font-bold transition-all duration-300
                        ${isSelected 
                            ? 'bg-accent text-white shadow-[0_8px_30px_rgba(var(--accent-rgb),0.4)] scale-110 -translate-y-2' 
                            : 'bg-white/[0.04] text-text-muted hover:bg-white/[0.08] hover:text-text-primary hover:-translate-y-1'}
                    `}
                >
                    {d}
                    {isSelected && (
                        <div className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
                    )}
                </button>
                );
            })}
          </div>

          <div className="max-w-md mx-auto text-center h-20 flex flex-col items-center justify-start transition-opacity duration-300">
                <h4 className="text-xl font-bold text-accent mb-2">
                    {state.days} Days / Week
                </h4>
                <p className="text-sm text-text-muted leading-relaxed">
                    {getDayDescription(state.days)}
                </p>
          </div>
      </div>
    </div>
  );
}
