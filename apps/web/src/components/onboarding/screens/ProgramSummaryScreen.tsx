'use client';

import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingProvider';
import { Sparkles, Calendar, Dumbbell, Target, ChevronDown, ChevronUp, ArrowRight, Zap } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function ProgramSummaryScreen() {
  const { data, nextStep } = useOnboarding();
  const program = data.generatedProgram?.program || {};
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const previewDays = program.programMonths?.[0]?.programWeeks?.[0]?.workoutDays || [];

  return (
    <div className="flex flex-col h-full p-6 animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="text-accent w-5 h-5" />
          <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Protocol Generated</span>
        </div>
        <h2 className="text-3xl font-bold text-text-primary mb-2 italic">Lift Heavier</h2>
        <p className="text-text-muted">Review your program details. You can always edit these later in the app.</p>
      </div>

      {/* Program Quick Stats */}
      <div className="grid grid-cols-1 gap-3 mb-8">
        <StatCard 
            icon={<Zap className="text-accent" size={20} />} 
            label="Training Style" 
            value={data.goal?.replace('_', ' ') || 'Strength Training'} 
        />
        <StatCard 
            icon={<Calendar className="text-accent" size={20} />} 
            label="Muscle Split" 
            value="Upper / Lower" 
        />
        <StatCard 
            icon={<Dumbbell className="text-accent" size={20} />} 
            label="Equipment Profile" 
            value={data.environment?.replace('_', ' ') || 'Full Gym'} 
        />
        <StatCard 
            icon={<Target className="text-accent" size={20} />} 
            label="Exercise Difficulty" 
            value={data.experience || 'Intermediate'} 
        />
      </div>

      {/* Week 1 Preview */}
      <div className="mb-8">
        <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 px-1">Week 1 Preview</h3>
        <div className="space-y-3">
            {previewDays.length > 0 ? (
                previewDays.map((day: any) => (
                    <div key={day.id} className="rounded-2xl bg-surface border border-white/[0.08] overflow-hidden">
                        <button 
                            onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
                            className="w-full flex items-center justify-between p-4 text-left"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-accent w-8">{day.dayCode}</span>
                                <div>
                                    <div className="text-sm font-bold text-text-primary uppercase tracking-tight">{day.workoutType}</div>
                                    <div className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{day.phase}</div>
                                </div>
                            </div>
                            {expandedDay === day.id ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
                        </button>
                        
                        {expandedDay === day.id && (
                            <div className="px-4 pb-4 pt-2 border-t border-white/[0.04] bg-white/[0.02] animate-fade-in">
                                <div className="space-y-2">
                                    {day.exercisePrescriptions?.map((ep: any) => (
                                        <div key={ep.id} className="flex items-center justify-between text-xs py-1">
                                            <span className="text-text-muted">{ep.exercise?.name}</span>
                                            <span className="text-accent font-mono bg-accent/10 px-1.5 py-0.5 rounded">{ep.targetRepRange}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <div className="p-8 text-center rounded-2xl bg-surface border border-dashed border-white/[0.08]">
                    <p className="text-xs text-text-muted">Loading protocol structure...</p>
                </div>
            )}
        </div>
      </div>

      <div className="mt-auto pt-6">
        <Button 
          variant="primary" 
          size="lg" 
          fullWidth 
          onClick={nextStep}
          className="h-14 font-bold shadow-accent-elevated group"
        >
          Get My Program <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-white/[0.08] hover:border-accent/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</div>
                <div className="text-sm font-bold text-text-primary capitalize">{value}</div>
            </div>
        </div>
    );
}
