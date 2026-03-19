'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api, { ApiProgram } from '@/lib/api';
import { 
  Sparkles, 
  Target, 
  ChevronRight, 
  Zap, 
  Search, 
  Compass, 
  Plus, 
  TrendingUp,
  Activity,
  Layers,
  LayoutGrid,
  Play,
  ArrowRight
} from 'lucide-react';

import ProgramGeneratorModal from '@/components/programs/ProgramGeneratorModal';

// ── Program Card (Unified with Workout Flow) ──────────────────────────────────

function ProgramCard({ program, onClick }: { program: ApiProgram; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-4 p-4 rounded-[28px] bg-white/[0.02] border border-white/[0.04] hover:border-accent/30 hover:bg-white/[0.04] transition-all duration-300 group"
    >
      <div className="w-14 h-14 rounded-2xl bg-background border border-white/[0.04] overflow-hidden shrink-0 flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent" />
        <Zap size={24} className="text-accent group-hover:scale-110 transition-transform duration-500" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-base font-bold text-text-primary group-hover:text-accent transition-colors truncate">
          {program.name}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{program.goalType || 'Strength'}</span>
          <div className="w-1 h-1 rounded-full bg-white/10" />
          <span className="text-[10px] font-bold text-text-muted/60 uppercase tracking-tight">{program.totalWeeks} Weeks</span>
        </div>
      </div>

      <div className="w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center group-hover:bg-accent/10 transition-colors">
        <ChevronRight size={16} className="text-text-muted group-hover:text-accent transition-colors" />
      </div>
    </button>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ProgramsPage() {
  const router = useRouter();
  const [activePrograms, setActivePrograms] = useState<ApiProgram[]>([]);
  const [allPrograms, setAllPrograms] = useState<ApiProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  const loadPrograms = () => {
    Promise.all([
      api.programs.assigned(),
      api.programs.list()
    ]).then(([assignedRes, listRes]) => {
      setActivePrograms(assignedRes.programs || []);
      setAllPrograms(listRes.programs || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const handleGeneratorSuccess = (programId: string) => {
    setIsGeneratorOpen(false);
    loadPrograms(); // Refresh the list
    router.push(`/dashboard/programs/${programId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Syncing Systems...</span>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pt-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Hero Header (Mirrored from Workout Page) */}
      <div className="text-center mb-12">
        {/* Context Chip */}
        <div className="inline-flex bg-white/[0.03] border border-white/[0.08] rounded-2xl p-1.5 mb-8 shadow-xl">
           <div className="px-4 py-1.5 rounded-xl bg-accent text-white text-[10px] font-black uppercase tracking-widest shadow-accent-sm">
             Fleet Command
           </div>
           <div className="px-4 py-1.5 text-text-muted text-[10px] font-bold uppercase tracking-widest">
             Training Systems
           </div>
        </div>

        <div className="relative mb-8 flex justify-center group">
           <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-accent to-[#7B61FF] rotate-12 flex items-center justify-center shadow-accent-elevated group-hover:rotate-0 transition-transform duration-500">
              <Layers size={40} className="text-white -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
           </div>
           <div className="absolute -top-2 right-[38%] w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center border border-white/10 shadow-lg">
              <span className="text-xs">⚡️</span>
           </div>
        </div>

        <h1 className="text-5xl font-bold text-text-primary tracking-tight leading-[0.9] mb-4">
          Training <span className="text-gradient-accent">Systems</span>
        </h1>
        <p className="text-text-muted text-lg max-w-sm mx-auto font-medium">
          Select a high-performance protocol optimized for your evolution.
        </p>
      </div>

      {/* Main Actions (Mobile Optimized) */}
      <div className="grid grid-cols-1 gap-4 mb-16">
        <Button 
          variant="primary" 
          className="h-20 rounded-[32px] text-xl font-bold tracking-tight shadow-accent-elevated flex gap-4 group overflow-hidden relative"
          onClick={() => setIsGeneratorOpen(true)}
        >
          <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center relative z-10 shrink-0">
             <Sparkles size={20} className="text-white" />
          </div>
          <span className="relative z-10 font-black uppercase tracking-tighter">AI Generator</span>
          <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform ml-auto" />
        </Button>

        <Button 
          variant="secondary" 
          className="h-16 rounded-[28px] border-white/10 bg-white/[0.02] hover:bg-white/[0.05] flex gap-4 group"
        >
          <LayoutGrid size={20} className="text-text-muted group-hover:text-text-primary transition-colors" />
          <span className="text-base font-bold text-text-muted group-hover:text-text-primary transition-colors">Browse Library</span>
        </Button>
      </div>

      {/* Active Systems */}
      {activePrograms.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between px-2 mb-6">
             <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Active Protocols</h3>
             <div className="h-px flex-1 bg-white/[0.06] ml-4" />
          </div>
          <div className="space-y-3">
            {activePrograms.map(prog => (
              <ProgramCard 
                key={prog.id} 
                program={prog} 
                onClick={() => router.push(`/dashboard/programs/${prog.id}`)} 
              />
            ))}
          </div>
        </section>
      )}

      {/* Recommended Fleet */}
      <section>
        <div className="flex items-center justify-between px-2 mb-6">
           <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Recommended Fleet</h3>
           <div className="h-px flex-1 bg-white/[0.06] ml-4" />
        </div>
        <div className="space-y-3">
          {allPrograms
            .filter(p => !activePrograms.some(ap => ap.id === p.id))
            .slice(0, 5)
            .map(prog => (
              <ProgramCard 
                key={prog.id} 
                program={prog} 
                onClick={() => router.push(`/dashboard/programs/${prog.id}`)} 
              />
            ))}
        </div>
      </section>

      {/* Create Custom (Mobile Bottom) */}
      <div className="mt-16 text-center">
        <button className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-text-muted hover:text-text-primary hover:border-white/20 transition-all group">
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-xs font-bold uppercase tracking-widest">Architect Custom System</span>
        </button>
      </div>

      {/* AI Generator Modal */}
      {isGeneratorOpen && (
        <ProgramGeneratorModal 
          onClose={() => setIsGeneratorOpen(false)}
          onSuccess={handleGeneratorSuccess}
        />
      )}
    </div>
  );
}
