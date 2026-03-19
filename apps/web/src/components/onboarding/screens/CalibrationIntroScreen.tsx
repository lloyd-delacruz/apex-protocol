'use client';

import React from 'react';
import { useOnboarding } from '../OnboardingProvider';
import Button from '@/components/ui/Button';
import { BarChart3, TrendingUp, Info } from 'lucide-react';

export default function CalibrationIntroScreen() {
  const { nextStep, setStep } = useOnboarding();

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] text-center p-6 animate-fade-in shadow-surface">
      <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-accent mb-8 animate-pulse shadow-accent-sm">
        <BarChart3 size={32} />
      </div>

      <h2 className="text-3xl font-bold text-text-primary tracking-tight mb-4">
        Personalize your <span className="text-gradient-accent">strength floor</span>
      </h2>
      
      <p className="text-text-muted text-lg max-w-sm mb-8">
        Apex-Pro uses your baseline lifts to calculate starting weights and progression curves accurately from Day 1.
      </p>

      <div className="bg-surface-elevated border border-white/[0.06] rounded-2xl p-5 mb-10 w-full max-w-sm text-left">
        <div className="flex items-start gap-3">
          <Info className="text-accent w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-primary">Optional but recommended</p>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              If you don&apos;t enter lifts now, the app will calibrate based on your first few workouts. You can always add them later in Settings.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <Button 
          variant="primary" 
          size="lg" 
          fullWidth 
          onClick={nextStep}
          className="h-14 font-bold shadow-accent-elevated"
        >
          Enter Best Lifts
        </Button>
        <Button 
          variant="ghost" 
          size="lg" 
          fullWidth 
          onClick={() => setStep(9)} // Skip to Step 9 (Weekly Training Goal)
          className="h-14"
        >
          Not Now
        </Button>
      </div>
    </div>
  );
}
