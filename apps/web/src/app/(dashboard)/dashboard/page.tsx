'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { getStoredUser, ApiTodayWorkout, ApiAnalyticsDashboard } from '@/lib/api';

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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes}`}>
      {label}
    </span>
  );
}

export default function DashboardPage() {
  const [userName, setUserName] = useState('Athlete');
  const [todayWorkout, setTodayWorkout] = useState<ApiTodayWorkout | null>(null);
  const [analytics, setAnalytics] = useState<ApiAnalyticsDashboard | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);

  useEffect(() => {
    const user = getStoredUser<{ id: string; email: string; name: string }>();
    if (user?.name) setUserName(user.name.split(' ')[0] ?? 'Athlete');

    Promise.all([
      api.workouts.today().catch(() => null),
      api.analytics.dashboard().catch(() => null),
      api.trainingLog.history({ limit: 20 }).catch(() => null),
    ]).then(([workout, dash, logs]) => {
      setTodayWorkout(workout);
      setAnalytics(dash);
      if (logs?.logs) {
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
  const totalWeeks = todayWorkout?.program?.totalWeeks ?? 12;
  const dayName = todayWorkout?.workoutDay?.workoutType ?? null;
  const todayExercises = todayWorkout?.workoutDay?.exercisePrescriptions ?? [];

  const statusBreakdown = analytics?.statusBreakdown;
  const sbTotal = statusBreakdown?.total ?? 0;
  const achievedPct = sbTotal > 0 ? Math.round((statusBreakdown!.achieved / sbTotal) * 100) : 0;
  const progressPct = sbTotal > 0 ? Math.round((statusBreakdown!.progress / sbTotal) * 100) : 0;
  const failedPct = sbTotal > 0 ? Math.round((statusBreakdown!.failed / sbTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <p className="text-text-muted text-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h2 className="font-heading text-2xl font-bold text-text-primary mt-0.5">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span className="text-gradient-accent">{userName}</span>
        </h2>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="label">Training Streak</p>
          <div className="flex items-end gap-2 mt-2">
            <span className="font-heading text-3xl font-bold text-accent">{streakDays}</span>
            <span className="text-text-muted text-sm pb-1">days</span>
          </div>
          <div className="flex gap-1 mt-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full ${i < Math.min(streakDays, 7) ? 'bg-accent' : 'bg-white/[0.06]'}`}
              />
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <p className="label">Sessions (4wk)</p>
          <div className="flex items-end gap-2 mt-2">
            <span className="font-heading text-3xl font-bold text-text-primary">
              {analytics?.adherence?.sessionsLast4Weeks ?? 0}
            </span>
            <span className="text-text-muted text-sm pb-1">sessions</span>
          </div>
          <p className="text-xs text-text-muted mt-2">
            {analytics ? `${Math.round(analytics.adherence.adherenceRate)}% adherence` : '—'}
          </p>
        </Card>

        <Card className="p-4">
          <p className="label">Current Week</p>
          <div className="flex items-end gap-2 mt-2">
            <span className="font-heading text-3xl font-bold text-text-primary">{weekNumber || '—'}</span>
            <span className="text-text-muted text-sm pb-1">{weekNumber ? `/ ${totalWeeks}` : ''}</span>
          </div>
          <div className="mt-2 bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-accent-secondary rounded-full"
              style={{ width: weekNumber ? `${(weekNumber / totalWeeks) * 100}%` : '0%' }}
            />
          </div>
        </Card>

        <Card className="p-4">
          <p className="label">Today&apos;s Session</p>
          <div className="mt-2">
            {dayName ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Scheduled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-white/[0.06] text-text-muted border border-white/[0.08]">
                Rest Day
              </span>
            )}
          </div>
          <p className="text-sm text-text-primary font-medium mt-2 truncate">
            {dayName ?? (todayWorkout ? 'Rest day' : 'No program')}
          </p>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's workout card */}
        <Card elevated className="lg:col-span-2 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="label mb-1">Today&apos;s Workout</p>
              <h3 className="font-heading text-lg font-semibold text-text-primary">
                {dayName ?? 'No workout scheduled'}
              </h3>
              <p className="text-sm text-text-muted mt-0.5">
                {weekNumber ? `Week ${weekNumber}` : ''}
                {todayExercises.length > 0 ? ` · ${todayExercises.length} exercises` : ''}
              </p>
            </div>
            {dayName && (
              <Link href="/workout">
                <Button variant="primary" size="sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start
                </Button>
              </Link>
            )}
          </div>

          {todayExercises.length > 0 ? (
            <div className="space-y-2">
              {todayExercises.map((ep, idx) => {
                const parts = ep.targetRepRange?.split('-').map(Number) ?? [8, 12];
                const repMin = parts[0] ?? 8;
                const repMax = parts[1] ?? repMin;
                return (
                  <div
                    key={ep.id}
                    className="flex items-center justify-between p-3 bg-background rounded-card border border-white/[0.04]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center text-xs font-bold text-text-muted">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{ep.exercise.name}</p>
                        <p className="text-xs text-text-muted">
                          {repMin}–{repMax} reps
                          {ep.exercise.muscleGroup ? ` · ${ep.exercise.muscleGroup}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-text-muted text-sm">
              {todayWorkout?.message ?? 'No workout assigned. Browse programs to get started.'}
            </div>
          )}

          {dayName && (
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <Link href="/workout" className="text-sm text-accent hover:text-accent/80 transition-colors flex items-center gap-1">
                Open full workout logger
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </Card>

        {/* Recent sessions sidebar */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Recent Sessions</h3>
            <Link href="/progress" className="text-xs text-accent hover:text-accent/80 transition-colors">
              View all
            </Link>
          </div>

          <div className="space-y-2">
            {recentSessions.length > 0 ? (
              recentSessions.map((session) => (
                <div
                  key={session.date}
                  className="flex items-center justify-between p-2.5 rounded-card bg-background border border-white/[0.04] hover:border-white/[0.08] transition-colors"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {session.dayName ?? 'Free session'}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {new Date(session.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <SessionStatusPill status="COMPLETED" />
                </div>
              ))
            ) : (
              <p className="text-sm text-text-muted py-4 text-center">No sessions logged yet</p>
            )}
          </div>
        </Card>
      </div>

      {/* Training status breakdown */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Training Status Breakdown</h3>
          <Link href="/progress" className="text-xs text-accent hover:text-accent/80 transition-colors">
            Full report
          </Link>
        </div>
        {sbTotal > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Sets Achieved', value: `${achievedPct}%`, color: 'text-success', bg: 'bg-success' },
              { label: 'Sets in Progress', value: `${progressPct}%`, color: 'text-accent', bg: 'bg-accent' },
              { label: 'Sets Failed', value: `${failedPct}%`, color: 'text-danger', bg: 'bg-danger' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-2xl font-heading font-bold mb-1">
                  <span className={item.color}>{item.value}</span>
                </div>
                <p className="text-xs text-text-muted">{item.label}</p>
                <div className="mt-2 bg-white/[0.06] rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.bg}`}
                    style={{ width: item.value }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted text-center py-4">Log some workouts to see your status breakdown</p>
        )}
      </Card>
    </div>
  );
}
