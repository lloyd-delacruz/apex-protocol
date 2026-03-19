'use client';

import React from 'react';
import { 
  X, 
  RefreshCw, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Info,
  Heart,
  Ban,
  ChevronRight,
  Minus
} from 'lucide-react';
import Button from '@/components/ui/Button';

interface ExerciseOptionsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  onReplace: () => void;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onTogglePreference: (pref: 'more' | 'less' | 'exclude') => void;
}

export default function ExerciseOptionsBottomSheet({
  isOpen,
  onClose,
  exerciseName,
  onReplace,
  onRemove,
  onMove,
  onTogglePreference
}: ExerciseOptionsBottomSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="w-full max-w-lg bg-surface border-t border-white/[0.08] rounded-t-[32px] flex flex-col p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300"
      >
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />

        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-black text-text-primary uppercase tracking-tight italic">
              Exercise Options
           </h3>
           <button 
             onClick={onClose}
             className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
           >
             <X size={20} />
           </button>
        </div>

        <div className="mb-8">
           <p className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] mb-2">Selected Exercise</p>
           <h4 className="text-lg font-black text-accent uppercase tracking-tight">{exerciseName}</h4>
        </div>

        <div className="space-y-3">
           <button 
             onClick={onReplace}
             className="w-full p-5 rounded-3xl bg-surface-elevated border border-white/[0.04] flex items-center justify-between group hover:border-accent/40 transition-all"
           >
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                    <RefreshCw size={24} />
                 </div>
                 <div className="text-left">
                    <span className="block text-sm font-black text-text-primary uppercase tracking-tight">Replace Exercise</span>
                    <span className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mt-0.5">Find a similar alternative</span>
                 </div>
              </div>
              <ChevronRight size={20} className="text-text-muted" />
           </button>

           <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => onMove('up')}
                className="flex-1 p-5 rounded-3xl bg-surface-elevated border border-white/[0.04] flex flex-col items-center gap-2 group hover:border-accent/40 transition-all"
              >
                 <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-text-muted group-hover:bg-text-primary group-hover:text-background transition-all">
                    <ArrowUp size={20} />
                 </div>
                 <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Move Up</span>
              </button>
              <button 
                onClick={() => onMove('down')}
                className="flex-1 p-5 rounded-3xl bg-surface-elevated border border-white/[0.04] flex flex-col items-center gap-2 group hover:border-accent/40 transition-all"
              >
                 <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-text-muted group-hover:bg-text-primary group-hover:text-background transition-all">
                    <ArrowDown size={20} />
                 </div>
                 <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Move Down</span>
              </button>
           </div>

           <button 
             onClick={onRemove}
             className="w-full p-5 rounded-3xl bg-danger/5 border border-danger/10 flex items-center justify-between group hover:bg-danger/10 hover:border-danger/30 transition-all"
           >
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center text-danger group-hover:bg-danger group-hover:text-white transition-all">
                    <Trash2 size={24} />
                 </div>
                 <div className="text-left">
                    <span className="block text-sm font-black text-danger uppercase tracking-tight">Remove</span>
                    <span className="block text-[10px] font-bold text-danger/60 uppercase tracking-widest mt-0.5">Delete from this session</span>
                 </div>
              </div>
              <ChevronRight size={20} className="text-danger/40" />
           </button>
        </div>

        <div className="mt-8 pt-8 border-t border-white/[0.06]">
           <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Personalize Future Workouts</p>
           <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => onTogglePreference('more')}
                className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-surface-elevated border border-white/[0.04] hover:border-success/30 transition-all"
              >
                 <Heart size={20} className="text-success" />
                 <span className="text-[10px] font-black text-text-primary uppercase tracking-tight">More</span>
              </button>
              <button 
                onClick={() => onTogglePreference('less')}
                className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-surface-elevated border border-white/[0.04] hover:border-yellow-500/30 transition-all"
              >
                 <Minus size={20} className="text-yellow-500" />
                 <span className="text-[10px] font-black text-text-primary uppercase tracking-tight">Less</span>
              </button>
              <button 
                onClick={() => onTogglePreference('exclude')}
                className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-surface-elevated border border-white/[0.04] hover:border-danger/30 transition-all"
              >
                 <Ban size={20} className="text-danger" />
                 <span className="text-[10px] font-black text-text-primary uppercase tracking-tight">Exclude</span>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
