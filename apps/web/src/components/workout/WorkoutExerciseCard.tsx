'use client';

import React from 'react';
import { 
  MoreHorizontal, 
  ChevronRight, 
  CheckCircle2, 
  Plus, 
  Play,
  Info
} from 'lucide-react';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import { TrainingStatus } from '@apex/shared';

interface WorkoutExercise {
  prescriptionId: string;
  exerciseId: string;
  name: string;
  muscleGroup: string;
  setCount: number;
  repMin: number;
  repMax: number;
  mediaUrl?: string | null;
  equipment?: string | null;
  primaryMuscle?: string | null;
}

interface LoggedSet {
  setNumber: number;
  weight: number;
  reps: number;
  status: TrainingStatus;
  type: 'warmup' | 'working';
}

interface WorkoutExerciseCardProps {
  exercise: WorkoutExercise;
  loggedSets: LoggedSet[];
  isActive: boolean;
  onActivate: () => void;
  onLog: () => void;
  onOptions: () => void;
}

export default function WorkoutExerciseCard({
  exercise,
  loggedSets,
  isActive,
  onActivate,
  onLog,
  onOptions
}: WorkoutExerciseCardProps) {
  const workingSets = loggedSets.filter(s => s.type === 'working');
  const warmupSets = loggedSets.filter(s => s.type === 'warmup');
  
  const isComplete = workingSets.length >= exercise.setCount;
  const progress = Math.min(100, (workingSets.length / exercise.setCount) * 100);

  return (
    <Card 
      elevated={isActive}
      className={`overflow-hidden transition-all duration-300 ${
        isActive ? 'ring-2 ring-accent/30 bg-surface-elevated translate-y-[-2px]' : 'bg-surface hover:bg-surface-elevated/50'
      } ${isComplete ? 'opacity-80' : ''}`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
           <div className="flex gap-4 min-w-0">
              <div className="relative group cursor-pointer shrink-0" onClick={onActivate}>
                 <div className="w-16 h-16 rounded-2xl bg-background border border-white/[0.04] overflow-hidden">
                    {exercise.mediaUrl ? (
                      <img src={exercise.mediaUrl} alt={exercise.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted bg-gradient-to-br from-surface to-background">
                        <Play size={24} fill="currentColor" className="ml-1" />
                      </div>
                    )}
                 </div>
                 {isComplete && (
                   <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-success rounded-full flex items-center justify-center text-white border-2 border-surface animate-in zoom-in-50">
                      <CheckCircle2 size={14} strokeWidth={3} />
                   </div>
                 )}
              </div>

              <div className="min-w-0">
                 <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">
                       {exercise.primaryMuscle || exercise.muscleGroup}
                    </span>
                    {isComplete && (
                       <span className="text-[10px] font-black text-success uppercase tracking-widest leading-none">
                          Complete
                       </span>
                    )}
                 </div>
                  <h3 className="text-lg font-bold text-text-primary tracking-tight truncate leading-tight mb-1 group-hover:text-accent transition-colors">
                    {exercise.name}
                  </h3>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    {exercise.setCount} Sets · {exercise.repMin}-{exercise.repMax} Reps
                  </p>
              </div>
           </div>

           <button 
            onClick={onOptions}
            className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-text-muted transition-colors shrink-0"
           >
             <MoreHorizontal size={20} />
           </button>
        </div>

        {/* Set Bubbles / Progress */}
        <div className="flex items-center gap-2 mb-6 pointer-events-none">
           {Array.from({ length: exercise.setCount }).map((_, i) => {
              const set = workingSets[i];
              return (
                <div 
                  key={i}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                    set ? 'bg-accent shadow-accent-sm' : 'bg-white/10'
                  }`}
                />
              );
           })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3">
           <button
            onClick={onLog}
            className={`flex-1 h-12 rounded-2xl font-black uppercase tracking-[0.1em] text-[11px] flex items-center justify-center gap-2 transition-all active:scale-95 ${
              isComplete 
                ? 'bg-surface-elevated text-text-muted border border-white/[0.04]' 
                : 'bg-accent text-white shadow-accent-sm hover:brightness-110'
            }`}
           >
             {isComplete ? 'Log More' : 'Log Set'}
             {!isComplete && <Plus size={16} />}
           </button>
           
           <button 
             onClick={onActivate}
             className="w-12 h-12 rounded-2xl bg-surface-elevated flex items-center justify-center text-text-muted hover:text-text-primary border border-white/[0.04] transition-all"
           >
             <Info size={18} />
           </button>
        </div>
      </div>
      
      {/* Inline Sets Summary (Optional/Toggled?) - For now just show working sets if any */}
      {workingSets.length > 0 && (
         <div className="px-5 pb-5 border-t border-white/[0.04] pt-4 grid grid-cols-2 gap-3">
            {workingSets.slice(-2).map((set, i) => (
               <div key={i} className="bg-white/[0.02] rounded-xl p-2.5 flex items-center justify-between border border-white/[0.04]">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Set {set.setNumber}</span>
                  <span className="text-xs font-black text-text-primary">{set.weight}kg × {set.reps}</span>
               </div>
            ))}
         </div>
      )}
    </Card>
  );
}
