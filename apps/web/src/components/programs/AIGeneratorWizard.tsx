'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Target, User, Calendar, Dumbbell, ArrowRight, X, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { GoalType } from './GoalSelectionModal';

interface AIGeneratorWizardProps {
  initialGoal?: GoalType;
  onClose: () => void;
  onSuccess: (programId: string) => void;
}

export default function AIGeneratorWizard({ initialGoal, onClose, onSuccess }: AIGeneratorWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(initialGoal ? 2 : 1);
  
  const [goal, setGoal] = useState<GoalType | null>(initialGoal ?? null);
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced' | null>(null);
  const [days, setDays] = useState<number>(4);
  const [equipment, setEquipment] = useState<string[]>(['Barbell', 'Dumbbell', 'Bodyweight']);
  
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!goal || !experience) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await api.programs.generate({
        goals: goal ? [goal] : [],
        experienceLevel: experience,
        daysPerWeek: days,
        equipment
      });
      // The API should return the generated program
      if (res?.program?.id) {
        onSuccess(res.program.id);
      } else {
        throw new Error('No program returned from generator.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate program.');
    } finally {
      setGenerating(false);
    }
  };

  const equipOptions = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Kettlebell', 'Bodyweight'];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-surface-elevated border border-accent/20 rounded-modal w-full max-w-2xl shadow-accent-elevated animate-slide-up max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-accent/20 text-accent">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-text-primary">AI Program Generator</h2>
              <p className="text-text-muted text-sm mt-0.5">Custom built for your exact needs</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors p-2 rounded-full hover:bg-white/[0.04]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 mb-4 rounded-card bg-danger/10 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center gap-2"><Target className="w-5 h-5 text-accent" /> What is your primary goal?</h3>
              <div className="grid grid-cols-2 gap-3">
                {['strength', 'hypertrophy', 'fat_loss', 'endurance', 'athletic', 'general', 'mobility'].map(g => (
                  <button 
                    key={g} 
                    onClick={() => setGoal(g as GoalType)}
                    className={`p-4 rounded-card border text-left transition-colors ${goal === g ? 'bg-accent/10 border-accent text-accent' : 'bg-surface border-white/[0.08] text-text-primary hover:border-white/20'}`}
                  >
                    <span className="capitalize font-medium">{g.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center gap-2"><User className="w-5 h-5 text-accent" /> What is your experience level?</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'beginner', label: 'Beginner', desc: '0-1 years of consistent lifting.' },
                  { id: 'intermediate', label: 'Intermediate', desc: '1-3 years of consistent lifting. Good form baseline.' },
                  { id: 'advanced', label: 'Advanced', desc: '3+ years of consistent, structured training.' }
                ].map(lvl => (
                  <button 
                    key={lvl.id} 
                    onClick={() => setExperience(lvl.id as any)}
                    className={`p-4 flex flex-col rounded-card border text-left transition-colors ${experience === lvl.id ? 'bg-accent/10 border-accent' : 'bg-surface border-white/[0.08] hover:border-white/20'}`}
                  >
                    <span className={`font-semibold ${experience === lvl.id ? 'text-accent' : 'text-text-primary'}`}>{lvl.label}</span>
                    <span className="text-sm text-text-muted mt-1">{lvl.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center gap-2"><Calendar className="w-5 h-5 text-accent" /> Training days per week?</h3>
              <p className="text-text-muted text-sm mb-4">How many days can you realistically commit to training?</p>
              
              <div className="flex items-center justify-between gap-4 px-4 py-8 bg-surface rounded-card border border-white/[0.08]">
                {[2, 3, 4, 5, 6].map(d => (
                  <button 
                    key={d}
                    onClick={() => setDays(d)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold transition-all ${days === d ? 'bg-accent text-white shadow-accent-sm scale-110' : 'bg-white/[0.06] text-text-muted hover:bg-white/10 hover:text-text-primary'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-center text-accent font-medium mt-2">{days} Days / Week</p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center gap-2"><Dumbbell className="w-5 h-5 text-accent" /> What equipment do you have?</h3>
              <div className="flex flex-wrap gap-3">
                {equipOptions.map(eq => {
                  const isSelected = equipment.includes(eq);
                  return (
                    <button 
                      key={eq}
                      onClick={() => {
                        if (isSelected) setEquipment(equipment.filter(e => e !== eq));
                        else setEquipment([...equipment, eq]);
                      }}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors flex items-center gap-2 ${isSelected ? 'bg-accent/20 border-accent/50 text-accent' : 'bg-white/[0.04] border-white/[0.1] text-text-muted hover:bg-white/[0.08]'}`}
                    >
                      {isSelected && <CheckCircle2 className="w-4 h-4" />}
                      {eq}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in">
              {generating ? (
                <>
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-accent/20 animate-spin border-t-accent" />
                    <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-accent animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">Analyzing Profile...</h3>
                  <p className="text-text-muted">Building your optimal training regimen using our adaptive AI model.</p>
                </>
              ) : error ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-danger/20 text-danger flex items-center justify-center mb-4">
                    <X className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">Generation Failed</h3>
                  <p className="text-text-muted mb-6">{error}</p>
                  <Button variant="primary" onClick={() => setStep(4)}>Go Back</Button>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 5 && (
          <div className="p-6 border-t border-white/[0.06] flex items-center justify-between bg-surface-elevated">
            <div className="flex gap-2">
              {[1,2,3,4].map(s => (
                <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${step >= s ? 'bg-accent' : 'bg-white/[0.06]'}`} />
              ))}
            </div>
            <div className="flex gap-3">
              {step > 1 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
              <Button 
                variant="primary" 
                onClick={() => {
                  if (step === 4) {
                    setStep(5);
                    handleGenerate();
                  } else {
                    setStep(step + 1);
                  }
                }}
                disabled={
                  (step === 1 && !goal) ||
                  (step === 2 && !experience) ||
                  (step === 4 && equipment.length === 0)
                }
              >
                {step === 4 ? (
                  <>Generate Program <Sparkles className="w-4 h-4 ml-1.5" /></>
                ) : (
                  <>Continue <ArrowRight className="w-4 h-4 ml-1.5" /></>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
