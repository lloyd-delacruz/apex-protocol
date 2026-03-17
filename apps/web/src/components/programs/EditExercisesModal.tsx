'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, RefreshCw, ChevronDown, ChevronRight, Check } from 'lucide-react';
import api, { ApiProgramWeek, ApiExercise } from '@/lib/api';
import ExerciseMetaBadges from '@/components/ui/ExerciseMetaBadges';

interface Props {
  programId: string;
  programName: string;
  onClose: () => void;
}

export default function EditExercisesModal({ programId, programName, onClose }: Props) {
  const [weeks, setWeeks] = useState<ApiProgramWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  // Swap state
  const [swappingId, setSwappingId] = useState<string | null>(null); // prescriptionId being swapped
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ApiExercise[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const loadWeeks = useCallback(async () => {
    setError(null);
    try {
      const { weeks: wks } = await api.programs.getWeeks(programId);
      setWeeks(wks);
      // Expand all weeks by default for editing
      setExpandedWeeks(new Set(wks.map((w) => w.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load program');
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    loadWeeks();
  }, [loadWeeks]);

  // Debounced exercise search
  useEffect(() => {
    if (!swappingId) return;
    if (searchRef.current) clearTimeout(searchRef.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    searchRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { exercises } = await api.exercises.search(searchQuery.trim());
        setSearchResults(exercises.slice(0, 10));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
    };
  }, [searchQuery, swappingId]);

  function startSwap(prescriptionId: string) {
    setSwappingId(prescriptionId);
    setSearchQuery('');
    setSearchResults([]);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function cancelSwap() {
    setSwappingId(null);
    setSearchQuery('');
    setSearchResults([]);
  }

  async function confirmSwap(prescriptionId: string, newExercise: ApiExercise) {
    setSaving(true);
    try {
      await api.programs.updatePrescription(programId, prescriptionId, newExercise.id);
      // Update local state
      setWeeks((prev) =>
        prev.map((week) => ({
          ...week,
          workoutDays: week.workoutDays.map((day) => ({
            ...day,
            exercisePrescriptions: day.exercisePrescriptions.map((ep) =>
              ep.id === prescriptionId ? { ...ep, exercise: newExercise, exerciseId: newExercise.id } : ep
            ),
          })),
        }))
      );
      cancelSwap();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update exercise');
    } finally {
      setSaving(false);
    }
  }

  function toggleWeek(weekId: string) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekId)) next.delete(weekId);
      else next.add(weekId);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-surface-elevated rounded-card border border-white/[0.08] shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div>
            <h2 className="font-heading text-base font-bold text-text-primary">Edit Exercises</h2>
            <p className="text-xs text-text-muted mt-0.5">{programName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-card hover:bg-white/[0.06] text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading && (
            <p className="text-sm text-text-muted text-center py-8">Loading exercises...</p>
          )}

          {error && (
            <div className="p-3 rounded-card bg-danger/10 border border-danger/20 text-danger text-sm flex items-center justify-between gap-2">
              <span>{error}</span>
              <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
            </div>
          )}

          {!loading && weeks.length === 0 && !error && (
            <p className="text-sm text-text-muted text-center py-8">No exercises found in this program.</p>
          )}

          {weeks.map((week) => {
            const isExpanded = expandedWeeks.has(week.id);
            return (
              <div key={week.id} className="rounded-card border border-white/[0.06] overflow-hidden">
                <button
                  onClick={() => toggleWeek(week.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-md bg-accent/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-accent">{week.weekNumber}</span>
                    </span>
                    <span className="text-sm font-medium text-text-primary">Week {week.weekNumber}</span>
                    <span className="text-xs text-text-muted">
                      {week.workoutDays.length} day{week.workoutDays.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
                    {week.workoutDays.map((day) => (
                      <div key={day.id} className="px-4 py-3">
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                          Day {day.sortOrder} — {day.workoutType}
                        </p>
                        <div className="space-y-1.5">
                          {day.exercisePrescriptions.map((ep) => {
                            const isSwapping = swappingId === ep.id;
                            return (
                              <div key={ep.id}>
                                {/* Exercise row */}
                                <div
                                  className={`flex items-center justify-between gap-3 px-3 py-2 rounded-card transition-colors ${
                                    isSwapping
                                      ? 'bg-accent/[0.06] border border-accent/20'
                                      : 'bg-white/[0.02] hover:bg-white/[0.04]'
                                  }`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-text-primary truncate">
                                      {ep.exercise.name}
                                    </p>
                                    <ExerciseMetaBadges
                                      exercise={ep.exercise}
                                      fields={['equipment', 'bodyPart', 'movementPattern']}
                                      className="mt-1"
                                    />
                                    {ep.targetRepRange && (
                                      <p className="text-xs text-text-muted mt-0.5">{ep.targetRepRange} reps</p>
                                    )}
                                  </div>
                                  {isSwapping ? (
                                    <button
                                      onClick={cancelSwap}
                                      className="text-xs text-text-muted hover:text-text-primary transition-colors px-2 py-1 rounded"
                                    >
                                      Cancel
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => startSwap(ep.id)}
                                      className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors px-2 py-1 rounded hover:bg-accent/[0.06]"
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                      Swap
                                    </button>
                                  )}
                                </div>

                                {/* Inline swap search */}
                                {isSwapping && (
                                  <div className="mt-1.5 px-3 py-2.5 bg-surface rounded-card border border-white/[0.06]">
                                    <div className="relative">
                                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                                      <input
                                        ref={inputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search exercises..."
                                        className="w-full pl-8 pr-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-card text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/40 transition-colors"
                                      />
                                    </div>

                                    {searching && (
                                      <p className="text-xs text-text-muted mt-2 px-1">Searching...</p>
                                    )}

                                    {!searching && searchResults.length > 0 && (
                                      <div className="mt-2 space-y-0.5 max-h-40 overflow-y-auto">
                                        {searchResults.map((ex) => (
                                          <button
                                            key={ex.id}
                                            onClick={() => confirmSwap(ep.id, ex)}
                                            disabled={saving}
                                            className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-card hover:bg-accent/[0.08] text-left transition-colors group"
                                          >
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm text-text-primary group-hover:text-accent truncate transition-colors">
                                                {ex.name}
                                              </p>
                                              <ExerciseMetaBadges
                                                exercise={ex}
                                                fields={['equipment', 'bodyPart', 'movementPattern']}
                                                className="mt-0.5"
                                              />
                                            </div>
                                            <Check className="w-3.5 h-3.5 text-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                          </button>
                                        ))}
                                      </div>
                                    )}

                                    {!searching && searchQuery.trim() && searchResults.length === 0 && (
                                      <p className="text-xs text-text-muted mt-2 px-1">No exercises found.</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-card text-sm font-medium text-text-primary bg-white/[0.06] hover:bg-white/[0.10] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
