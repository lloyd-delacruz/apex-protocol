'use client';

import React from 'react';
import { 
  X, 
  Trophy, 
  Clock, 
  Flame, 
  Zap,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface FinishWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  stats: {
    duration: string;
    exercises: number;
    sets: number;
    volume: number; // total kg
    calories?: number;
  };
}

export default function FinishWorkoutModal({
  isOpen,
  onClose,
  onConfirm,
  stats
}: FinishWorkoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-surface border border-white/[0.08] rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Confetti-like background overlay */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-accent/20 to-transparent -z-10" />
        
        <div className="p-8 flex flex-col items-center text-center">
           <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-accent mb-6 shadow-accent-sm animate-bounce">
              <Trophy size={40} />
           </div>
           
           <h2 className="text-3xl font-black text-text-primary uppercase tracking-tight italic mb-2 leading-tight">
              Finish Session?
           </h2>
           <p className="text-sm font-medium text-text-muted max-w-[240px] mb-8">
              Great work! Let&apos;s wrap up and see how you leveled up today.
           </p>

           <div className="w-full grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-3xl bg-surface-elevated border border-white/[0.04] flex flex-col items-center">
                 <Clock size={20} className="text-accent mb-2" />
                 <span className="text-lg font-black text-text-primary uppercase tabular-nums">{stats.duration}</span>
                 <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Duration</span>
              </div>
              <div className="p-4 rounded-3xl bg-surface-elevated border border-white/[0.04] flex flex-col items-center">
                 <Flame size={20} className="text-orange-500 mb-2" />
                 <span className="text-lg font-black text-text-primary uppercase tabular-nums">{stats.volume}kg</span>
                 <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Volume</span>
              </div>
              <div className="p-4 rounded-3xl bg-surface-elevated border border-white/[0.04] flex flex-col items-center">
                 <Zap size={20} className="text-yellow-500 mb-2" />
                 <span className="text-lg font-black text-text-primary uppercase tabular-nums">{stats.exercises}</span>
                 <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Exercises</span>
              </div>
              <div className="p-4 rounded-3xl bg-surface-elevated border border-white/[0.04] flex flex-col items-center">
                 <TrendingUp size={20} className="text-success mb-2" />
                 <span className="text-lg font-black text-text-primary uppercase tabular-nums">{stats.sets}</span>
                 <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Sets Logged</span>
              </div>
           </div>

           <div className="w-full space-y-3">
              <Button 
                variant="primary" 
                fullWidth 
                className="h-16 rounded-[24px] text-base font-black uppercase tracking-widest gap-2 shadow-accent"
                onClick={onConfirm}
              >
                Log Session <TrendingUp size={20} />
              </Button>
              <Button 
                variant="ghost" 
                fullWidth 
                className="h-14 rounded-[20px] text-text-muted hover:text-text-primary text-sm font-bold uppercase tracking-widest"
                onClick={onClose}
              >
                Go Back
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
