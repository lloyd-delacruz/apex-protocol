'use client';

import React from 'react';
import { useOnboarding } from '../OnboardingProvider';
import { WorkoutEnvironment } from '../types';
import { EQUIPMENT_PRESETS } from '../presets';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Building2, Store, Home, Sofa, User, Settings } from 'lucide-react';

const options: { id: WorkoutEnvironment; label: string; sublabel: string; icon: any }[] = [
  { id: 'commercial_gym', label: 'Commercial Gym', sublabel: 'Full equipment, machines, racks', icon: Building2 },
  { id: 'small_gym', label: 'Small Gym', sublabel: 'Standard weights and machines', icon: Store },
  { id: 'home_gym', label: 'Home Gym', sublabel: 'Racks, barbell, and plates', icon: Home },
  { id: 'minimal_home', label: 'Minimal Equipment', sublabel: 'Dumbbells and bands', icon: Sofa },
  { id: 'bodyweight_only', label: 'Bodyweight Only', sublabel: 'No equipment needed', icon: User },
  { id: 'custom', label: 'Custom Setup', sublabel: 'Choose your own equipment', icon: Settings },
];

export default function EnvironmentScreen() {
  const { data, updateData, nextStep, prevStep } = useOnboarding();

  const handleSelect = (env: WorkoutEnvironment) => {
    updateData({ 
      environment: env,
      equipment: env === 'custom' ? [] : (EQUIPMENT_PRESETS[env as keyof typeof EQUIPMENT_PRESETS] || [])
    });
  };

  return (
    <div className="flex flex-col min-h-[85vh] animate-fade-in">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Where do you train?</h2>
        <p className="text-text-muted mb-8">This determines the equipment we assume you have access to.</p>
        
        <div className="space-y-3">
          {options.map((opt) => {
            const isSelected = data.environment === opt.id;
            const Icon = opt.icon;
            
            return (
              <Card
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className={`flex items-center gap-4 transition-all duration-200 cursor-pointer border-2 shadow-none py-3 ${
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
                  <p className="text-xs text-text-muted mt-0.5">{opt.sublabel}</p>
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
            disabled={!data.environment}
            className="w-32"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
