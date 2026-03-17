'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { ApiProgram } from '@/lib/api';
import GoalSelectionModal from '@/components/programs/GoalSelectionModal';
import ProgramGeneratorModal from '@/components/programs/ProgramGeneratorModal';
import { Sparkles, CheckCircle2, X, Pencil, Trash2, Zap, Calendar, User } from 'lucide-react';
import { GoalType } from '@/components/programs/GoalSelectionModal';
import EditExercisesModal from '@/components/programs/EditExercisesModal';

interface DisplayProgram extends ApiProgram {
  assigned: boolean;
}

const statusConfig = {
  active: { label: 'Active', classes: 'bg-accent/10 text-accent border-accent/20' },
  not_started: { label: 'Not Started', classes: 'bg-white/[0.06] text-text-muted border-white/[0.08]' },
} as const;

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<DisplayProgram[]>([]);
  const [allPrograms, setAllPrograms] = useState<ApiProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [generatorGoal, setGeneratorGoal] = useState<GoalType | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Edit/delete state
  const [editProgram, setEditProgram] = useState<{ id: string; name: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadPrograms = useCallback(async () => {
    setError(null);
    try {
      const [all, assigned] = await Promise.all([
        api.programs.list(),
        api.programs.assigned(),
      ]);

      const assignedList: ApiProgram[] = assigned.programs ?? [];
      const allList: ApiProgram[] = all.programs ?? [];

      const assignedIds = new Set(assignedList.map((p) => p.id));

      // Build an ordered map: templates first, then any assigned custom/generated
      // programs that are not already in the template list (e.g. AI-generated ones).
      const byId = new Map<string, ApiProgram>(allList.map((p) => [p.id, p]));
      for (const p of assignedList) {
        if (!byId.has(p.id)) byId.set(p.id, p);
      }

      const displayList: DisplayProgram[] = [...byId.values()].map((p) => ({
        ...p,
        assigned: assignedIds.has(p.id),
      }));

      setPrograms(displayList);
      // allPrograms feeds GoalSelectionModal — include generated so they're browsable too
      setAllPrograms([...byId.values()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrograms();
    // Clean up any pending success timer on unmount
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, [loadPrograms]);

  function showSuccess(msg: string) {
    setSuccessMessage(msg);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMessage(null), 4000);
  }

  function openGeneratorModal(goal?: GoalType) {
    setError(null); // clear any stale page-level error before opening
    setGeneratorGoal(goal);
    setShowGeneratorModal(true);
  }

  function closeGeneratorModal() {
    setShowGeneratorModal(false);
    setGeneratorGoal(undefined);
  }

  async function handleAssign(id: string) {
    await api.programs.assign(id);
    await loadPrograms();
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await api.programs.delete(id);
      await loadPrograms();
      setConfirmDeleteId(null);
      showSuccess('Program deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete program');
      setConfirmDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  const activeCount = programs.filter((p) => p.assigned).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-muted text-sm">Loading programs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-text-primary">Training Programs</h2>
          <p className="text-text-muted text-sm mt-0.5">
            {programs.length} programs · {activeCount} active
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => openGeneratorModal()}
            className="text-accent hover:bg-accent/10 border border-accent/20 hidden sm:flex transition-all hover:scale-105 active:scale-95 shadow-accent-sm"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Program
          </Button>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Browse Programs
          </Button>
        </div>
      </div>

      {/* Success banner */}
      {successMessage && (
        <div className="flex items-center gap-3 p-3.5 rounded-card bg-success/10 border border-success/20 text-success text-sm animate-slide-up">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="flex-1">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-success/70 hover:text-success ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-3.5 rounded-card bg-danger/10 border border-danger/20 text-danger text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-danger/70 hover:text-danger ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Programs grid */}
      {programs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {programs.map((program) => {
            const status = program.assigned ? 'active' : 'not_started';
            const { label, classes } = statusConfig[status];
            const isCustom = program.isCustom === true;
            const isConfirmingDelete = confirmDeleteId === program.id;
            return (
              <div key={program.id} className="group">
                <Card elevated className="p-5 h-full hover:border-accent/20 transition-transform duration-200 hover:shadow-accent-sm flex flex-col">
                  {/* Card header — clickable for navigation */}
                  <Link href={`/programs/${program.id}`} className="block flex-1">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading text-base font-semibold text-text-primary group-hover:text-accent transition-colors leading-snug">
                          {program.name}
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">{program.totalWeeks} weeks</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${classes}`}>
                        {label}
                      </span>
                    </div>

                    {/* Metadata chips */}
                    {(program.goalType || program.experienceLevel || program.daysPerWeek) && (
                      <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        {program.goalType && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.05] text-text-muted border border-white/[0.08] capitalize">
                            <Zap className="w-2.5 h-2.5" />
                            {program.goalType.replace(/,/g, ' + ').replace(/_/g, ' ')}
                          </span>
                        )}
                        {program.experienceLevel && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.05] text-text-muted border border-white/[0.08] capitalize">
                            <User className="w-2.5 h-2.5" />
                            {program.experienceLevel}
                          </span>
                        )}
                        {program.daysPerWeek && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.05] text-text-muted border border-white/[0.08]">
                            <Calendar className="w-2.5 h-2.5" />
                            {program.daysPerWeek}d / wk
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-sm text-text-muted leading-relaxed line-clamp-2 mb-4">
                      {program.description ?? 'No description'}
                    </p>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">
                          {program.assigned ? 'Assigned' : 'Not started'}
                        </span>
                        <span className="text-xs font-medium text-text-primary">
                          {program.assigned ? '— / ' + program.totalWeeks + ' wk' : program.totalWeeks + ' wk'}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-transform duration-500 ${
                            program.assigned ? 'bg-accent' : 'bg-white/20'
                          }`}
                          style={{ width: program.assigned ? '5%' : '0%' }}
                        />
                      </div>
                    </div>
                  </Link>

                  {/* Card footer */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06]">
                    {isConfirmingDelete ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-danger">Delete this program?</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs text-text-muted hover:text-text-primary transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(program.id)}
                            disabled={deleting}
                            className="text-xs font-semibold text-danger hover:text-danger/80 transition-colors"
                          >
                            {deleting ? 'Deleting...' : 'Confirm'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/programs/${program.id}`}
                          className="flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors"
                        >
                          View program
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                        {isCustom && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditProgram({ id: program.id, name: program.name })}
                              title="Edit exercises"
                              className="w-7 h-7 flex items-center justify-center rounded-card text-text-muted hover:text-accent hover:bg-accent/[0.08] transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(program.id)}
                              title="Delete program"
                              className="w-7 h-7 flex items-center justify-center rounded-card text-text-muted hover:text-danger hover:bg-danger/[0.08] transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            );
          })}

          <button
            onClick={() => setShowModal(true)}
            className="group flex flex-col items-center justify-center gap-3 p-8 rounded-card border-2 border-dashed border-white/[0.08] hover:border-accent/30 hover:bg-accent/[0.02] transition-transform duration-200 min-h-[200px]"
          >
            <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center group-hover:bg-accent/10 transition-colors">
              <svg className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-text-muted group-hover:text-text-primary transition-colors">Assign a Program</p>
              <p className="text-xs text-text-muted mt-0.5">Browse available training blocks</p>
            </div>
          </button>
        </div>
      ) : (
        <Card elevated className="p-10 text-center">
          <p className="text-text-primary font-semibold mb-2">No programs yet</p>
          <p className="text-text-muted text-sm mb-4">Assign a training program to get started.</p>
          <Button variant="primary" onClick={() => setShowModal(true)}>Browse Programs</Button>
        </Card>
      )}

      {showModal && (
        <GoalSelectionModal
          programs={allPrograms}
          onAssign={handleAssign}
          onClose={() => setShowModal(false)}
          onLaunchAI={(goal) => {
            setShowModal(false);
            openGeneratorModal(goal);
          }}
        />
      )}

      {showGeneratorModal && (
        <ProgramGeneratorModal
          initialGoal={generatorGoal}
          onClose={closeGeneratorModal}
          onSuccess={async () => {
            closeGeneratorModal();
            await loadPrograms();
            showSuccess('Program assigned successfully. Your training block is ready.');
          }}
        />
      )}

      {editProgram && (
        <EditExercisesModal
          programId={editProgram.id}
          programName={editProgram.name}
          onClose={() => setEditProgram(null)}
        />
      )}
    </div>
  );
}
