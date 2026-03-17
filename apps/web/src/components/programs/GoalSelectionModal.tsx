'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ApiProgram } from '@/lib/api';
import {
  Dumbbell,
  BicepsFlexed, // or Target if fails
  Flame,
  HeartPulse,
  Zap,
  Activity,
  StretchHorizontal, // or move/stretch
  X,
  Target,
  Sparkles
} from 'lucide-react';

export type GoalType =
  | 'strength'
  | 'hypertrophy'
  | 'fat_loss'
  | 'endurance'
  | 'athletic'
  | 'general'
  | 'mobility';

interface GoalOption {
  id: GoalType;
  title: string;
  description: string;
  icon: React.ElementType;
}

const GOALS: GoalOption[] = [
  {
    id: 'strength',
    title: 'Strength',
    description: 'Build maximum strength with heavy compound lifts',
    icon: Dumbbell,
  },
  {
    id: 'hypertrophy',
    title: 'Hypertrophy',
    description: 'Increase muscle size and improve aesthetics',
    icon: BicepsFlexed,
  },
  {
    id: 'fat_loss',
    title: 'Fat Loss',
    description: 'Burn body fat while preserving muscle',
    icon: Flame,
  },
  {
    id: 'endurance',
    title: 'Endurance',
    description: 'Improve muscular and cardiovascular endurance',
    icon: HeartPulse,
  },
  {
    id: 'athletic',
    title: 'Athletic Performance',
    description: 'Develop power, agility, and explosive performance',
    icon: Zap,
  },
  {
    id: 'general',
    title: 'General Fitness',
    description: 'Balanced strength, conditioning, and health',
    icon: Activity,
  },
  {
    id: 'mobility',
    title: 'Mobility & Recovery',
    description: 'Improve flexibility, joint health, and recovery',
    icon: StretchHorizontal,
  },
];

interface GoalSelectionModalProps {
  programs: ApiProgram[];
  onAssign: (id: string) => Promise<void>;
  onClose: () => void;
  onLaunchAI?: (goal?: GoalType) => void;
}

export default function GoalSelectionModal({ programs, onAssign, onClose, onLaunchAI }: GoalSelectionModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedGoal, setSelectedGoal] = useState<GoalType | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

  const fallbackMatch = (program: ApiProgram, goal: GoalType) => {
    // goalType may be a comma-separated list e.g. 'strength,hypertrophy'
    if (program.goalType) {
      const programGoals = program.goalType.split(',').map((g) => g.trim());
      if (programGoals.includes(goal)) return true;
    }

    // Name-based fallback for programs without explicit goalType
    if (program.name.toLowerCase().includes(goal.replace('_', ' '))) return true;

    // Show all programs when no specific match so the list is never empty
    return true;
  };

  const filteredPrograms = programs.filter(p => selectedGoal && fallbackMatch(p, selectedGoal));

  async function handleAssign(id: string) {
    setAssigning(id);
    await onAssign(id);
    setAssigning(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-surface-elevated border border-white/[0.08] rounded-modal w-full max-w-2xl shadow-elevated animate-slide-up max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div>
            <h2 className="font-heading text-xl font-bold text-text-primary">
              {step === 1 ? 'Choose Your Training Goal' : 'Recommended Programs'}
            </h2>
            <p className="text-text-muted text-sm mt-1">
              {step === 1 
                ? 'Select the primary goal you want to focus on for your next training program.'
                : 'Based on your goal, here are the programs we suggest.'}
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors p-2 rounded-full hover:bg-white/[0.04]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {GOALS.map((goal) => {
                const isSelected = selectedGoal === goal.id;
                const Icon = goal.icon;
                return (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className={`flex flex-col text-left p-4 rounded-card border transition-all duration-200 ${
                      isSelected 
                        ? 'bg-accent/10 border-accent shadow-accent-sm' 
                        : 'bg-surface border-white/[0.08] hover:border-white/20 hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-full ${isSelected ? 'bg-accent/20 text-accent' : 'bg-white/[0.06] text-text-muted'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className={`font-semibold ${isSelected ? 'text-accent' : 'text-text-primary'}`}>{goal.title}</h3>
                    </div>
                    <p className={`text-sm ${isSelected ? 'text-text-primary/90' : 'text-text-muted'}`}>
                      {goal.description}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {filteredPrograms.length === 0 && (
                <div className="text-center py-10">
                  <Target className="w-12 h-12 text-white/[0.1] mx-auto mb-3" />
                  <p className="text-text-muted">No programs found for this goal yet.</p>
                </div>
              )}
              {filteredPrograms.map((program) => (
                <div
                  key={program.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-card bg-surface border border-white/[0.06] hover:border-white/10 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-text-primary text-base">{program.name}</h3>
                      {program.experienceLevel && (
                        <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-white/[0.06] text-text-muted">
                          {program.experienceLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-muted line-clamp-2 mb-3">
                      {program.description || 'No description provided.'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5"/> {program.totalWeeks} weeks</span>
                      {program.daysPerWeek != null && (
                        <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5"/> {program.daysPerWeek} days/week</span>
                      )}
                      {program.experienceLevel && (
                        <span className="flex items-center gap-1.5 capitalize"><Target className="w-3.5 h-3.5"/> {program.experienceLevel}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => handleAssign(program.id)}
                    loading={assigning === program.id}
                    className="w-full sm:w-auto mt-2 sm:mt-0"
                  >
                    Assign Program
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 1 && (
          <div className="p-6 border-t border-white/[0.06] flex justify-between gap-3 bg-surface-elevated items-center">
            <Button variant="ghost" className="text-accent hover:text-accent hover:bg-accent/10" onClick={() => onLaunchAI?.(selectedGoal || undefined)}>
              <Sparkles className="w-4 h-4 mr-2" /> Let AI Build It
            </Button>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button 
                variant="primary" 
                onClick={() => setStep(2)} 
                disabled={!selectedGoal}
              >
                Continue Template
              </Button>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="p-6 border-t border-white/[0.06] flex justify-start gap-3 bg-surface-elevated">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back to Goals
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
