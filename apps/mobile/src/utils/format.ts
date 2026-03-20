/**
 * Formatting Utilities
 *
 * Pure functions for display formatting throughout the app.
 * No side effects, no imports from the project.
 */

// ─── Weight ───────────────────────────────────────────────────────────────────

export function formatWeight(kg: number, unit: 'kg' | 'lb' = 'kg'): string {
  if (unit === 'lb') {
    return `${Math.round(kg * 2.20462)} lb`;
  }
  // Show one decimal only if needed
  const display = Number.isInteger(kg) ? kg : kg.toFixed(1);
  return `${display} kg`;
}

export function kgToLb(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbToKg(lb: number): number {
  return Math.round((lb / 2.20462) * 10) / 10;
}

// ─── Volume ───────────────────────────────────────────────────────────────────

export function formatVolume(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)}k kg`;
  }
  return `${kg} kg`;
}

// ─── Dates ───────────────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateFull(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(dateStr);
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ─── Numbers ─────────────────────────────────────────────────────────────────

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatChange(value: number, unit = '%'): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}${unit}`;
}

// ─── RIR ─────────────────────────────────────────────────────────────────────

export function formatRIR(rir: number): string {
  if (rir === 0) return 'Max effort';
  if (rir === 1) return '1 rep left';
  return `${rir} reps left`;
}
