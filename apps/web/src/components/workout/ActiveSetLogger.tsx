'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Clock, 
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  Dumbbell
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ApiExercise } from '@/lib/api';

interface SetData {
  id: string;
  type: 'warmup' | 'working';
  targetReps: number;
  actualReps: number | null;
  targetWeight: number;
  actualWeight: number | null;
  completed: boolean;
  restTime: number; // seconds
}

interface ActiveSetLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: ApiExercise & { prescriptionId?: string };
  onLogSet: (setData: SetData) => void;
  onLogAll: (sets: SetData[]) => void;
  initialSets?: SetData[];
  weightUnit?: 'kg' | 'lb';
}

export default function ActiveSetLogger({
  isOpen,
  onClose,
  exercise,
  onLogSet,
  onLogAll,
  initialSets = [],
  weightUnit = 'kg'
}: ActiveSetLoggerProps) {
  const [activeTab, setActiveTab] = useState<'working' | 'warmup'>('working');
  const [sets, setSets] = useState<SetData[]>(initialSets.length > 0 ? initialSets : [
    { id: '1', type: 'working', targetReps: 10, actualReps: null, targetWeight: 60, actualWeight: null, completed: false, restTime: 90 }
  ]);
  const [restTimerEnabled, setRestTimerEnabled] = useState(true);
  const [showRestTimerConfig, setShowRestTimerConfig] = useState(false);

  useEffect(() => {
    if (initialSets.length > 0) {
      setSets(initialSets);
    }
  }, [initialSets]);

  const filteredSets = sets.filter(s => s.type === activeTab);

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    const newSet: SetData = {
      id: Math.random().toString(36).substr(2, 9),
      type: activeTab,
      targetReps: lastSet?.targetReps ?? 10,
      actualReps: null,
      targetWeight: lastSet?.targetWeight ?? 60,
      actualWeight: null,
      completed: false,
      restTime: lastSet?.restTime ?? 90
    };
    setSets([...sets, newSet]);
  };

  const removeSet = (id: string) => {
    setSets(sets.filter(s => s.id !== id));
  };

  const updateSet = (id: string, updates: Partial<SetData>) => {
    setSets(sets.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const toggleComplete = (set: SetData) => {
    const isCompleting = !set.completed;
    const updatedSet = { 
      ...set,
      completed: isCompleting,
      actualReps: isCompleting ? (set.actualReps ?? set.targetReps) : set.actualReps,
      actualWeight: isCompleting ? (set.actualWeight ?? set.targetWeight) : set.actualWeight,
    };
    setSets(sets.map(s => s.id === set.id ? updatedSet : s));
    if (isCompleting) {
      onLogSet(updatedSet);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-surface border-t sm:border border-white/[0.08] rounded-t-[32px] sm:rounded-[32px] flex flex-col max-h-[90vh] shadow-2xl animate-in slide-in-from-bottom duration-300"
      >
        {/* Handle for mobile drag */}
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        {/* Header */}
        <div className="p-8 pb-4 flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-text-primary tracking-tight">{exercise.name}</h3>
            <p className="text-xs font-semibold text-text-muted mt-1 uppercase tracking-widest">
              {exercise.primaryMuscle || exercise.muscleGroup} · {activeTab === 'working' ? 'Working' : 'Warm-up'} Sets
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs & Rest Timer Toggle */}
        <div className="px-6 mb-4 flex items-center justify-between">
          <div className="flex bg-surface-elevated p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('working')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'working' 
                  ? 'bg-background text-text-primary shadow-sm' 
                  : 'text-text-muted'
              }`}
            >
              Working
            </button>
            <button
              onClick={() => setActiveTab('warmup')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'warmup' 
                  ? 'bg-background text-text-primary shadow-sm' 
                  : 'text-text-muted'
              }`}
            >
              Warm-up
            </button>
          </div>

          <button 
             onClick={() => setShowRestTimerConfig(!showRestTimerConfig)}
             className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${restTimerEnabled ? 'bg-success/10 border-success/20 text-success' : 'bg-surface-elevated border-white/[0.04] text-text-muted'}`}
          >
            <Clock size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">{restTimerEnabled ? 'Timer On' : 'Timer Off'}</span>
          </button>
        </div>

        {/* Rest Timer Config Panel */}
        {showRestTimerConfig && (
          <div className="px-6 mb-4 animate-in slide-in-from-top-2">
            <div className="p-4 rounded-2xl bg-surface-elevated border border-white/[0.04]">
               <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-text-primary">Rest Timer</span>
                  <input 
                    type="checkbox" 
                    checked={restTimerEnabled} 
                    onChange={e => setRestTimerEnabled(e.target.checked)}
                    className="w-5 h-5 accent-accent"
                  />
               </div>
               <p className="text-xs text-text-muted mb-4 font-medium">Auto-start rest timer after each completed set.</p>
               <div className="flex items-center justify-center gap-4 text-2xl font-black text-text-primary tabular-nums py-2">
                  <button className="text-text-muted">1:30</button>
                  <span className="text-accent underline underline-offset-8">2:00</span>
                  <button className="text-text-muted">2:30</button>
               </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="px-6 mb-6">
           <div className="p-3 rounded-2xl bg-accent/5 border border-accent/10 flex items-start gap-3">
              <Info size={16} className="text-accent mt-0.5 shrink-0" />
              <p className="text-[11px] leading-relaxed text-accent/80 font-medium">
                Today should feel challenging but controlled. Focus on form and move with intent. Adjust weights if necessary.
              </p>
           </div>
        </div>

        {/* Sets List */}
        <div className="flex-1 overflow-y-auto px-6 space-y-4 no-scrollbar pb-6">
          <div className="grid grid-cols-[32px_1fr_1fr_40px] gap-4 mb-2">
             <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">#</div>
             <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest text-center underline decoration-accent/30 underline-offset-4">Reps</div>
             <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest text-center underline decoration-accent/30 underline-offset-4">Weight ({weightUnit})</div>
             <div></div>
          </div>

          {filteredSets.map((set, idx) => (
            <div key={set.id} className="grid grid-cols-[32px_1fr_1fr_40px] gap-4 items-center animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
              <button 
                onClick={() => toggleComplete(set)}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${set.completed ? 'bg-success border-success text-white shadow-success-sm' : 'border-white/10 text-text-muted'}`}
              >
                {set.completed ? <CheckCircle2 size={16} strokeWidth={3} /> : <span className="text-xs font-bold tabular-nums">{idx + 1}</span>}
              </button>
              
              <Input 
                type="number" 
                placeholder={String(set.targetReps)}
                value={set.actualReps === null ? '' : set.actualReps}
                onChange={e => updateSet(set.id, { actualReps: parseInt(e.target.value) || null })}
                className={`text-center h-12 rounded-xl text-lg font-bold tabular-nums ${set.completed ? 'opacity-50' : ''}`}
                disabled={set.completed}
              />

              <Input 
                type="number" 
                placeholder={String(set.targetWeight)}
                value={set.actualWeight === null ? '' : set.actualWeight}
                onChange={e => updateSet(set.id, { actualWeight: parseFloat(e.target.value) || null })}
                className={`text-center h-12 rounded-xl text-lg font-bold tabular-nums ${set.completed ? 'opacity-50' : ''}`}
                disabled={set.completed}
              />

              <button 
                onClick={() => removeSet(set.id)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                title="Remove Set"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          <button 
            onClick={addSet}
            className="w-full h-12 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 text-text-muted hover:border-accent/40 hover:text-accent transition-all group"
          >
            <Plus size={18} className="group-hover:scale-125 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-wider">Add Set</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/[0.06] bg-background/50 backdrop-blur-xl sticky bottom-0 flex gap-3">
          <Button 
            variant="secondary" 
            fullWidth 
            className="h-14 rounded-2xl"
            onClick={() => onLogAll(sets)}
          >
            Log All Sets
          </Button>
          <Button 
            variant="primary" 
            fullWidth 
            className="h-14 rounded-2xl"
            onClick={() => {
              const activeSet = filteredSets.find(s => !s.completed);
              if (activeSet) toggleComplete(activeSet);
              else onClose();
            }}
          >
            Log Set
          </Button>
        </div>
      </div>
    </div>
  );
}
