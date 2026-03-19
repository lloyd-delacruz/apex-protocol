'use client';

import React, { useEffect, useState } from 'react';
import { useOnboarding } from '../OnboardingProvider';
import { useRouter } from 'next/navigation';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import api from '@/lib/api';

export default function FinalizationScreen() {
  const { data, updateData, nextStep, completeOnboarding } = useOnboarding();
  const router = useRouter();
  const [status, setStatus] = useState<'analyzing' | 'generating' | 'success' | 'error'>('analyzing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateProfile = async () => {
      // Step 1: Analyzing user data (visual only)
      await new Promise(r => setTimeout(r, 1500));
      setStatus('generating');

      try {
        // Step 2: Call API to generate initial program
        // We map our onboarding goals/experience to what the API expects
        const res = await api.programs.generate({
          goals: data.goal ? [data.goal] : ['strength'],
          experienceLevel: data.experience || 'beginner',
          daysPerWeek: data.workoutsPerWeek || 3,
          equipment: data.equipment || ['Barbell', 'Dumbbell', 'Bodyweight'],
        });

        if (res?.program?.id) {
          // Success! Save program to state
          updateData({ generatedProgram: res });
          setStatus('success');
          // Auto-advance after a brief "Success" pause
          setTimeout(() => {
            nextStep();
          }, 1500);
        } else {
          throw new Error('No program returned from generator.');
        }
      } catch (err: any) {
        console.error('Finalization failed', err);
        setError(err.message || 'Failed to generate training plan.');
        setStatus('error');
      }
    };

    generateProfile();
  }, [data, nextStep, updateData]);

  const handleManualAdvance = () => {
    nextStep();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] text-center p-6 animate-fade-in">
      {status === 'analyzing' || status === 'generating' ? (
        <div className="relative">
          <div className="w-24 h-24 mb-8 relative">
            <div className="absolute inset-0 rounded-full border-4 border-accent/20 animate-spin border-t-accent" />
            <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-accent animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2 italic">
            {status === 'analyzing' ? 'Analyzing your profile...' : 'Generating your plan...'}
          </h2>
          <p className="text-text-muted max-w-xs mx-auto">
            Our AI is building a custom training regimen based on your {data.goal?.replace('_', ' ')} goals and {data.experience} experience level.
          </p>
        </div>
      ) : status === 'success' ? (
        <div className="animate-scale-in">
          <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center text-accent mb-8 mx-auto shadow-accent-elevated">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-2 italic tracking-tight">You&apos;re all set!</h2>
          <p className="text-text-muted mb-12 max-w-sm mx-auto">
            Your custom <span className="text-accent font-bold">Apex-Pro</span> training plan is ready. Every set and rep has been calculated for your specific setup.
          </p>
          
          <Button 
            variant="primary" 
            size="lg" 
            fullWidth 
            onClick={handleManualAdvance}
            className="h-14 font-bold max-w-xs shadow-accent-elevated group"
          >
            Review My Program <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      ) : (
        <div>
          <div className="w-20 h-20 bg-danger/20 rounded-full flex items-center justify-center text-danger mb-6 mx-auto">
             <span className="text-2xl font-bold">!</span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2 italic">Something went wrong</h2>
          <p className="text-text-muted mb-8">{error || 'An unexpected error occurred.'}</p>
          <Button variant="primary" onClick={() => setStatus('generating')}>Try Again</Button>
          <Button variant="ghost" onClick={handleManualAdvance} className="mt-4">Skip and see summary</Button>
        </div>
      )}
    </div>
  );
}
