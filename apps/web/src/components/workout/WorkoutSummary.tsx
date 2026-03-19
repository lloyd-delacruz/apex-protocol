'use client';

import React from 'react';
import { Trophy, Clock, Flame, Zap, Activity, Share2, CheckCircle2, ArrowRight } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface WorkoutSummaryProps {
  stats: {
    duration: string;
    exercises: number;
    sets: number;
    volume: number;
  };
  onClose: () => void;
}

export default function WorkoutSummary({ stats, onClose }: WorkoutSummaryProps) {
  return (
    <div className="max-w-2xl mx-auto py-12 px-6 text-center animate-in zoom-in-95 duration-700">
      {/* Massive Trophy Header */}
      <div className="relative isolate mb-12">
         <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full scale-150 animate-pulse" />
         <div className="w-32 h-32 rounded-full bg-accent/10 flex items-center justify-center text-accent mx-auto border border-accent/20 relative shadow-accent">
            <Trophy size={64} strokeWidth={1.5} />
         </div>
         <div className="absolute top-0 right-[35%] w-8 h-8 rounded-full bg-success flex items-center justify-center text-white border-4 border-background -mr-2">
            <CheckCircle2 size={16} strokeWidth={3} />
         </div>
      </div>

      <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none">
         Legacy <span className="text-accent underline decoration-white/10 underline-offset-8">Cemented</span>
      </h1>
      <p className="text-text-muted font-black uppercase tracking-[0.3em] mb-12 flex items-center justify-center gap-2">
         <Zap size={14} className="text-accent" /> Session archived. Streak extended. <Zap size={14} className="text-accent" />
      </p>
      
      {/* Stats Podium */}
      <Card className="p-10 mb-12 bg-surface-elevated border border-white/[0.08] rounded-[48px] overflow-hidden relative group">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent-secondary" />
         
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="flex flex-col items-center group/stat">
               <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center text-text-muted mb-4 group-hover/stat:text-accent group-hover/stat:bg-accent/10 transition-colors">
                  <Clock size={24} />
               </div>
               <span className="text-3xl font-black text-text-primary tabular-nums group-hover/stat:scale-110 transition-transform">{stats.duration}</span>
               <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-2">Duration</span>
            </div>
            
            <div className="flex flex-col items-center group/stat">
               <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center text-text-muted mb-4 group-hover/stat:text-orange-500 group-hover/stat:bg-orange-500/10 transition-colors">
                  <Flame size={24} />
               </div>
               <span className="text-3xl font-black text-text-primary tabular-nums group-hover/stat:scale-110 transition-transform">{(stats.volume / 1000).toFixed(1)}t</span>
               <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-2">Volume</span>
            </div>

            <div className="flex flex-col items-center group/stat">
               <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center text-text-muted mb-4 group-hover/stat:text-yellow-500 group-hover/stat:bg-yellow-500/10 transition-colors">
                  <Zap size={24} />
               </div>
               <span className="text-3xl font-black text-text-primary tabular-nums group-hover/stat:scale-110 transition-transform">{stats.sets}</span>
               <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-2">Total Sets</span>
            </div>

            <div className="flex flex-col items-center group/stat">
               <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center text-text-muted mb-4 group-hover/stat:text-success group-hover/stat:bg-success/10 transition-colors">
                  <Activity size={24} />
               </div>
               <span className="text-3xl font-black text-text-primary tabular-nums group-hover/stat:scale-110 transition-transform">124</span>
               <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-2">XP Earned</span>
            </div>
         </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-5 justify-center">
         <Button 
           variant="primary" 
           className="h-20 px-12 rounded-[32px] font-black uppercase tracking-widest text-lg shadow-accent italic flex gap-3 group/btn"
           onClick={onClose}
         >
           Return to Base <ArrowRight size={24} className="group-hover/btn:translate-x-1 transition-transform" />
         </Button>
         <Button 
           variant="secondary" 
           className="h-20 px-10 rounded-[32px] font-black uppercase tracking-widest text-lg border-white/[0.08] flex gap-3"
           onClick={() => {}}
         >
           Share Protocol <Share2 size={24} />
         </Button>
      </div>

      <div className="mt-12">
         <button className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] hover:text-white transition-colors">
            Tap to view full session logs
         </button>
      </div>
    </div>
  );
}
