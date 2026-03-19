'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Trophy,
  ArrowUpRight,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { ApiAnalyticsDashboard, ApiTrainingLog } from '@/lib/api';
import StreakProgressCard from '@/components/dashboard/StreakProgressCard';
import WeeklyProgressStats from '@/components/dashboard/WeeklyProgressStats';

function computeDaysThisWeek(logs: ApiTrainingLog[]): boolean[] {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const days = Array(7).fill(false) as boolean[];
  const seen = new Set<number>();
  for (const log of logs) {
    const d = new Date(log.sessionDate);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - monday.getTime()) / 86400000);
    if (diff >= 0 && diff < 7 && !seen.has(diff)) {
      seen.add(diff);
      days[diff] = true;
    }
  }
  return days;
}

export default function ProgressPage() {
  const [analytics, setAnalytics] = useState<ApiAnalyticsDashboard | null>(null);
  const [daysThisWeek, setDaysThisWeek] = useState<boolean[]>(Array(7).fill(false));
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.analytics.dashboard().catch(() => null),
      api.trainingLog.history({ limit: 100 }).catch(() => null),
    ]).then(([dash, logs]) => {
      setAnalytics(dash);
      if (logs?.logs) {
        setDaysThisWeek(computeDaysThisWeek(logs.logs));
        const uniqueDates = new Set(logs.logs.map((l: ApiTrainingLog) => l.sessionDate));
        setTotalSessions(uniqueDates.size);
      }
      if (dash?.weeklyVolume?.length) {
        const total = dash.weeklyVolume.reduce((sum: number, w: { volume: number }) => sum + w.volume, 0);
        setTotalVolume(total);
      }
    }).finally(() => setLoading(false));
  }, []);

  const streakDays = analytics?.adherence?.streak ?? 0;
  const latestVolume = analytics?.weeklyVolume?.at(-1)?.volume ?? 0;
  const prevVolume = analytics?.weeklyVolume?.at(-2)?.volume ?? 0;
  const volumeChangePct = prevVolume > 0 ? Math.round(((latestVolume - prevVolume) / prevVolume) * 100) : 0;
  const setsCompleted = analytics?.statusBreakdown?.total ?? 0;
  const sessionsLast4Weeks = analytics?.adherence?.sessionsLast4Weeks ?? 0;

  const strengthTrends = analytics?.strengthTrends ?? [];
  const personalBests = strengthTrends.slice(0, 4).map((t) => {
    const lastPoint = t.dataPoints.at(-1);
    return {
      exercise: t.exercise,
      stats: `${t.currentWeight}kg × ${lastPoint?.totalReps ?? '—'}`,
      date: lastPoint?.date
        ? new Date(lastPoint.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '—',
    };
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
      <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Calculating Gains...</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-text-primary uppercase italic tracking-tighter leading-none mb-2">
           Protocol <span className="text-accent underline decoration-white/10 underline-offset-8">Analytics</span>
        </h1>
        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] ml-1">Archive of your physical evolution</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2">
            <StreakProgressCard
              currentStreak={streakDays}
              bestStreak={streakDays}
              daysThisWeek={daysThisWeek}
              weeklyGoal={4}
            />
         </div>
         <Card className="p-8 bg-surface border border-white/[0.08] rounded-[40px] flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-accent/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

            <div className="relative z-10">
               <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Total Achievement</p>
               <div className="space-y-6">
                  <div>
                     <span className="text-4xl font-black text-text-primary italic tabular-nums">{totalSessions}</span>
                     <span className="text-xs font-bold text-text-muted uppercase tracking-widest ml-2">Sessions</span>
                  </div>
                  <div>
                     <span className="text-4xl font-black text-accent italic tabular-nums">
                       {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}K` : totalVolume}
                     </span>
                     <span className="text-xs font-bold text-text-muted uppercase tracking-widest ml-2">KG Lifted</span>
                  </div>
               </div>
            </div>

            <Button variant="ghost" className="mt-8 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] border-white/[0.06] hover:bg-white/[0.04]">
               Download Report <ArrowUpRight size={14} className="ml-2" />
            </Button>
         </Card>
      </div>

      {/* Detailed Stats */}
      <div className="space-y-6">
         <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Biometric Trends</h3>
            <div className="flex gap-2">
               <button className="px-3 py-1.5 rounded-xl bg-surface-elevated border border-accent/40 text-accent text-[10px] font-black uppercase tracking-widest">Volume</button>
               <button className="px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-text-muted text-[10px] font-black uppercase tracking-widest">Intensity</button>
            </div>
         </div>
         <WeeklyProgressStats
           totalVolume={latestVolume}
           sessions={sessionsLast4Weeks}
           setsCompleted={setsCompleted}
           volumeChangePct={volumeChangePct}
         />
      </div>

      {/* Muscle Distribution & Personal Bests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Card className="p-8 bg-surface border border-white/[0.08] rounded-[40px]">
            <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
               <Activity size={16} className="text-accent" /> Muscle Activation
            </h3>
            <div className="space-y-5">
               {[
                  { muscle: 'Chest', pct: 85, color: 'bg-accent' },
                  { muscle: 'Back', pct: 72, color: 'bg-accent' },
                  { muscle: 'Legs', pct: 64, color: 'bg-accent-secondary' },
                  { muscle: 'Shoulders', pct: 45, color: 'bg-white/20' },
                  { muscle: 'Arms', pct: 30, color: 'bg-white/10' },
               ].map((m) => (
                  <div key={m.muscle} className="space-y-2">
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">{m.muscle}</span>
                        <span className="text-[10px] font-black text-text-muted italic">{m.pct}%</span>
                     </div>
                     <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <div className={`h-full ${m.color} rounded-full transition-opacity duration-1000`} style={{ width: `${m.pct}%` }} />
                     </div>
                  </div>
               ))}
            </div>
         </Card>

         <Card className="p-8 bg-surface border border-white/[0.08] rounded-[40px]">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                  <Trophy size={16} className="text-yellow-500" /> Personal Hall
               </h3>
               <button className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">View All</button>
            </div>
            <div className="space-y-4">
               {personalBests.length > 0 ? personalBests.map((pb, i) => (
                  <div key={i} className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl flex items-center justify-between group hover:border-accent/40 transition-colors cursor-pointer">
                     <div>
                        <p className="text-xs font-black text-text-primary uppercase tracking-tight mb-1 group-hover:text-accent transition-colors">{pb.exercise}</p>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{pb.date}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-sm font-black text-text-primary tabular-nums italic">{pb.stats}</p>
                     </div>
                  </div>
               )) : (
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest text-center py-8">No Records Yet</p>
               )}
            </div>
         </Card>
      </div>
    </div>
  );
}
