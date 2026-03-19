'use client';

import React from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Target, 
  ArrowUpRight,
  Dumbbell,
  Activity
} from 'lucide-react';
import Card from '@/components/ui/Card';

interface WeeklyProgressStatsProps {
  totalVolume: number;
  sessions: number;
  setsCompleted: number;
  timeUnderTension?: number;
  volumeChangePct: number;
}

export default function WeeklyProgressStats({
  totalVolume,
  sessions,
  setsCompleted,
  volumeChangePct
}: WeeklyProgressStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Main Volume Card */}
      <Card className="p-6 bg-surface border border-white/[0.08] rounded-[32px] md:col-span-2 overflow-hidden relative">
         <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-3xl" />
         
         <div className="flex items-start justify-between relative z-10">
            <div>
               <p className="text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-1">Weekly Training Volume</p>
               <h3 className="text-4xl font-black text-text-primary italic tracking-tight tabular-nums">
                  {(totalVolume / 1000).toFixed(1)} <span className="text-sm font-bold uppercase not-italic tracking-widest">Tons</span>
               </h3>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full border ${
               volumeChangePct >= 0 ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'
            }`}>
               <TrendingUp size={14} className={volumeChangePct < 0 ? 'rotate-180' : ''} />
               <span className="text-xs font-black tabular-nums">{Math.abs(volumeChangePct)}%</span>
            </div>
         </div>
         
         <div className="mt-8 grid grid-cols-3 gap-8">
            <div className="space-y-1">
               <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total Sets</p>
               <p className="text-xl font-black text-text-primary tracking-tight tabular-nums">{setsCompleted}</p>
            </div>
            <div className="space-y-1">
               <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Sessions</p>
               <p className="text-xl font-black text-text-primary tracking-tight tabular-nums">{sessions}</p>
            </div>
            <div className="space-y-1">
               <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Active Time</p>
               <p className="text-xl font-black text-text-primary tracking-tight tabular-nums">4.2h</p>
            </div>
         </div>
      </Card>

      {/* Progress Circles / Mini Stats */}
      <Card className="p-5 bg-surface-elevated border border-white/[0.04] rounded-[32px] flex items-center justify-between group hover:border-accent/40 transition-all cursor-pointer">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
               <Activity size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Average Effort</p>
               <p className="text-base font-black text-text-primary uppercase tracking-tight italic">92% Intensity</p>
            </div>
         </div>
         <ArrowUpRight size={18} className="text-text-muted group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </Card>

      <Card className="p-5 bg-surface-elevated border border-white/[0.04] rounded-[32px] flex items-center justify-between group hover:border-accent/40 transition-all cursor-pointer">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
               <Target size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Primary Focus</p>
               <p className="text-base font-black text-text-primary uppercase tracking-tight italic">Hypertrophy</p>
            </div>
         </div>
         <ArrowUpRight size={18} className="text-text-muted group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </Card>
    </div>
  );
}
