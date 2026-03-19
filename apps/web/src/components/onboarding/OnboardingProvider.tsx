'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { OnboardingProfile, INITIAL_ONBOARDING_DATA } from './types';

interface OnboardingContextType {
  data: OnboardingProfile;
  updateData: (updates: Partial<OnboardingProfile>) => void;
  step: number;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  isComplete: boolean;
  completeOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STORAGE_KEY = 'apex_onboarding_state';

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingProfile>(INITIAL_ONBOARDING_DATA);
  const [step, setStepState] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed.data || INITIAL_ONBOARDING_DATA);
        setStepState(parsed.step || 1);
      } catch (e) {
        console.error('Failed to parse onboarding state', e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, step }));
    }
  }, [data, step, isInitialized]);

  const updateData = (updates: Partial<OnboardingProfile>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => setStepState((prev) => prev + 1);
  const prevStep = () => setStepState((prev) => Math.max(1, prev - 1));
  const setStep = (s: number) => setStepState(s);

  const completeOnboarding = () => {
    setIsComplete(true);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <OnboardingContext.Provider
      value={{
        data,
        updateData,
        step,
        nextStep,
        prevStep,
        setStep,
        isComplete,
        completeOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
