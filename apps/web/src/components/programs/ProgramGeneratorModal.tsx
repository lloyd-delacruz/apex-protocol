'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Settings, Target, User, Calendar, Dumbbell, ArrowRight, X, Sparkles, FileText } from 'lucide-react';
import { GoalType } from './GoalSelectionModal';
import { ApiProgramFull } from '@/lib/api';

import ProgramGeneratorStepGoal from './ProgramGeneratorStepGoal';
import ProgramGeneratorStepExperience from './ProgramGeneratorStepExperience';
import ProgramGeneratorStepTrainingDays from './ProgramGeneratorStepTrainingDays';
import ProgramGeneratorStepEquipment from './ProgramGeneratorStepEquipment';
import ProgramGeneratorStepExerciseFocus from './ProgramGeneratorStepExerciseFocus';
import ProgramGeneratorReview from './ProgramGeneratorReview';
import ProgramGeneratorPreview from './ProgramGeneratorPreview';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface GeneratorState {
  goals: GoalType[];           // one or more goals; first is the primary
  experience: ExperienceLevel | null;
  days: number;
  equipment: string[];
  compoundPreference: 'compound' | 'mixed' | 'isolation';
}

interface ProgramGeneratorModalProps {
  onClose: () => void;
  onSuccess: (programId: string) => void;
  initialGoal?: GoalType;
}

