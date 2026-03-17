'use client';

import { Dumbbell, CheckCircle2 } from 'lucide-react';
import { GeneratorState } from './ProgramGeneratorModal';

interface Props {
  state: GeneratorState;
  updateState: (updates: Partial<GeneratorState>) => void;
}

const equipOptions = [
    { id: 'Barbell', category: 'Free Weights' },
    { id: 'Dumbbell', category: 'Free Weights' },
    { id: 'Kettlebell', category: 'Free Weights' },
    { id: 'Cable', category: 'Machines' },
    { id: 'Machine', category: 'Machines' },
    { id: 'Smith Machine', category: 'Machines' },
    { id: 'Bodyweight', category: 'Other' },
    { id: 'Bands', category: 'Other' },
];

export default function ProgramGeneratorStepEquipment({ state, updateState }: Props) {
  
  const toggleEquipment = (eq: string) => {
    if (state.equipment.includes(eq)) {
        updateState({ equipment: state.equipment.filter(e => e !== eq) });
    } else {
        updateState({ equipment: [...state.equipment, eq] });
    }
  };

  const selectAll = () => updateState({ equipment: equipOptions.map(e => e.id) });
  const selectBasic = () => updateState({ equipment: ['Dumbbell', 'Bodyweight'] });

  // Group by category for visual organization
  const groupedOptions = equipOptions.reduce((acc, curr) => {
      if (!acc[curr.category]) acc[curr.category] = [];
      acc[curr.category].push(curr.id);
      return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="space-y-6 animate-fade-in py-4">
      <div className="text-center sm:text-left mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-text-primary mb-2 flex items-center justify-center sm:justify-start gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                    <Dumbbell className="w-6 h-6 text-accent" /> 
                </div>
                Available Equipment
            </h3>
            <p className="text-text-muted text-base">Select all the equipment you have consistent access to.</p>
          </div>
          
          <div className="flex items-center justify-center sm:justify-end gap-2 shrink-0">
             <button 
                onClick={selectBasic}
                className="text-xs font-medium px-3 py-1.5 rounded-md bg-white/[0.04] text-text-muted hover:bg-white/[0.08] transition-colors"
             >
                 Basic Setup
             </button>
             <button 
                onClick={selectAll}
                className="text-xs font-medium px-3 py-1.5 rounded-md bg-white/[0.04] text-text-muted hover:bg-white/[0.08] transition-colors"
             >
                 Full Gym
             </button>
          </div>
      </div>

      <div className="space-y-8">
          {Object.entries(groupedOptions).map(([category, items]) => (
             <div key={category}>
                 <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4 border-b border-white/[0.06] pb-2">
                     {category}
                 </h4>
                 <div className="flex flex-wrap gap-3">
                    {items.map(eq => {
                        const isSelected = state.equipment.includes(eq);
                        return (
                            <button 
                                key={eq}
                                onClick={() => toggleEquipment(eq)}
                                className={`
                                    group relative px-5 py-3 rounded-xl border-2 text-sm sm:text-base font-medium transition-all duration-200 flex items-center gap-3 overflow-hidden
                                    ${isSelected 
                                        ? 'bg-accent/10 border-accent/50 text-accent shadow-sm' 
                                        : 'bg-surface border-white/[0.08] text-text-muted hover:border-white/20 hover:text-text-primary hover:bg-white/[0.02]'}
                                `}
                            >
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-accent border-accent text-white' : 'border-text-muted/40 group-hover:border-text-muted/60'}`}>
                                   {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </div>
                                <span>{eq}</span>
                                
                                {isSelected && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent pointer-events-none" />
                                )}
                            </button>
                        );
                    })}
                 </div>
             </div>
          ))}
      </div>
      
      {state.equipment.length === 0 && (
          <div className="mt-4 p-4 rounded-card bg-warning/10 border border-warning/20 text-warning text-sm flex items-start gap-3">
              <Dumbbell className="w-5 h-5 shrink-0 mt-0.5" />
              <p>You must select at least one form of equipment. If you have no equipment, select "Bodyweight".</p>
          </div>
      )}
    </div>
  );
}
