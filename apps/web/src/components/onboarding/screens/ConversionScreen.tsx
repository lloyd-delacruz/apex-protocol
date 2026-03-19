'use client';

import React from 'react';
import { useOnboarding } from '../OnboardingProvider';
import { Mail, Apple, Chrome, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ConversionScreen() {
  const { nextStep } = useOnboarding();

  const handleSocialSignup = (provider: string) => {
    console.log(`Signing up with ${provider}`);
    // DEV BYPASS: Simulate success
    localStorage.setItem('apex_token', 'dev-bypass-token');
    nextStep();
  };

  return (
    <div className="flex flex-col h-full p-6 animate-fade-in text-center">
      <div className="mt-12 mb-10">
        <h2 className="text-3xl font-bold text-text-primary mb-3">Join Apex-Pro</h2>
        <p className="text-text-muted max-w-xs mx-auto">
          Your custom workout program is ready. Sign up below to save your profile and start training.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        <Button 
          variant="secondary" 
          fullWidth 
          size="lg"
          onClick={() => handleSocialSignup('apple')}
          className="h-14 bg-white text-black hover:bg-gray-100 border-none font-bold"
        >
          <Apple size={20} className="mr-3 fill-black" />
          Sign up with Apple
        </Button>
        <Button 
          variant="secondary" 
          fullWidth 
          size="lg"
          onClick={() => handleSocialSignup('google')}
          className="h-14 bg-white text-black hover:bg-gray-100 border-none font-bold"
        >
          <Chrome size={20} className="mr-3 text-blue-500" />
          Sign up with Google
        </Button>
        <Button 
          variant="primary" 
          fullWidth 
          size="lg"
          onClick={() => handleSocialSignup('email')}
          className="h-14 font-bold shadow-accent-elevated"
        >
          <Mail size={20} className="mr-3" />
          Continue with Email
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">OR</span>
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <button className="text-sm text-text-muted hover:text-accent transition-colors font-medium">
        Log in with existing account
      </button>

      <div className="mt-auto pt-10">
        <p className="text-[10px] text-text-muted leading-relaxed">
          By signing up, you agree to our <span className="underline cursor-pointer">Privacy Policy</span> and <span className="underline cursor-pointer">Terms & Conditions</span>.
        </p>
      </div>
    </div>
  );
}
