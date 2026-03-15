'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import api, { ApiMetric, MetricsInput } from '@/lib/api';

function RatingInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="label">{label}</label>
        <span className="text-sm font-semibold text-text-primary">{value} / 5</span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`flex-1 h-8 rounded-[6px] text-xs font-semibold border transition-transform duration-150 ${
              rating <= value
                ? 'bg-accent/20 border-accent/40 text-accent'
                : 'bg-surface border-white/[0.06] text-text-muted hover:border-white/20'
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-elevated border border-white/[0.08] rounded-card px-3 py-2 text-sm">
      <p className="text-text-muted text-xs mb-1">{label}</p>
      <p className="font-semibold text-accent">{payload[0]?.value}kg</p>
    </div>
  );
};

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<ApiMetric[]>([]);
  const [recoveryScore, setRecoveryScore] = useState<number | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    date: today,
    body_weight_kg: '',
    calories: '',
    protein_g: '',
    sleep_hours: '',
    hunger: 3,
    mood: 3,
    training_performance: 3,
  });

  async function loadData() {
    try {
      const [metricsRes, recoveryRes] = await Promise.all([
        api.metrics.list({ limit: 30 }),
        api.metrics.recovery().catch(() => ({ recoveryScore: null })),
      ]);
      setMetrics(metricsRes.metrics ?? []);
      setRecoveryScore((recoveryRes as any).recoveryScore ?? null);
    } catch {
      // silent fail — page still usable
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function setField(key: string, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setSaveError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const payload: MetricsInput = {
        date: form.date,
        body_weight_kg: form.body_weight_kg ? parseFloat(form.body_weight_kg) : undefined,
        calories: form.calories ? parseInt(form.calories, 10) : undefined,
        protein_g: form.protein_g ? parseFloat(form.protein_g) : undefined,
        sleep_hours: form.sleep_hours ? parseFloat(form.sleep_hours) : undefined,
        hunger: form.hunger as 1 | 2 | 3 | 4 | 5,
        mood: form.mood as 1 | 2 | 3 | 4 | 5,
        training_performance: form.training_performance as 1 | 2 | 3 | 4 | 5,
      };
      await api.metrics.log(payload);
      setSaved(true);
      await loadData();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const latest = metrics[0] ?? null;

  // Build bodyweight chart data (most recent 10, reversed for oldest-first)
  const chartData = metrics
    .filter((m) => m.body_weight_kg !== null)
    .slice(0, 10)
    .reverse()
    .map((m) => ({
      date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: m.body_weight_kg as number,
    }));

  const firstWeight = chartData[0]?.weight ?? null;
  const lastWeight = chartData[chartData.length - 1]?.weight ?? null;
  const weightChange = firstWeight !== null && lastWeight !== null ? lastWeight - firstWeight : null;

  const avgSleep = metrics.length > 0
    ? metrics.reduce((s, m) => s + (m.sleep_hours ?? 0), 0) / metrics.length
    : null;

  const score = recoveryScore;

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="label">Current Weight</p>
          <p className="font-heading text-3xl font-bold text-text-primary mt-2">
            {latest?.body_weight_kg?.toFixed(1) ?? '—'}
          </p>
          <p className="text-xs text-text-muted mt-1">kg</p>
        </Card>
        <Card className="p-4">
          <p className="label">Recent Change</p>
          <p className={`font-heading text-3xl font-bold mt-2 ${
            weightChange === null ? 'text-text-muted' : weightChange <= 0 ? 'text-success' : 'text-warning'
          }`}>
            {weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}` : '—'}
          </p>
          <p className="text-xs text-text-muted mt-1">kg</p>
        </Card>
        <Card className="p-4">
          <p className="label">Recovery Score</p>
          <p className={`font-heading text-3xl font-bold mt-2 ${
            score === null ? 'text-text-muted' : score >= 75 ? 'text-success' : score >= 50 ? 'text-accent' : 'text-danger'
          }`}>
            {score !== null ? score : '—'}
          </p>
          <p className="text-xs text-text-muted mt-1">/ 100</p>
        </Card>
        <Card className="p-4">
          <p className="label">Avg Sleep</p>
          <p className="font-heading text-3xl font-bold text-text-primary mt-2">
            {avgSleep !== null ? avgSleep.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-text-muted mt-1">hrs / night</p>
        </Card>
      </div>

      {/* Body weight chart + Recovery */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card elevated className="xl:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">Body Weight Trend</h3>
              <p className="text-text-muted text-xs mt-0.5">Recent entries</p>
            </div>
            {weightChange !== null && (
              <span className={`text-sm font-semibold ${weightChange <= 0 ? 'text-success' : 'text-warning'}`}>
                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}kg total
              </span>
            )}
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C2FF" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#00C2FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#00C2FF"
                  strokeWidth={2.5}
                  fill="url(#weightGradient)"
                  dot={{ fill: '#00C2FF', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: '#00C2FF', stroke: '#0A0A0F', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-text-muted text-sm">
              {dataLoading ? 'Loading...' : 'No weight data logged yet'}
            </div>
          )}
        </Card>

        {/* Recovery score */}
        <Card className="p-5">
          <h3 className="section-title mb-4">Today&apos;s Recovery</h3>

          <div className="flex items-center justify-center mb-5">
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke={score === null ? 'rgba(255,255,255,0.1)' : score >= 75 ? '#10B981' : score >= 50 ? '#00C2FF' : '#EF4444'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${((score ?? 0) / 100) * 301.6} 301.6`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-2xl font-bold text-text-primary">{score ?? '—'}</span>
                <span className="text-xs text-text-muted">/ 100</span>
              </div>
            </div>
          </div>

          {latest && (
            <div className="space-y-3">
              {[
                { label: 'Sleep', value: latest.sleep_hours ? `${latest.sleep_hours}h` : '—', icon: '😴' },
                { label: 'Mood', value: latest.mood ? `${latest.mood} / 5` : '—', icon: '😊' },
                { label: 'Performance', value: latest.training_performance ? `${latest.training_performance} / 5` : '—', icon: '⚡' },
                { label: 'Hunger', value: latest.hunger ? `${latest.hunger} / 5` : '—', icon: '🍽️' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-sm text-text-muted">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-text-primary">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Log metrics form */}
      <Card elevated className="p-6">
        <h3 className="section-title mb-5">Log Today&apos;s Metrics</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="label block">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setField('date', e.target.value)}
                className="input-dark"
              />
            </div>
            <div className="space-y-1.5">
              <label className="label block">Body Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={form.body_weight_kg}
                onChange={(e) => setField('body_weight_kg', e.target.value)}
                placeholder="e.g. 81.5"
                className="input-dark"
              />
            </div>
            <div className="space-y-1.5">
              <label className="label block">Calories</label>
              <input
                type="number"
                min="0"
                max="10000"
                value={form.calories}
                onChange={(e) => setField('calories', e.target.value)}
                placeholder="e.g. 2700"
                className="input-dark"
              />
            </div>
            <div className="space-y-1.5">
              <label className="label block">Protein (g)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={form.protein_g}
                onChange={(e) => setField('protein_g', e.target.value)}
                placeholder="e.g. 200"
                className="input-dark"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="label block">Sleep (hours)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={form.sleep_hours}
                onChange={(e) => setField('sleep_hours', e.target.value)}
                placeholder="e.g. 7.5"
                className="input-dark"
              />
            </div>
            <RatingInput label="Hunger (1–5)" value={form.hunger} onChange={(v) => setField('hunger', v)} />
            <RatingInput label="Mood (1–5)" value={form.mood} onChange={(v) => setField('mood', v)} />
            <RatingInput label="Performance (1–5)" value={form.training_performance} onChange={(v) => setField('training_performance', v)} />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" variant="primary" loading={saving}>
              {saved ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Saved
                </>
              ) : 'Log Metrics'}
            </Button>
            {saved && <span className="text-sm text-success">Metrics saved successfully</span>}
            {saveError && <span className="text-sm text-danger">{saveError}</span>}
          </div>
        </form>
      </Card>

      {/* Recent metrics table */}
      {metrics.length > 0 && (
        <Card className="p-5">
          <h3 className="section-title mb-4">Recent Entries</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Date', 'Weight', 'Calories', 'Protein', 'Sleep', 'Hunger', 'Mood', 'Perf.'].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 label font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.slice(0, 10).map((m) => (
                  <tr key={m.id} className="border-b border-white/[0.04] hover:bg-white/[0.01] transition-colors">
                    <td className="py-2.5 pr-4 text-text-primary font-medium">
                      {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-2.5 pr-4 text-text-primary">
                      {m.body_weight_kg != null ? `${m.body_weight_kg}kg` : '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-text-muted">{m.calories ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-text-muted">{m.protein_g != null ? `${m.protein_g}g` : '—'}</td>
                    <td className="py-2.5 pr-4 text-text-muted">{m.sleep_hours != null ? `${m.sleep_hours}h` : '—'}</td>
                    <td className="py-2.5 pr-4">
                      {m.hunger != null ? (
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((i) => (
                            <span key={i} className={`w-2 h-2 rounded-full ${i <= m.hunger! ? 'bg-warning' : 'bg-white/10'}`} />
                          ))}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="py-2.5 pr-4">
                      {m.mood != null ? (
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((i) => (
                            <span key={i} className={`w-2 h-2 rounded-full ${i <= m.mood! ? 'bg-accent-secondary' : 'bg-white/10'}`} />
                          ))}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="py-2.5">
                      {m.training_performance != null ? (
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((i) => (
                            <span key={i} className={`w-2 h-2 rounded-full ${i <= m.training_performance! ? 'bg-success' : 'bg-white/10'}`} />
                          ))}
                        </div>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
