'use client';

import { User } from 'lucide-react';
import { GeneratorState, ExperienceLevel } from './ProgramGeneratorModal';

interface Props {
  state: GeneratorState;
  updateState: (updates: Partial<GeneratorState>) => void;
  onNext: () => void;
}

const levels: { id: ExperienceLevel; label: string; desc: string; detail: string }[] = [
  { 
      id: 'beginner', 
      label: 'Beginner', 
      desc: '0-1 Years',
      detail: 'Learning fundamental movement patterns. Needs structured, simple progressions.' 
  },
  { 
      id: 'intermediate', 
      label: 'Intermediate', 
      desc: '1-3 Years',
      detail: 'Proficient in main lifts. Requires varied intensity and volume to continue adapting.' 
  },
  { 
      id: 'advanced', 
      label: 'Advanced', 
      desc: '3+ Years',
      detail: 'Highly skilled. Needs complex periodization and specific accessory work to break plateaus.' 
  },
];

export default function ProgramGeneratorStepExperience({ state, updateState, onNext }: Props) {
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto py-4">
      <div className="text-center sm:text-left mb-8">
         <h3 className="text-2xl font-bold text-text-primary mb-2 flex items-center justify-center sm:justify-start gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
                <User className="w-6 h-6 text-accent" /> 
            </div>
            Training Experience
        </h3>
        <p className="text-text-muted text-base">Select your current lifting experience to calibrate intensity and volume.</p>
      </div>

      <div className="flex flex-col gap-4">
        {levels.map((level) => {
          const isSelected = state.experience === level.id;
          return (
            <button
              key={level.id}
              onClick={() => updateState({ experience: level.id })}
              className={`
                relative p-5 sm:p-6 text-left rounded-xl transition-all duration-300 border-2 overflow-hidden group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6
                ${isSelected 
                  ? 'bg-accent/[0.04] border-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)] translate-x-2' 
                  : 'bg-surface border-white/[0.08] hover:border-white/20 hover:bg-white/[0.02]'}
              `}
            >
                {/* Selection Indicator */}
                <div className={`hidden sm:flex shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-200 items-center justify-center ${isSelected ? 'border-accent bg-accent' : 'border-white/20 group-hover:border-white/40'}`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white ml-[1px] mt-[1px]" />}
                </div>

                <div className="flex-1">
                    <div className="flex items-baseline gap-3 mb-1.5">
                        <span className={`font-heading text-lg sm:text-xl font-bold transition-colors ${isSelected ? 'text-accent' : 'text-text-primary group-hover:text-accent/80'}`}>
                            {level.label}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/[0.06] text-text-muted">
                            {level.desc}
                        </span>
                    </div>
                    <span className="block text-sm text-text-muted leading-relaxed">
                        {level.detail}
                    </span>
                 </div>
                 
                  {/* Subtle background glow effect when selected */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-accent/[0.02] to-transparent pointer-events-none" />
                )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
