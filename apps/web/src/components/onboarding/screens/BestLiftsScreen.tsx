'use client';

import React from 'react';
import { useOnboarding } from '../OnboardingProvider';
import { LiftEntry } from '../types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Dumbbell } from 'lucide-react';

const defaultLifts = [
  { key: 'back_squat', name: 'Back Squat' },
  { key: 'bench_press', name: 'Bench Press' },
  { key: 'deadlift', name: 'Deadlift' },
  { key: 'overhead_press', name: 'Overhead Press' },
  { key: 'bent_over_row', name: 'Bent Over Row' },
];

export default function BestLiftsScreen() {
  const { data, updateData, nextStep, prevStep } = useOnboarding();

  const handleLiftChange = (key: string, name: string, field: keyof LiftEntry, value: any) => {
    const current = [...(data.bestLifts || [])];
    const index = current.findIndex(l => l.exerciseKey === key);
    
    if (index >= 0) {
      current[index] = { ...current[index], [field]: value };
    } else {
      current.push({ exerciseKey: key, exerciseName: name, [field]: value, unit: 'kg' });
    }
    
    updateData({ bestLifts: current });
  };

  return (
    <div className="flex flex-col min-h-[85vh] animate-fade-in shadow-surface">
      <div className="p-6 pb-2">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Enter your best lifts</h2>
        <p className="text-text-muted mb-8">Enter roughly what you can lift for 1-5 reps. This calibrates your Day 1 weight recommendations.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-10 scrollbar-hide">
        {defaultLifts.map((lift) => {
          const entry = data.bestLifts?.find(l => l.exerciseKey === lift.key);
          const weight = entry?.weight || '';
          const reps = entry?.reps || '';
          const unit = entry?.unit || 'kg';

          return (
            <Card key={lift.key} className="space-y-4 border-white/[0.06] shadow-none bg-surface/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <Dumbbell size={16} />
                </div>
                <h3 className="font-bold text-text-primary">{lift.name}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">Weight</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0"
                      value={weight}
                      onChange={(e) => handleLiftChange(lift.key, lift.name, 'weight', parseFloat(e.target.value) || 0)}
                      className="w-full bg-background border border-white/[0.08] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50"
                    />
                    <button 
                      onClick={() => handleLiftChange(lift.key, lift.name, 'unit', unit === 'kg' ? 'lb' : 'kg')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-accent bg-accent/10 px-2 py-1 rounded-md"
                    >
                      {unit.toUpperCase()}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">Reps</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={reps}
                    onChange={(e) => handleLiftChange(lift.key, lift.name, 'reps', parseInt(e.target.value) || 0)}
                    className="w-full bg-background border border-white/[0.08] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50"
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-auto p-6 border-t border-white/[0.06] flex items-center justify-between gap-4 bg-background">
        <Button variant="ghost" onClick={prevStep}>Back</Button>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={nextStep} className="text-accent underline decoration-accent/30 font-semibold px-2">Skip</Button>
          <Button 
            variant="primary" 
            onClick={nextStep} 
            className="w-32"
          >
            Finish Lifts
          </Button>
        </div>
      </div>
    </div>
  );
}
