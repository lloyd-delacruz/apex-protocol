'use client';

import React from 'react';
import { useOnboarding } from '../OnboardingProvider';
import { TrainingConsistency } from '../types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Ship, RotateCcw, Activity, CalendarCheck, Flame } from 'lucide-react';

const options: { id: TrainingConsistency; label: string; icon: any; description: string }[] = [
  { id: 'brand_new', label: 'I’m brand new', icon: Ship, description: 'Starting fresh today' },
  { id: 'returning', label: 'Returning after a break', icon: RotateCcw, description: 'Getting back into the groove' },
  { id: 'inconsistent', label: 'Inconsistent lately', icon: Activity, description: 'Ready to build better habits' },
  { id: 'consistent', label: 'Fairly consistent', icon: CalendarCheck, description: 'Training 2-3 times per week' },
  { id: 'very_consistent', label: 'Very consistent', icon: Flame, description: 'Training 4+ times per week regularly' },
];

export default function ConsistencyScreen() {
  const { data, updateData, nextStep, prevStep } = useOnboarding();

  const handleSelect = (consistency: TrainingConsistency) => {
    updateData({ consistency });
  };

  return (
    <div className="flex flex-col min-h-[85vh] animate-fade-in">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-text-primary mb-2">How consistent are you?</h2>
        <p className="text-text-muted mb-8">Be honest — this helps us calibrate your initial training intensity.</p>
        
        <div className="space-y-3">
          {options.map((opt) => {
            const isSelected = data.consistency === opt.id;
            const Icon = opt.icon;
            
            return (
              <Card
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className={`flex items-center gap-4 transition-all duration-200 cursor-pointer border-2 shadow-none py-4 ${
                  isSelected ? 'border-accent bg-accent/5' : 'border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-accent text-background' : 'bg-surface-elevated text-text-muted'
                }`}>
                  <Icon size={20} />
                </div>
                <div className="text-left">
                  <h3 className={`font-semibold ${isSelected ? 'text-accent' : 'text-text-primary'}`}>{opt.label}</h3>
                  <p className="text-xs text-text-muted mt-0.5">{opt.description}</p>
                </div>
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
            disabled={!data.consistency}
            className="w-32"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
