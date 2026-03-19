'use client';

import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingProvider';
import { User, Calendar, Ruler, Weight, Heart, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function BodyStatsScreen() {
  const { data, updateData, nextStep } = useOnboarding();
  const [stats, setStats] = useState({
    gender: data.bodyStats?.gender || '',
    dob: data.bodyStats?.dob || '',
    height: data.bodyStats?.height || '',
    weight: data.bodyStats?.weight || '',
    unit: data.bodyStats?.unit || 'kg',
  });

  const handleNext = () => {
    updateData({
      bodyStats: {
        gender: stats.gender,
        dob: stats.dob,
        height: stats.height ? Number(stats.height) : undefined,
        weight: stats.weight ? Number(stats.weight) : undefined,
        unit: stats.unit as 'kg' | 'lb',
      },
    });
    nextStep();
  };

  const syncHealth = () => {
    // Placeholder for health sync
    alert('Connecting to Apple Health... (Integration pending)');
  };

  const isFormValid = stats.gender || stats.dob || stats.height || stats.weight;

  return (
    <div className="flex flex-col h-full p-6 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-text-primary mb-2">Your Body Stats</h2>
        <p className="text-text-muted">Enhance your personalization with health data.</p>
      </div>

      {/* Health Sync Section */}
      <Card className="p-6 mb-8 border-accent/20 bg-accent/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Heart size={80} className="text-accent" />
        </div>
        <div className="relative z-10 text-center">
          <h3 className="text-xl font-bold text-text-primary mb-2 italic">Sync with Apple Health</h3>
          <ul className="text-xs text-text-muted space-y-2 mb-6 text-left max-w-[240px] mx-auto">
            <li className="flex items-center gap-2"><CheckIcon /> Exercises, reps, and weight match profile</li>
            <li className="flex items-center gap-2"><CheckIcon /> Calculate calories burned</li>
            <li className="flex items-center gap-2"><CheckIcon /> Track your fitness progress</li>
          </ul>
          <Button 
            variant="primary" 
            onClick={syncHealth}
            className="w-full bg-white text-black hover:bg-gray-100 border-none font-bold"
          >
            <Heart size={18} className="mr-2 text-red-500 fill-red-500" />
            Sync with Apple Health
          </Button>
          <button className="text-[10px] text-text-muted uppercase tracking-widest mt-4 font-bold hover:text-accent transition-colors">
            Learn More
          </button>
        </div>
      </Card>

      <div className="flex items-center gap-4 mb-8">
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">or enter manually</span>
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>

      {/* Manual Entry Form */}
      <div className="space-y-4 mb-12">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Gender</label>
            <select
              value={stats.gender}
              onChange={(e) => setStats({ ...stats, gender: e.target.value })}
              className="w-full h-12 bg-surface border border-white/[0.08] rounded-xl px-4 text-sm text-text-primary focus:border-accent outline-none transition-all appearance-none"
            >
              <option value="" disabled>Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Date of Birth</label>
            <Input
              type="date"
              value={stats.dob}
              onChange={(e) => setStats({ ...stats, dob: e.target.value })}
              className="h-12"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Height (cm)</label>
            <Input
              type="number"
              placeholder="e.g. 180"
              value={stats.height}
              onChange={(e) => setStats({ ...stats, height: e.target.value })}
              className="h-12"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Weight ({stats.unit})</label>
            <Input
              type="number"
              placeholder="e.g. 85"
              value={stats.weight}
              onChange={(e) => setStats({ ...stats, weight: e.target.value })}
              className="h-12"
            />
          </div>
        </div>

        <div className="flex justify-center pt-2">
            <div className="flex bg-surface border border-white/[0.08] rounded-full p-1 self-center">
                <button 
                    onClick={() => setStats({...stats, unit: 'kg'})}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${stats.unit === 'kg' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}
                >
                    KG
                </button>
                <button 
                    onClick={() => setStats({...stats, unit: 'lb'})}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${stats.unit === 'lb' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}
                >
                    LB
                </button>
            </div>
        </div>
      </div>

      <div className="mt-auto space-y-4">
        <Button 
          variant="primary" 
          size="lg" 
          fullWidth
          disabled={!isFormValid}
          onClick={handleNext}
          className="h-14 font-bold shadow-accent-elevated group"
        >
          Next <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
        <button 
          onClick={nextStep}
          className="w-full text-center py-2 text-sm text-text-muted hover:text-text-primary transition-colors font-medium"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
