'use client';

import React from 'react';
import { useOnboarding } from './OnboardingProvider';
import WelcomeScreen from './screens/WelcomeScreen';
import GoalScreen from './screens/GoalScreen';
import ConsistencyScreen from './screens/ConsistencyScreen';
import ExperienceLevelScreen from './screens/ExperienceLevelScreen';
import EnvironmentScreen from './screens/EnvironmentScreen';
import EquipmentSelectorScreen from './screens/EquipmentSelectorScreen';
import CalibrationIntroScreen from './screens/CalibrationIntroScreen';
import BestLiftsScreen from './screens/BestLiftsScreen';
import WeeklyGoalScreen from './screens/WeeklyGoalScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import BodyStatsScreen from './screens/BodyStatsScreen';
import FinalizationScreen from './screens/FinalizationScreen';
import ProgramSummaryScreen from './screens/ProgramSummaryScreen';
import ConversionScreen from './screens/ConversionScreen';
import PaywallScreen from './screens/PaywallScreen';

export default function OnboardingFlow() {
  const { step } = useOnboarding();

  const renderScreen = () => {
    switch (step) {
      case 1: return <WelcomeScreen />;
      case 2: return <GoalScreen />;
      case 3: return <ConsistencyScreen />;
      case 4: return <ExperienceLevelScreen />;
      case 5: return <EnvironmentScreen />;
      case 6: return <EquipmentSelectorScreen />;
      case 7: return <CalibrationIntroScreen />;
      case 8: return <BestLiftsScreen />;
      case 9: return <WeeklyGoalScreen />;
      case 10: return <NotificationsScreen />;
      case 11: return <BodyStatsScreen />;
      case 12: return <FinalizationScreen />;
      case 13: return <ProgramSummaryScreen />;
      case 14: return <ConversionScreen />;
      case 15: return <PaywallScreen />;
      default: return <WelcomeScreen />;
    }
  };

  // Progress bar only covers the 11 data-collection screens (steps 2–12)
  // Steps 12–15 are finalization/paywall and hide the header
  const DATA_SCREENS = 11;
  const progress = Math.min(((step - 1) / DATA_SCREENS) * 100, 100);

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto border-x border-white/[0.04] shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent/5 blur-[120px] pointer-events-none" />
      
      {/* Progress Header (only show after Welcome) */}
      {step > 1 && step < 12 && (
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md p-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Step {step - 1} of {DATA_SCREENS}</span>
            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent transition-all duration-500 ease-out shadow-accent-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Screen Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative z-10">
        {renderScreen()}
      </div>
    </div>
  );
}
