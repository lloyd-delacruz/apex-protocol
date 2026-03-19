'use client';

import React from 'react';
import { useOnboarding } from '../OnboardingProvider';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function WelcomeScreen() {
  const { nextStep, skipOnboarding } = useOnboarding();
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6 animate-fade-in">
      <div className="relative mb-12">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent to-[#7B61FF] rotate-12 flex items-center justify-center shadow-accent-elevated">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="-rotate-12">
            <path d="M3 12h4l2-8 4 16 2-8h2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center border border-white/10 shadow-lg animate-pulse">
          <span className="text-xs">⚡️</span>
        </div>
      </div>

      <h1 className="font-heading text-4xl font-bold text-text-primary tracking-tight mb-4">
        Welcome to <span className="text-gradient-accent">Apex-Pro</span>
      </h1>
      
      <p className="text-text-muted text-lg max-w-sm mb-12">
        Data-driven programming tailored to your goals, environment, and experience. Let&apos;s build your elite training plan.
      </p>

      <div className="w-full max-w-xs space-y-4">
        <Button 
          variant="primary" 
          size="lg" 
          fullWidth 
          onClick={nextStep}
          className="shadow-accent-elevated h-14 text-base"
        >
          Get Started
        </Button>
        <Button 
          variant="ghost" 
          size="lg" 
          fullWidth 
          onClick={skipOnboarding}
          className="h-14"
        >
          Log In
        </Button>
      </div>
    </div>
  );
}
