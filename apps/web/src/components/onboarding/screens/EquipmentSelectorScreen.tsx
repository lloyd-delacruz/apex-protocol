'use client';

import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingProvider';
import { ALL_EQUIPMENT_OPTIONS } from '../presets';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Search, Check, X } from 'lucide-react';

export default function EquipmentSelectorScreen() {
  const { data, updateData, nextStep, prevStep } = useOnboarding();
  const [search, setSearch] = useState('');

  const toggleEquipment = (item: string) => {
    const current = data.equipment || [];
    if (current.includes(item)) {
      updateData({ equipment: current.filter((i) => i !== item) });
    } else {
      updateData({ equipment: [...current, item] });
    }
  };

  const filteredOptions = ALL_EQUIPMENT_OPTIONS.map(cat => ({
    ...cat,
    items: cat.items.filter(item => item.toLowerCase().includes(search.toLowerCase()))
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="flex flex-col min-h-[85vh] animate-fade-in shadow-surface">
      <div className="p-6 pb-2">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Adjust your equipment</h2>
        <p className="text-text-muted mb-6">We&apos;ve pre-selected items based on your environment. Add or remove anything you have access to.</p>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
          <input
            type="text"
            placeholder="Search equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-elevated border border-white/[0.08] rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-accent/50 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-8 pb-10 scrollbar-hide">
        {filteredOptions.map((category) => (
          <div key={category.category} className="space-y-3">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">{category.category}</h3>
            <div className="grid grid-cols-2 gap-2">
              {category.items.map((item) => {
                const isSelected = data.equipment?.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleEquipment(item)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                      isSelected 
                        ? 'bg-accent/10 border-accent text-accent' 
                        : 'bg-surface border-white/[0.06] text-text-muted hover:border-white/20'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                      isSelected ? 'bg-accent border-accent text-background' : 'bg-background border-white/10'
                    }`}>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                    <span className="truncate">{item}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto p-6 border-t border-white/[0.06] flex items-center justify-between gap-4 bg-background">
        <Button variant="ghost" onClick={prevStep}>Back</Button>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={nextStep} className="text-accent underline decoration-accent/30 font-semibold px-2">Skip</Button>
          <Button 
            variant="primary" 
            onClick={nextStep} 
            className="w-32"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
