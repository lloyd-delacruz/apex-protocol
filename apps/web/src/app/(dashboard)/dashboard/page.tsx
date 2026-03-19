'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, ArrowRight, Clock } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { getStoredUser, ApiTodayWorkout, ApiAnalyticsDashboard, ApiTrainingLog } from '@/lib/api';
import StreakProgressCard from '@/components/dashboard/StreakProgressCard';
import WeeklyProgressStats from '@/components/dashboard/WeeklyProgressStats';

interface RecentSession {
  date: string;
  dayName: string | null;
}

function SessionStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    COMPLETED: { label: 'Completed', classes: 'bg-success/10 text-success border-success/20' },
    IN_PROGRESS: { label: 'In Progress', classes: 'bg-accent/10 text-accent border-accent/20' },
    SKIPPED: { label: 'Skipped', classes: 'bg-white/[0.06] text-text-muted border-white/[0.08]' },
  };
  const { label, classes } = map[status] ?? map['COMPLETED'];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${classes}`}>
      {label}
    </span>
  );
}

function computeDaysThisWeek(logs: ApiTrainingLog[]): boolean[] {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
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

export default function DashboardPage() {
  const [userName, setUserName] = useState('Athlete');
  const [todayWorkout, setTodayWorkout] = useState<ApiTodayWorkout | null>(null);
  const [analytics, setAnalytics] = useState<ApiAnalyticsDashboard | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [daysThisWeek, setDaysThisWeek] = useState<boolean[]>(Array(7).fill(false));

  useEffect(() => {
    const user = getStoredUser<{ id: string; email: string; name: string }>();
    if (user?.name) setUserName(user.name.split(' ')[0] ?? 'Athlete');

    Promise.all([
      api.workouts.today().catch(() => null),
      api.analytics.dashboard().catch(() => null),
      api.trainingLog.history({ limit: 28 }).catch(() => null),
    ]).then(([workout, dash, logs]) => {
      setTodayWorkout(workout);
      setAnalytics(dash);
      if (logs?.logs) {
        setDaysThisWeek(computeDaysThisWeek(logs.logs));
        const seen = new Set<string>();
        const sessions: RecentSession[] = [];
        for (const log of logs.logs) {
          if (!seen.has(log.sessionDate)) {
            seen.add(log.sessionDate);
            sessions.push({ date: log.sessionDate, dayName: log.workoutDay?.workoutType ?? null });
          }
          if (sessions.length >= 5) break;
        }
        setRecentSessions(sessions);
      }
    });
  }, []);

  const streakDays = analytics?.adherence?.streak ?? 0;
  const weekNumber = todayWorkout?.currentWeek?.weekNumber ?? 0;
  const dayName = todayWorkout?.workoutDay?.workoutType ?? null;
  const todayExercises = todayWorkout?.workoutDay?.exercisePrescriptions ?? [];
  const latestVolume = analytics?.weeklyVolume?.at(-1)?.volume ?? 0;
  const prevVolume = analytics?.weeklyVolume?.at(-2)?.volume ?? 0;
  const volumeChangePct = prevVolume > 0 ? Math.round(((latestVolume - prevVolume) / prevVolume) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h2 className="text-3xl font-black text-text-primary uppercase italic tracking-tighter leading-none">
            Welcome Back, <span className="text-accent">{userName}</span>
          </h2>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-white/[0.04] flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer">
           <Settings size={20} />
        </div>
      </div>

      {/* Hero Streak Card */}
      <StreakProgressCard
        currentStreak={streakDays}
        bestStreak={streakDays}
        daysThisWeek={daysThisWeek}
        weeklyGoal={4}
      />

      {/* Weekly Stats Section */}
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Efficiency Protocol</h3>
            <Link href="/progress" className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">Full Analytics</Link>
         </div>
         <WeeklyProgressStats
           totalVolume={latestVolume}
           sessions={analytics?.adherence?.sessionsLast4Weeks || 0}
           setsCompleted={analytics?.statusBreakdown?.total || 0}
           volumeChangePct={volumeChangePct}
         />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Today's Exercise Card */}
         <Card elevated className="lg:col-span-2 p-8 bg-surface border border-white/[0.08] rounded-[40px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-accent/10 transition-all duration-700" />
            
            <div className="flex items-start justify-between mb-8 relative z-10">
               <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Today&apos;s Protocol</p>
                  <h3 className="text-3xl font-black text-text-primary uppercase italic tracking-tight italic">
                     {dayName ?? 'Active Recovery'}
                  </h3>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">
                     {weekNumber ? `Week ${weekNumber} · ` : ''}
                     {todayExercises.length > 0 ? `${todayExercises.length} Exercises` : 'Rest Day'}
                  </p>
               </div>
               {dayName && (
                  <Link href="/workout">
                     <Button variant="primary" className="h-16 px-10 rounded-[28px] font-black uppercase tracking-widest shadow-accent italic group/btn text-sm">
                        Ignite <ArrowRight size={20} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                     </Button>
                  </Link>
               )}
            </div>

            {todayExercises.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                  {todayExercises.slice(0, 4).map((ep, idx) => (
                     <div key={ep.id} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl hover:bg-white/[0.04] transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center text-[10px] font-black text-text-muted border border-white/[0.02]">
                           {idx + 1}
                        </div>
                        <div className="min-w-0">
                           <p className="text-sm font-black text-text-primary uppercase tracking-tight truncate">{ep.exercise.name}</p>
                           <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest italic">{ep.targetRepRange} Reps</p>
                        </div>
                     </div>
                  ))}
                  {todayExercises.length > 4 && (
                    <div className="flex items-center justify-center p-4 text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">
                       + {todayExercises.length - 4} More
                    </div>
                  )}
               </div>
            ) : (
               <div className="py-20 text-center relative z-10">
                  <div className="w-20 h-20 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-6 text-text-muted">
                     <Clock size={40} />
                  </div>
                  <p className="text-base font-bold text-text-muted uppercase tracking-widest italic">
                     {todayWorkout?.message || 'Focus on mobility today. You earned it.'}
                  </p>
               </div>
            )}
         </Card>

         {/* Side Stats */}
         <div className="space-y-6">
            <Card className="p-8 bg-surface border border-white/[0.08] rounded-[40px]">
               <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-6">Recent Archive</h3>
               <div className="space-y-4">
                  {recentSessions.length > 0 ? recentSessions.slice(0, 3).map((session, i) => (
                     <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl hover:border-accent/40 transition-colors cursor-pointer group">
                        <div className="min-w-0 flex-1 mr-3">
                           <p className="text-xs font-black text-text-primary uppercase tracking-tight truncate group-hover:text-accent transition-colors">{session.dayName || 'Hypertrophy'}</p>
                           <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        </div>
                        <SessionStatusPill status="COMPLETED" />
                     </div>
                  )) : (
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest text-center py-4">No Sessions Yet</p>
                  )}
               </div>
            </Card>
            
            <Card className="p-8 bg-accent border border-accent rounded-[40px] text-white shadow-accent relative overflow-hidden group">
               <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
               <h4 className="text-xl font-black uppercase italic tracking-tighter mb-1 relative z-10 leading-none">Apex Pro</h4>
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 relative z-10">Go Unlimited</p>
               <Button className="mt-6 w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-white text-accent hover:bg-white/90 border-none relative z-10 transition-colors">
                  Unlock Access
               </Button>
            </Card>
         </div>
      </div>
    </div>
  );
}
