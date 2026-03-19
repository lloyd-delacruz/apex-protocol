'use client';

import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingProvider';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Bell, Clock, ShieldCheck } from 'lucide-react';

export default function NotificationsScreen() {
  const { data, updateData, nextStep, prevStep } = useOnboarding();
  const [time, setTime] = useState(data.notifications?.time || '08:00');

  const handleEnable = () => {
    // In a real app, this would request permission
    updateData({ 
      notifications: { enabled: true, time } 
    });
    nextStep();
  };

  const handleSkip = () => {
    updateData({ 
      notifications: { enabled: false, time } 
    });
    nextStep();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] text-center p-6 animate-fade-in shadow-surface">
      <div className="w-20 h-20 rounded-full bg-accent text-background flex items-center justify-center mb-8 shadow-accent-elevated">
        <Bell size={32} />
      </div>

      <h2 className="text-3xl font-bold text-text-primary tracking-tight mb-4">
        Stay on <span className="text-gradient-accent">track.</span>
      </h2>
      
      <p className="text-text-muted text-lg max-w-sm mb-10">
        We can send you a daily preview of your workout and reminders to keep your streak alive.
      </p>

      <div className="w-full max-w-xs space-y-6 mb-12">
        <div className="space-y-2 text-left">
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Reminder Time</label>
          <div className="relative">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-accent w-4 h-4" />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-surface-elevated border border-white/[0.08] rounded-xl py-4 pl-12 pr-4 text-lg font-bold text-text-primary focus:outline-none focus:border-accent/50"
            />
          </div>
        </div>

        <div className="flex items-start gap-3 bg-surface/40 p-4 rounded-xl border border-white/[0.06] text-left">
          <ShieldCheck className="text-accent w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-text-muted leading-relaxed">
            You can customize these notifications or turn them off at any time in your profile settings.
          </p>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <Button 
          variant="primary" 
          size="lg" 
          fullWidth 
          onClick={handleEnable}
          className="h-14 font-bold shadow-accent-elevated"
        >
          Enable Notifications
        </Button>
        <Button 
          variant="ghost" 
          size="lg" 
          fullWidth 
          onClick={handleSkip}
          className="h-14"
        >
          Not Now
        </Button>
      </div>

      <div className="mt-8">
        <Button variant="ghost" onClick={prevStep} className="text-text-muted hover:text-text-primary">
          Back
        </Button>
      </div>
    </div>
  );
}
