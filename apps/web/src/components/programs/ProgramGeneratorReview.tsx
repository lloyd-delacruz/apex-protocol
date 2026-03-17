'use client';

import { useState } from 'react';
import { Target, User, Calendar, Dumbbell, Sparkles, CheckCircle2, ChevronRight, AlertCircle, X, Layers } from 'lucide-react';
import Button from '@/components/ui/Button';
import api, { ApiProgramFull } from '@/lib/api';
import { GeneratorState } from './ProgramGeneratorModal';

interface Props {
  state: GeneratorState;
  onEditStep: (step: number) => void;
  onGenerated: (program: ApiProgramFull) => void;
  onBusyChange: (busy: boolean) => void;
}

export default function ProgramGeneratorReview({ state, onEditStep, onGenerated, onBusyChange }: Props) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    // Duplicate-submit guard
    if (generating) return;
    if (state.goals.length === 0 || !state.experience) return;

    setGenerating(true);
    onBusyChange(true);
    setError(null);

    try {
      const result = await api.programs.generate({
        goals: state.goals,
        experienceLevel: state.experience,
        daysPerWeek: state.days,
        equipment: state.equipment,
        compoundPreference: state.compoundPreference,
      });

      // Validate response shape before handing off
      if (!result?.program) {
        throw new Error('The server returned an unexpected response. Please try again.');
      }

      onGenerated(result.program);
      // Note: do not reset busy here — modal transitions immediately, resetting would cause a flash
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate program. Please try again.');
      setGenerating(false);
      onBusyChange(false);
    }
  };

  const getGoalLabel = (goals: string[]) => {
    if (goals.length === 0) return 'Not Selected';
    return goals
      .map((g) => g.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
      .join(' + ');
  };

  const getExperienceLabel = (exp: string | null) => {
    if (!exp) return 'Not Selected';
    return exp.charAt(0).toUpperCase() + exp.slice(1);
  };

  const getCompoundLabel = (pref: string) => {
    switch (pref) {
      case 'compound': return 'Compound Focus';
      case 'isolation': return 'Isolation Focus';
      default: return 'Mixed';
    }
  };

  if (generating) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center animate-fade-in min-h-[400px]">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 bg-accent/10 rounded-full animate-ping" />
          <div className="absolute inset-0 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
          <div className="absolute inset-0 m-auto w-12 h-12 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-accent animate-pulse" />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-text-primary mb-3 font-heading tracking-tight">Building Your Protocol</h3>
        <p className="text-text-muted max-w-sm mx-auto leading-relaxed">
          Analyzing your profile parameters and constructing an optimized training regimen.
        </p>

        <div className="mt-8 flex flex-col items-start text-sm text-text-muted gap-2 w-full max-w-xs text-left">
          <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '0s' }}>
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span>Processing parameters...</span>
          </div>
          <div className="flex items-center gap-2 animate-fade-in opacity-0" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span>Selecting optimal exercises...</span>
          </div>
          <div className="flex items-center gap-2 animate-fade-in opacity-0" style={{ animationDelay: '1.6s', animationFillMode: 'forwards' }}>
            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            <span className="text-text-primary">Balancing volume &amp; intensity...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in py-2">
      <div className="text-center sm:text-left mb-8">
        <h3 className="text-2xl font-bold text-text-primary mb-2 flex items-center justify-center sm:justify-start gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <CheckCircle2 className="w-6 h-6 text-accent" />
          </div>
          Review &amp; Generate
        </h3>
        <p className="text-text-muted text-base">Verify your parameters before we construct your program.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border-l-4 border-danger text-sm flex items-start gap-3 mb-6 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-danger block mb-1">Generation Failed</span>
            <span className="text-danger/90 leading-relaxed">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-danger/70 hover:text-danger">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button onClick={() => onEditStep(1)} className="group relative p-5 rounded-xl bg-surface border border-white/[0.08] hover:border-accent/40 text-left transition-all duration-300 flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-white/[0.04] text-text-muted group-hover:bg-accent/10 group-hover:text-accent transition-colors">
            <Target className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-1">Primary Goal</div>
            <div className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">{getGoalLabel(state.goals)}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted/50 mt-3 group-hover:translate-x-1 group-hover:text-accent transition-all" />
        </button>

        <button onClick={() => onEditStep(2)} className="group relative p-5 rounded-xl bg-surface border border-white/[0.08] hover:border-accent/40 text-left transition-all duration-300 flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-white/[0.04] text-text-muted group-hover:bg-accent/10 group-hover:text-accent transition-colors">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-1">Experience Level</div>
            <div className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">{getExperienceLabel(state.experience)}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted/50 mt-3 group-hover:translate-x-1 group-hover:text-accent transition-all" />
        </button>

        <button onClick={() => onEditStep(3)} className="group relative p-5 rounded-xl bg-surface border border-white/[0.08] hover:border-accent/40 text-left transition-all duration-300 flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-white/[0.04] text-text-muted group-hover:bg-accent/10 group-hover:text-accent transition-colors">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-1">Training Frequency</div>
            <div className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">{state.days} Days / Week</div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted/50 mt-3 group-hover:translate-x-1 group-hover:text-accent transition-all" />
        </button>

        <button onClick={() => onEditStep(4)} className="group relative p-5 rounded-xl bg-surface border border-white/[0.08] hover:border-accent/40 text-left transition-all duration-300 flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-white/[0.04] text-text-muted group-hover:bg-accent/10 group-hover:text-accent transition-colors">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-1 flex justify-between items-center">
              Equipment
              <span className="px-1.5 py-0.5 rounded-md bg-white/[0.08] text-[10px]">{state.equipment.length} selected</span>
            </div>
            <div className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors line-clamp-2 leading-relaxed mt-1">
              {state.equipment.length > 0 ? state.equipment.join(', ') : 'None selected'}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted/50 mt-3 group-hover:translate-x-1 group-hover:text-accent transition-all" />
        </button>

        <button onClick={() => onEditStep(5)} className="group relative p-5 rounded-xl bg-surface border border-white/[0.08] hover:border-accent/40 text-left transition-all duration-300 flex items-start gap-4 sm:col-span-2">
          <div className="p-2.5 rounded-lg bg-white/[0.04] text-text-muted group-hover:bg-accent/10 group-hover:text-accent transition-colors">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-1">Exercise Focus</div>
            <div className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">{getCompoundLabel(state.compoundPreference)}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted/50 mt-3 group-hover:translate-x-1 group-hover:text-accent transition-all" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 mt-10 pt-6 border-t border-white/[0.06]">
        <Button
          variant="primary"
          onClick={handleGenerate}
          disabled={generating}
          size="lg"
          className="w-full sm:w-auto relative overflow-hidden group py-4 text-base shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.5)]"
        >
          <span className="absolute inset-0 w-full h-full -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
          <span className="relative z-10 flex items-center justify-center font-bold tracking-wide">
            Generate Protocol <Sparkles className="w-5 h-5 ml-2" />
          </span>
        </Button>

        <p className="text-xs text-text-muted text-center sm:text-left flex-1 px-4">
          By generating, you'll create a new customized program based on these exact specifications.
        </p>
      </div>
    </div>
  );
}