export default function ProgramGeneratorModal({ onClose, onSuccess, initialGoal }: ProgramGeneratorModalProps) {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<GeneratorState>({
    goals: initialGoal ? [initialGoal] : [],
    experience: null,
    days: 4,
    equipment: ['Barbell', 'Dumbbell', 'Bodyweight'],
    compoundPreference: 'mixed',
  });
  const [generatedProgram, setGeneratedProgram] = useState<ApiProgramFull | null>(null);
  // Tracks whether generation or assignment is in-flight so we can block unsafe close
  const [isBusy, setIsBusy] = useState(false);

  const updateState = (updates: Partial<GeneratorState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return state.goals.length > 0;
      case 2: return state.experience !== null;
      case 3: return state.days >= 2 && state.days <= 7;
      case 4: return state.equipment.length > 0;
      case 5: return true; // compound preference always has a default
      case 6: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (isStepValid() && step < 6) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Safe close: noop when an async operation is in-flight
  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  const handleGenerated = (program: ApiProgramFull) => {
    setGeneratedProgram(program);
    // Generation complete — release busy lock so close is allowed again
    setIsBusy(false);
  };

  const handleAssignSuccess = (programId: string) => {
    onSuccess(programId);
  };

  const getStepIcon = (s: number) => {
    switch (s) {
      case 1: return <Target className="w-4 h-4" />;
      case 2: return <User className="w-4 h-4" />;
      case 3: return <Calendar className="w-4 h-4" />;
      case 4: return <Dumbbell className="w-4 h-4" />;
      case 5: return <Sparkles className="w-4 h-4" />;
      case 6: return <FileText className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStepTitle = (s: number) => {
    switch (s) {
      case 1: return 'Goal';
      case 2: return 'Experience';
      case 3: return 'Frequency';
      case 4: return 'Equipment';
      case 5: return 'Focus';
      case 6: return 'Review';
      default: return '';
    }
  };

  const isPreview = generatedProgram !== null;

  const renderStep = () => {
    if (isPreview) {
      return (
        <ProgramGeneratorPreview
          program={generatedProgram}
          state={state}
          onSuccess={handleAssignSuccess}
          onClose={handleClose}
          onBusyChange={setIsBusy}
        />
      );
    }
    switch (step) {
      case 1: return <ProgramGeneratorStepGoal state={state} updateState={updateState} onNext={handleNext} />;
      case 2: return <ProgramGeneratorStepExperience state={state} updateState={updateState} onNext={handleNext} />;
      case 3: return <ProgramGeneratorStepTrainingDays state={state} updateState={updateState} />;
      case 4: return <ProgramGeneratorStepEquipment state={state} updateState={updateState} />;
      case 5: return <ProgramGeneratorStepExerciseFocus state={state} updateState={updateState} />;
      case 6: return <ProgramGeneratorReview state={state} onEditStep={setStep} onGenerated={handleGenerated} onBusyChange={setIsBusy} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      {/* Backdrop — non-interactive while busy */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isBusy ? 'cursor-not-allowed' : 'cursor-default'}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative bg-surface-elevated border border-accent/20 rounded-modal w-full max-w-3xl shadow-accent-elevated animate-slide-up max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.06] bg-surface-elevated/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-accent/10 text-accent border border-accent/20 shadow-inner">
              {isPreview ? <Sparkles className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-text-primary tracking-tight">
                {isPreview ? 'Generated Protocol' : 'Program Setup'}
              </h2>
              <p className="text-text-muted text-sm mt-1 flex items-center gap-1.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full bg-accent ${isBusy ? 'animate-pulse' : ''}`} />
                {isBusy
                  ? isPreview ? 'Assigning program...' : 'Generating program...'
                  : isPreview ? 'Review and assign your new program' : 'Configure your training parameters'
                }
              </p>
            </div>
          </div>

          {/* X button — disabled while busy to prevent accidental close during generation */}
          <button
            onClick={handleClose}
            disabled={isBusy}
            aria-label={isBusy ? 'Cannot close while operation is in progress' : 'Close modal'}
            className={`text-text-muted p-2 rounded-full transition-all
              ${isBusy
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:text-text-primary hover:bg-white/[0.08] hover:rotate-90 active:scale-95'
              }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Stepper — only shown during wizard steps 1–5 */}
        {!isPreview && step < 6 && (
          <div className="hidden sm:block px-6 pt-6 pb-2">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-[8%] right-[8%] top-1/2 -translate-y-1/2 h-[2px] bg-white/[0.06] -z-10" />
              <div
                className="absolute left-[8%] top-1/2 -translate-y-1/2 h-[2px] bg-accent -z-10 transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / 4) * 84}%` }}
              />
              {[1, 2, 3, 4, 5].map((s) => {
                const isActive = step === s;
                const isCompleted = step > s;
                return (
                  <div key={s} className="flex flex-col items-center gap-2 relative z-10 w-[16%]">
                    <button
                      onClick={() => isCompleted && setStep(s)}
                      disabled={!isCompleted}
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                        ${isActive
                          ? 'bg-surface-elevated border-accent text-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)] scale-110'
                          : isCompleted
                            ? 'bg-accent border-accent text-white hover:brightness-110 cursor-pointer'
                            : 'bg-surface border-white/[0.1] text-text-muted'}
                      `}
                    >
                      {getStepIcon(s)}
                    </button>
                    <span className={`text-xs font-medium transition-colors duration-300 ${isActive ? 'text-text-primary' : isCompleted ? 'text-text-primary' : 'text-text-muted'}`}>
                      {getStepTitle(s)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-[400px] relative">
          {renderStep()}
        </div>

        {/* Footer Navigation — only shown during wizard steps 1–5, not on review or preview */}
        {!isPreview && step < 6 && (
          <div className="flex-shrink-0 p-5 sm:p-6 border-t border-white/[0.06] bg-surface-elevated mt-auto">
            <div className="flex items-center justify-between">
              {/* Mobile progress dots */}
              <div className="sm:hidden flex gap-1.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-300 ${step === s ? 'w-6 bg-accent' : step > s ? 'w-2 bg-accent/60' : 'w-2 bg-white/[0.08]'}`}
                  />
                ))}
              </div>
              <div className="hidden sm:block text-sm text-text-muted font-medium">
                Step <span className="text-text-primary">{step}</span> of 5
              </div>

              <div className="flex gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                {step > 1 ? (
                  <Button variant="ghost" onClick={handleBack} className="flex-1 sm:flex-none">
                    Back
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={handleClose} className="flex-1 sm:flex-none">
                    Cancel
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="flex-1 sm:flex-none relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center">
                    Continue <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
