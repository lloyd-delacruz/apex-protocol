import prisma from '../db/prisma';
import { TrainingLogRepository } from '../repositories/TrainingLogRepository';
import { MetricsRepository } from '../repositories/MetricsRepository';

// ─── Service ──────────────────────────────────────────────────────────────────

export const AnalyticsService = {
  /**
   * Full dashboard analytics for a user.
   * Returns: weekly volume, strength trends, adherence, recovery score.
   */
  async getDashboardAnalytics(userId: string) {
    const [weeklyVolume, strengthTrends, adherence, recoveryScore, recentMetrics, statusBreakdown] =
      await Promise.all([
        computeWeeklyVolume(userId),
        computeStrengthTrends(userId),
        computeAdherence(userId),
        computeRecoveryScore(userId),
        MetricsRepository.findRecent(userId, 7),
        computeStatusBreakdown(userId),
      ]);

    return {
      weeklyVolume,
      strengthTrends,
      adherence,
      recoveryScore,
      recentMetrics: recentMetrics.map(normaliseMetric),
      statusBreakdown,
    };
  },
};

// ─── Private helpers ──────────────────────────────────────────────────────────

/** Aggregate total training volume per week for the last 12 weeks */
async function computeWeeklyVolume(userId: string) {
  const logs = await TrainingLogRepository.findWeeklyVolume(userId, 12);

  // Group by ISO week string (e.g. "2026-W10")
  const weekMap = new Map<string, number>();

  for (const log of logs) {
    const weekKey = getISOWeekKey(log.sessionDate);
    const volume = (Number(log.weight) || 0) * (log.totalReps || 0);
    weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + volume);
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, volume]) => ({ week, volume: Math.round(volume) }));
}

/** Strength trend for top compound lifts (last 12 entries each) */
async function computeStrengthTrends(userId: string) {
  const compoundNames = ['Bench Press', 'Back Squat', 'Deadlift', 'Overhead Press', 'Barbell Row'];

  const exercises = await prisma.exercise.findMany({
    where: { name: { in: compoundNames }, isActive: true },
    select: { id: true, name: true },
  });

  const trends = await Promise.all(
    exercises.map(async (exercise) => {
      const logs = await TrainingLogRepository.findByUserAndExercise(userId, exercise.id, 12);

      const dataPoints = logs
        .filter((l) => l.weight !== null)
        .map((l) => ({
          date: l.sessionDate.toISOString().split('T')[0],
          weight: Number(l.weight),
          status: l.status,
          totalReps: l.totalReps,
        }))
        .reverse(); // chronological order

      if (dataPoints.length < 2) {
        return {
          exercise: exercise.name,
          dataPoints,
          currentWeight: dataPoints[dataPoints.length - 1]?.weight ?? 0,
          weightChangePct: 0,
        };
      }

      const first = dataPoints[0].weight;
      const last = dataPoints[dataPoints.length - 1].weight;
      const weightChangePct = first > 0 ? ((last - first) / first) * 100 : 0;

      return {
        exercise: exercise.name,
        dataPoints,
        currentWeight: last,
        weightChangePct: Math.round(weightChangePct * 10) / 10,
      };
    })
  );

  return trends.filter((t) => t.dataPoints.length > 0);
}

/** Adherence rate: sessions logged vs expected in last 4 weeks */
async function computeAdherence(userId: string) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 28);

  // Count distinct session dates in last 4 weeks
  const sessionDates = await TrainingLogRepository.findSessionDates(userId, 100);
  const recentDates = sessionDates.filter(
    (s) => new Date(s.sessionDate).getTime() >= cutoff.getTime()
  );

  const uniqueDates = new Set(recentDates.map((s) => s.sessionDate.toISOString().split('T')[0]));

  // Assume 4 training days/week = 16 expected sessions in 4 weeks
  const expectedSessions = 16;
  const actualSessions = uniqueDates.size;
  const adherenceRate = Math.min(100, Math.round((actualSessions / expectedSessions) * 100));

  return {
    sessionsLast4Weeks: actualSessions,
    expectedSessions,
    adherenceRate,
    streak: computeStreak(Array.from(uniqueDates)),
  };
}

/** Current training streak in days */
function computeStreak(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sorted = [...sortedDates].sort((a, b) => b.localeCompare(a));
  let streak = 0;
  let checkDate = new Date(today);

  for (const dateStr of sorted) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((checkDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0 || diff === 1) {
      streak++;
      checkDate = d;
    } else {
      break;
    }
  }

  return streak;
}

/** Recovery score from recent metrics */
async function computeRecoveryScore(userId: string): Promise<number> {
  const entries = await MetricsRepository.findRecent(userId, 7);

  if (entries.length === 0) return 50;

  const scores: number[] = [];

  for (const entry of entries) {
    let sum = 0;
    let count = 0;

    if (entry.sleepHours !== null) {
      sum += Math.min(100, Math.max(20, Number(entry.sleepHours) * 12.5));
      count++;
    }
    if (entry.moodScore !== null) { sum += entry.moodScore * 10; count++; }
    if (entry.trainingPerformanceScore !== null) { sum += entry.trainingPerformanceScore * 10; count++; }

    if (count > 0) scores.push(sum / count);
  }

  if (scores.length === 0) return 50;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/** Format metric to consistent API shape */
function normaliseMetric(m: {
  id: string;
  entryDate: Date;
  bodyWeight: unknown;
  moodScore: number | null;
  sleepHours: unknown;
  trainingPerformanceScore: number | null;
}) {
  return {
    id: m.id,
    date: m.entryDate.toISOString().split('T')[0],
    body_weight_kg: m.bodyWeight ? Number(m.bodyWeight) : null,
    mood: m.moodScore,
    sleep_hours: m.sleepHours ? Number(m.sleepHours) : null,
    training_performance: m.trainingPerformanceScore,
  };
}

/** Count ACHIEVED / PROGRESS / FAILED across all user training logs */
async function computeStatusBreakdown(userId: string) {
  const logs = await prisma.trainingLog.findMany({
    where: { userId, status: { not: null } },
    select: { status: true },
  });

  const counts = { achieved: 0, progress: 0, failed: 0, total: 0 };

  for (const log of logs) {
    counts.total++;
    if (log.status === 'ACHIEVED') counts.achieved++;
    else if (log.status === 'PROGRESS') counts.progress++;
    else if (log.status === 'FAILED') counts.failed++;
  }

  return counts;
}

/** Return "YYYY-Www" ISO week key for a date */
function getISOWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const year = d.getFullYear();
  const week = Math.ceil(((d.getTime() - new Date(year, 0, 4).getTime()) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}
