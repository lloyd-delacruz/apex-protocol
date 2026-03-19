'use client';

import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingProvider';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Calendar, Clock, Check } from 'lucide-react';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeeklyGoalScreen() {
  const { data, updateData, nextStep, prevStep } = useOnboarding();
  const [showSpecificDays, setShowSpecificDays] = useState((data.specificDays?.length || 0) > 0);

  const handleDayCountSelect = (count: number) => {
    updateData({ workoutsPerWeek: count });
  };

  const toggleSpecificDay = (day: string) => {
    const current = data.specificDays || [];
    if (current.includes(day)) {
      updateData({ specificDays: current.filter(d => d !== day) });
    } else {
      updateData({ specificDays: [...current, day] });
    }
  };

  return (
    <div className="flex flex-col min-h-[85vh] animate-fade-in shadow-surface">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Weekly Goal</h2>
        <p className="text-text-muted mb-8">How many days per week do you want to train?</p>
        
        <div className="flex items-center justify-between gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3, 4, 5, 6, 7].map((num) => {
            const isSelected = data.workoutsPerWeek === num;
            return (
              <button
                key={num}
                onClick={() => handleDayCountSelect(num)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all flex-shrink-0 ${
                  isSelected 
                    ? 'bg-accent text-background shadow-accent-sm scale-110' 
                    : 'bg-surface-elevated text-text-muted border border-white/5 hover:border-white/20'
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-surface/40 rounded-2xl border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <Calendar className="text-text-muted w-5 h-5" />
              <div>
                <p className="font-semibold text-text-primary text-sm">Pick specific days</p>
                <p className="text-xs text-text-muted">Tell us exactly when you hit the gym</p>
              </div>
            </div>
            <button 
              onClick={() => setShowSpecificDays(!showSpecificDays)}
              className={`w-12 h-6 rounded-full transition-colors relative ${showSpecificDays ? 'bg-accent' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${showSpecificDays ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {showSpecificDays && (
            <div className="flex flex-wrap gap-2 animate-slide-up">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = data.specificDays?.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleSpecificDay(day)}
                    className={`flex-1 min-w-[60px] py-3 rounded-xl border text-xs font-bold transition-all ${
                      isSelected 
                        ? 'bg-accent/20 border-accent text-accent' 
                        : 'bg-surface border-white/[0.06] text-text-muted hover:border-white/20'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-white/[0.06] flex items-center justify-between gap-4 bg-background">
        <Button variant="ghost" onClick={prevStep}>Back</Button>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={nextStep} className="text-accent underline decoration-accent/30 font-semibold px-2">Skip</Button>
          <Button 
            variant="primary" 
            onClick={nextStep} 
            disabled={!data.workoutsPerWeek}
            className="w-32"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
