'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api, { ApiAnalyticsDashboard } from '@/lib/api';
import { TrainingStatus } from '@apex/shared';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatWeek(week: string): string {
  // "2026-W10" → "W10"
  return week.split('-')[1] ?? week;
}

const STATUS_COLORS: Record<string, string> = {
  ACHIEVED: '#10B981',
  PROGRESS: '#00C2FF',
  FAILED: '#EF4444',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-elevated border border-white/[0.08] rounded-card px-3 py-2 text-sm">
      <p className="text-text-muted text-xs mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.value}{p.name === 'volume' ? ' vol' : 'kg'}
        </p>
      ))}
    </div>
  );
};

export default function ProgressPage() {
  const [analytics, setAnalytics] = useState<ApiAnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<string>('');

  useEffect(() => {
    api.analytics.dashboard()
      .then((data) => {
        setAnalytics(data);
        if (data.strengthTrends?.length > 0) {
          setSelectedExercise(data.strengthTrends[0].exercise);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-muted text-sm">Loading analytics...</div>
      </div>
    );
  }

  const strengthTrends = analytics?.strengthTrends ?? [];
  const weeklyVolume = analytics?.weeklyVolume ?? [];
  const statusBreakdown = analytics?.statusBreakdown;
  const adherence = analytics?.adherence;

  const selectedTrend = strengthTrends.find((t) => t.exercise === selectedExercise);
  const chartData = (selectedTrend?.dataPoints ?? []).map((dp) => ({
    date: formatDate(dp.date),
    weight: dp.weight,
  }));

  const currentWeight = selectedTrend?.currentWeight ?? 0;
  const weightChangePct = selectedTrend?.weightChangePct ?? 0;
  const weightChange = chartData.length >= 2
    ? chartData[chartData.length - 1].weight - chartData[0].weight
    : 0;

  const pieData = statusBreakdown && statusBreakdown.total > 0
    ? [
        { name: 'Achieved', value: Math.round((statusBreakdown.achieved / statusBreakdown.total) * 100), color: '#10B981' },
        { name: 'Progress', value: Math.round((statusBreakdown.progress / statusBreakdown.total) * 100), color: '#00C2FF' },
        { name: 'Failed', value: Math.round((statusBreakdown.failed / statusBreakdown.total) * 100), color: '#EF4444' },
      ]
    : [];

  const volumeChartData = weeklyVolume.map((w) => ({
    week: formatWeek(w.week),
    volume: Math.round(w.volume),
  }));

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="label">Sessions (4wk)</p>
          <p className="font-heading text-3xl font-bold text-text-primary mt-2">
            {adherence?.sessionsLast4Weeks ?? 0}
          </p>
          <p className="text-xs text-text-muted mt-1">last 4 weeks</p>
        </Card>
        <Card className="p-4">
          <p className="label">Adherence Rate</p>
          <p className="font-heading text-3xl font-bold text-accent mt-2">
            {adherence ? `${Math.round(adherence.adherenceRate)}%` : '—'}
          </p>
          <p className="text-xs text-text-muted mt-1">of expected sessions</p>
        </Card>
        <Card className="p-4">
          <p className="label">Achieved Rate</p>
          <p className="font-heading text-3xl font-bold text-success mt-2">
            {statusBreakdown && statusBreakdown.total > 0
              ? `${Math.round((statusBreakdown.achieved / statusBreakdown.total) * 100)}%`
              : '—'}
          </p>
          <p className="text-xs text-text-muted mt-1">of all sets</p>
        </Card>
        <Card className="p-4">
          <p className="label">Training Streak</p>
          <p className="font-heading text-3xl font-bold text-accent-secondary mt-2">
            {adherence?.streak ?? 0}
          </p>
          <p className="text-xs text-text-muted mt-1">days</p>
        </Card>
      </div>

      {/* Main charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Weight progression chart */}
        <Card elevated className="xl:col-span-2 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="section-title">Weight Progression</h3>
              <p className="text-text-muted text-xs mt-0.5">Working weight over time</p>
            </div>
            {strengthTrends.length > 0 && (
              <div className="flex flex-wrap gap-1 max-w-xs justify-end">
                {strengthTrends.map((t) => (
                  <button
                    key={t.exercise}
                    onClick={() => setSelectedExercise(t.exercise)}
                    className={`px-3 py-1 rounded-[6px] text-xs font-medium transition-transform duration-150 ${
                      selectedExercise === t.exercise
                        ? 'bg-accent/10 text-accent border border-accent/20'
                        : 'text-text-muted hover:text-text-primary border border-transparent'
                    }`}
                  >
                    {t.exercise.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {chartData.length > 0 ? (
            <>
              <div className="flex gap-6 mb-4">
                <div>
                  <p className="label">Current</p>
                  <p className="text-lg font-bold text-text-primary">{currentWeight}kg</p>
                </div>
                <div>
                  <p className="label">Change</p>
                  <p className={`text-lg font-bold ${weightChange >= 0 ? 'text-success' : 'text-danger'}`}>
                    {weightChange >= 0 ? '+' : ''}{weightChange.toFixed(1)}kg
                  </p>
                </div>
                <div>
                  <p className="label">% Change</p>
                  <p className={`text-lg font-bold ${weightChangePct >= 0 ? 'text-success' : 'text-danger'}`}>
                    {weightChangePct >= 0 ? '+' : ''}{weightChangePct.toFixed(1)}%
                  </p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#00C2FF"
                    strokeWidth={2.5}
                    dot={{ fill: '#00C2FF', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#00C2FF', stroke: '#0A0A0F', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-text-muted text-sm">
              No training data yet. Complete some workouts to see progression.
            </div>
          )}
        </Card>

        {/* Status breakdown */}
        <Card className="p-5">
          <h3 className="section-title mb-1">Set Status Breakdown</h3>
          <p className="text-text-muted text-xs mb-4">All logged sets</p>

          {pieData.length > 0 ? (
            <>
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value}%`, '']}
                      contentStyle={{
                        background: '#1A1A26',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        color: '#F0F0F5',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 mt-2">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                      <span className="text-sm text-text-muted">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-text-primary">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-text-muted text-sm text-center">
              Log workouts to see your status breakdown
            </div>
          )}
        </Card>
      </div>

      {/* Volume chart */}
      <Card elevated className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="section-title">Weekly Training Volume</h3>
            <p className="text-text-muted text-xs mt-0.5">Weight × reps per week</p>
          </div>
          {volumeChartData.length > 0 && (
            <div className="text-right">
              <p className="text-xs text-text-muted">Latest week</p>
              <p className="text-lg font-bold text-accent">
                {volumeChartData[volumeChartData.length - 1]?.volume?.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {volumeChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={volumeChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="volume" fill="#00C2FF" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-48 text-text-muted text-sm">
            No volume data yet
          </div>
        )}
      </Card>

      {/* Top progressing exercises */}
      {strengthTrends.length > 0 && (
        <Card className="p-5">
          <h3 className="section-title mb-4">Strength Trends</h3>
          <div className="space-y-3">
            {strengthTrends.map((trend, idx) => {
              const status: TrainingStatus = trend.weightChangePct >= 5 ? 'ACHIEVED' : trend.weightChangePct >= 0 ? 'PROGRESS' : 'FAILED';
              return (
                <div key={trend.exercise} className="flex items-center gap-4 p-3 rounded-card bg-background border border-white/[0.04]">
                  <span className="w-7 h-7 rounded-full bg-surface-elevated flex items-center justify-center text-xs font-bold text-text-muted flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">{trend.exercise}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-text-primary">{trend.currentWeight}kg</p>
                    <p className={`text-xs ${trend.weightChangePct >= 0 ? 'text-success' : 'text-danger'}`}>
                      {trend.weightChangePct >= 0 ? '+' : ''}{trend.weightChangePct.toFixed(1)}%
                    </p>
                  </div>
                  <StatusBadge status={status} />
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
