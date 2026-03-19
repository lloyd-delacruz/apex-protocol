'use client';

import React from 'react';
import { useOnboarding } from '../OnboardingProvider';
import { OnboardingGoal } from '../types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Target, Trophy, Dumbbell, Zap, Heart, Weight } from 'lucide-react';

const goals: { id: OnboardingGoal; label: string; icon: any; description: string }[] = [
  { id: 'strength', label: 'Get Stronger', icon: Trophy, description: 'Focus on pure force and power' },
  { id: 'muscle', label: 'Build Muscle', icon: Dumbbell, description: 'Optimize for size and definition' },
  { id: 'body_composition', label: 'Improve Body Comp', icon: Zap, description: 'Lose fat and build lean mass' },
  { id: 'weight_loss', label: 'Lose Weight', icon: Weight, description: 'Prioritize metabolic efficiency' },
  { id: 'general_fitness', label: 'Overall Fitness', icon: Heart, description: 'Stay healthy, active, and capable' },
  { id: 'performance', label: 'Performance', icon: Target, description: 'Conditioning for sport or lifestyle' },
];

export default function GoalScreen() {
  const { data, updateData, nextStep, prevStep } = useOnboarding();

  const handleSelect = (goal: OnboardingGoal) => {
    updateData({ goal });
  };

  return (
    <div className="flex flex-col min-h-[85vh] animate-fade-in">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-text-primary mb-2">What is your goal?</h2>
        <p className="text-text-muted mb-8">Choose the outcome you want most. You can change this later.</p>
        
        <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[60vh] pb-4 pr-1 scrollbar-hide">
          {goals.map((goal) => {
            const isSelected = data.goal === goal.id;
            const Icon = goal.icon;
            
            return (
              <Card
                key={goal.id}
                onClick={() => handleSelect(goal.id)}
                className={`flex items-center gap-4 transition-all duration-200 cursor-pointer border-2 shadow-none ${
                  isSelected ? 'border-accent bg-accent/5' : 'border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-accent text-background' : 'bg-surface-elevated text-text-muted'
                }`}>
                  <Icon size={24} />
                </div>
                <div className="text-left">
                  <h3 className={`font-semibold ${isSelected ? 'text-accent' : 'text-text-primary'}`}>{goal.label}</h3>
                  <p className="text-xs text-text-muted mt-0.5">{goal.description}</p>
                </div>
                {isSelected && (
                  <div className="ml-auto w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                      <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-white/[0.06] flex items-center justify-between gap-4 bg-background">
        <Button variant="ghost" onClick={prevStep}>Back</Button>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={nextStep} className="text-accent underline decoration-accent/30 font-semibold px-2">Skip</Button>
          <Button 
            variant="primary" 
            onClick={nextStep} 
            disabled={!data.goal}
            className="w-32"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
