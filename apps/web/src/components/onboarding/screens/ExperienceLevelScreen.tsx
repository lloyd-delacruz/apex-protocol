'use client';

import React from 'react';
import { useOnboarding } from '../OnboardingProvider';
import { ExperienceLevel } from '../types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Star, Stars, GraduationCap, Medal, Crown } from 'lucide-react';

const options: { id: ExperienceLevel; label: string; sublabel: string; icon: any }[] = [
  { id: 'beginner', label: 'Brand New', sublabel: 'Starting for the first time', icon: Star },
  { id: 'beginner', label: 'Less than 1 year', sublabel: 'Building a foundation', icon: Stars },
  { id: 'intermediate', label: '1 - 2 Years', sublabel: 'Consistent habit, familiar with lifts', icon: GraduationCap },
  { id: 'intermediate', label: '2 - 4 Years', sublabel: 'Structured training experience', icon: Medal },
  { id: 'advanced', label: '4+ Years', sublabel: 'Elite experience and high proficiency', icon: Crown },
];

export default function ExperienceLevelScreen() {
  const { data, updateData, nextStep, prevStep } = useOnboarding();

  // We need to keep track of which specific option was selected even if they map to the same id
  // For simplicity in this demo, I'll use the label as a secondary key if needed, 
  // but the user's types only care about the ID.
  const [selectedLabel, setSelectedLabel] = React.useState<string | null>(null);

  const handleSelect = (id: ExperienceLevel, label: string) => {
    updateData({ experience: id });
    setSelectedLabel(label);
  };

  return (
    <div className="flex flex-col min-h-[85vh] animate-fade-in">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Your experience?</h2>
        <p className="text-text-muted mb-8">How long have you been strength training seriously?</p>
        
        <div className="space-y-3">
          {options.map((opt, idx) => {
            const isSelected = data.experience === opt.id && selectedLabel === opt.label;
            const Icon = opt.icon;
            
            return (
              <Card
                key={`${opt.label}-${idx}`}
                onClick={() => handleSelect(opt.id, opt.label)}
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
            disabled={!data.experience}
            className="w-32"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
