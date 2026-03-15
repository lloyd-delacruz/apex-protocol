'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { ApiProgram } from '@/lib/api';

interface DisplayProgram extends ApiProgram {
  assigned: boolean;
}

const statusConfig = {
  active: { label: 'Active', classes: 'bg-accent/10 text-accent border-accent/20' },
  not_started: { label: 'Not Started', classes: 'bg-white/[0.06] text-text-muted border-white/[0.08]' },
} as const;

function AssignModal({
  programs,
  onAssign,
  onClose,
}: {
  programs: ApiProgram[];
  onAssign: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const [assigning, setAssigning] = useState<string | null>(null);

  async function handleAssign(id: string) {
    setAssigning(id);
    await onAssign(id);
    setAssigning(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-elevated border border-white/[0.08] rounded-modal p-6 w-full max-w-lg shadow-elevated animate-slide-up max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-xl font-bold text-text-primary">Browse Programs</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto flex-1">
          {programs.length === 0 && (
            <p className="text-text-muted text-sm text-center py-6">No programs available</p>
          )}
          {programs.map((program) => (
            <div
              key={program.id}
              className="flex items-center justify-between gap-4 p-4 rounded-card bg-background border border-white/[0.06]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">{program.name}</p>
                <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                  {program.description ?? `${program.totalWeeks} weeks`}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{program.totalWeeks} weeks</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAssign(program.id)}
                loading={assigning === program.id}
              >
                Assign
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<DisplayProgram[]>([]);
  const [allPrograms, setAllPrograms] = useState<ApiProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPrograms() {
    try {
      const [all, assigned] = await Promise.all([
        api.programs.list(),
        api.programs.assigned(),
      ]);
      const assignedIds = new Set((assigned.programs ?? []).map((p: ApiProgram) => p.id));
      const displayList: DisplayProgram[] = (all.programs ?? []).map((p: ApiProgram) => ({
        ...p,
        assigned: assignedIds.has(p.id),
      }));
      setPrograms(displayList);
      setAllPrograms(all.programs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPrograms(); }, []);

  async function handleAssign(id: string) {
    await api.programs.assign(id);
    await loadPrograms();
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
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Browse Programs
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-card bg-danger/10 border border-danger/20 text-danger text-sm">{error}</div>
      )}

      {/* Programs grid */}
      {programs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {programs.map((program) => {
            const status = program.assigned ? 'active' : 'not_started';
            const { label, classes } = statusConfig[status];
            return (
              <Link key={program.id} href={`/programs/${program.id}`} className="block group">
                <Card elevated className="p-5 h-full hover:border-accent/20 transition-transform duration-200 hover:shadow-accent-sm cursor-pointer">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-heading text-base font-semibold text-text-primary group-hover:text-accent transition-colors">
                        {program.name}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">{program.totalWeeks} weeks</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${classes}`}>
                      {label}
                    </span>
                  </div>

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

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-1 text-xs text-text-muted group-hover:text-accent transition-colors">
                    View program
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Card>
              </Link>
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
        <AssignModal
          programs={allPrograms}
          onAssign={handleAssign}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
