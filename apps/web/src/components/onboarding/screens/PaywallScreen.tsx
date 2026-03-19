'use client';

import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingProvider';
import { Check, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function PaywallScreen() {
  const { completeOnboarding } = useOnboarding();
  const router = useRouter();
  const [billing, setBilling] = useState<'yearly' | 'monthly'>('yearly');

  const handleSubscribe = () => {
    // DEV BYPASS: Simulate subscription
    localStorage.setItem('apex_subscription_active', 'true');
    localStorage.setItem('apex_onboarding_complete', 'true');
    completeOnboarding();
    router.push('/dashboard');
  };

  const benefits = [
    { title: 'Built for your body', desc: 'Workouts that match your history & needs' },
    { title: 'Tailored to your goal', desc: 'Watch strength & body metrics improve' },
    { title: 'Customized to your equipment', desc: 'Use only what you have available' },
    { title: 'Works with your schedule', desc: 'A plan that updates when you miss a day' },
  ];

  return (
    <div className="flex flex-col h-full p-6 animate-fade-in text-center relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-accent/10 blur-[120px] pointer-events-none -z-10" />

      <div className="mt-8 mb-8 text-center uppercase tracking-[0.2em] text-xs font-black text-text-muted opacity-50">
        APEX PROTOCOL
      </div>

      <h2 className="text-4xl font-extrabold text-text-primary mb-2 italic">Try 7 days for free</h2>
      <p className="text-text-muted mb-8 italic">
        then <span className="text-text-primary font-bold">{billing === 'yearly' ? '$129.99' : '$14.99'}</span>/{billing === 'yearly' ? 'year' : 'month'}
      </p>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-10">
        <div className="flex bg-surface border border-white/[0.08] rounded-full p-1 self-center">
            <button 
                onClick={() => setBilling('yearly')}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${billing === 'yearly' ? 'bg-white text-black shadow-lg' : 'text-text-muted hover:text-text-primary'}`}
            >
                Yearly
            </button>
            <button 
                onClick={() => setBilling('monthly')}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${billing === 'monthly' ? 'bg-white text-black shadow-lg' : 'text-text-muted hover:text-text-primary'}`}
            >
                Monthly
            </button>
        </div>
      </div>

      {/* Benefits List */}
      <div className="space-y-6 mb-12 text-left px-2">
        {benefits.map((benefit, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
              <Check size={14} className="text-accent" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">{benefit.title}</h4>
              <p className="text-xs text-text-muted leading-normal">{benefit.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-6">
        <div className="flex items-center justify-center gap-2 text-[10px] text-text-muted uppercase tracking-widest font-bold">
            <ShieldCheck size={14} className="text-accent" />
            No payment due today
        </div>
        
        <Button 
          variant="primary" 
          size="lg" 
          fullWidth 
          onClick={handleSubscribe}
          className="h-14 font-black shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)] group bg-accent hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          START YOUR FREE TRIAL
        </Button>

        <div className="flex justify-between px-4 pb-2">
            <button className="text-[10px] text-text-muted uppercase tracking-widest border-b border-white/10 pb-0.5">Have a subscription?</button>
            <div className="flex gap-4 text-[10px] text-text-muted uppercase tracking-widest">
                <button className="border-b border-white/10 pb-0.5">Privacy</button>
                <button className="border-b border-white/10 pb-0.5">Terms</button>
            </div>
        </div>
      </div>
    </div>
  );
}
