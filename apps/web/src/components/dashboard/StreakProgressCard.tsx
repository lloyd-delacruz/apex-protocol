'use client';

import React from 'react';
import { Flame, Calendar, Trophy, Zap, ChevronRight, ArrowRight } from 'lucide-react';
import Card from '@/components/ui/Card';

interface StreakProgressCardProps {
  currentStreak: number;
  bestStreak: number;
  daysThisWeek: boolean[]; // 7 booleans starting Monday
  weeklyGoal: number; // e.g., 4 days
}

export default function StreakProgressCard({
  currentStreak,
  bestStreak,
  daysThisWeek,
  weeklyGoal
}: StreakProgressCardProps) {
  const completedThisWeek = daysThisWeek.filter(d => d).length;
  const progress = (completedThisWeek / weeklyGoal) * 100;
  
  const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <Card className="p-6 bg-surface-elevated border border-white/[0.08] rounded-[40px] overflow-hidden relative group">
      {/* Background glow Decor */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/10 blur-[80px] rounded-full group-hover:bg-orange-500/15 transition-all duration-700" />
      
      <div className="flex flex-col md:flex-row gap-8 relative z-10">
         {/* Streak Flame Section */}
         <div className="flex flex-col items-center justify-center text-center">
            <div className="relative isolate mb-4">
               <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-20 animate-pulse" />
               <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-orange-sm relative">
                  <Flame size={40} fill="currentColor" strokeWidth={2.5} />
               </div>
               <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-surface-elevated border border-white/10 flex items-center justify-center text-orange-500 font-black text-xs">
                  {currentStreak}
               </div>
            </div>
            <h3 className="text-2xl font-black text-text-primary italic uppercase tracking-tight leading-none">
               {currentStreak} Day <br/> Streak
            </h3>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-2">
               Best: {bestStreak} Days
            </p>
         </div>

         {/* Weekly Progress Section */}
         <div className="flex-1 space-y-6">
            <div className="flex items-end justify-between">
               <div>
                  <h4 className="text-sm font-black text-text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
                     <Trophy size={16} className="text-yellow-500" /> Weekly Goal
                  </h4>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest italic">
                     {completedThisWeek} of {weeklyGoal} workouts completed
                  </p>
               </div>
               <div className="text-right">
                  <span className="text-2xl font-black text-text-primary italic">{Math.round(progress)}%</span>
               </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-4 bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.04]">
               <div 
                 className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-1000 shadow-orange-sm"
                 style={{ width: `${Math.min(100, progress)}%` }}
               />
               {/* Goal marker */}
               {progress < 100 && (
                 <div className="absolute top-0 h-full w-1 bg-white/20" style={{ left: `${(weeklyGoal / 7) * 100}%` }} />
               )}
            </div>

            {/* Daily Indicator Grid */}
            <div className="grid grid-cols-7 gap-2">
               {DAYS.map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                     <div 
                       className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
                         daysThisWeek[i] 
                          ? 'bg-orange-500/20 border-orange-500/40 text-orange-400 shadow-orange-sm active:scale-95' 
                          : 'bg-white/[0.02] border-white/[0.04] text-text-muted'
                       }`}
                     >
                        {daysThisWeek[i] ? <Zap size={16} fill="currentColor" /> : <span className="text-[10px] font-black">{day}</span>}
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
      
      {/* Footer Achievement Callout */}
      {progress >= 100 ? (
         <div className="mt-8 p-4 rounded-3xl bg-success/10 border border-success/20 flex items-center justify-between text-success">
            <div className="flex items-center gap-3">
               <Trophy size={20} />
               <span className="text-xs font-black uppercase tracking-widest">Weekly Goal Smashed!</span>
            </div>
            <ChevronRight size={18} />
         </div>
      ) : (
         <div className="mt-8 p-4 rounded-3xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-text-muted hover:text-text-primary transition-colors cursor-pointer group/footer">
            <span className="text-[10px] font-black uppercase tracking-widest">Next workout tomorrow to keep streak alive</span>
            <ArrowRight size={14} className="group-hover/footer:translate-x-1 transition-transform" />
         </div>
      )}
    </Card>
  );
}
