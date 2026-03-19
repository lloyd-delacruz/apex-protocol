'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, 
  BookOpen, 
  History as HistoryIcon, 
  RefreshCcw, 
  Star, 
  Trash2, 
  ChevronRight,
  PlayCircle
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import api from '@/lib/api';

interface ExerciseBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: any;
  onReplace: () => void;
  onRemove: () => void;
}

export default function ExerciseBottomSheet({ 
  isOpen, 
  onClose, 
  prescription,
  onReplace,
  onRemove
}: ExerciseBottomSheetProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const exercise = prescription?.exercise;

  useEffect(() => {
    if (isOpen && activeTab === 'history' && exercise?.id) {
      const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
          const data = await api.trainingLog.exerciseHistory(exercise.id);
          setHistory(data.logs || []);
        } catch (err) {
          console.error('Failed to fetch history', err);
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen, activeTab, exercise?.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/60 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="relative w-full max-w-lg bg-surface-elevated rounded-t-[40px] sm:rounded-[40px] border-t border-x border-white/[0.08] shadow-2xl animate-slide-up overflow-hidden max-h-[90vh] flex flex-col">
        {/* Handle (mobile) */}
        <div className="w-12 h-1.5 bg-white/[0.08] rounded-full mx-auto mt-4 mb-2 sm:hidden" />

        {/* Header */}
        <div className="p-6 pb-4">
            <div className="flex items-start justify-between mb-4">
                <div className="space-y-1 pr-8">
                    <span className="text-[10px] font-black text-accent uppercase tracking-widest">{exercise?.muscleGroup} • {exercise?.equipment}</span>
                    <h2 className="text-2xl font-black text-text-primary uppercase leading-tight italic tracking-tight underline decoration-accent/30 decoration-2 underline-offset-4">
                        {exercise?.name}
                    </h2>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/[0.08] transition-all"
                >
                  <X size={20} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-background/50 rounded-2xl p-1 border border-white/[0.04]">
                <button 
                    onClick={() => setActiveTab('info')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-accent text-white shadow-accent-sm' : 'text-text-muted hover:text-text-primary'}`}
                >
                    <BookOpen size={14} /> Details
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-accent text-white shadow-accent-sm' : 'text-text-muted hover:text-text-primary'}`}
                >
                    <HistoryIcon size={14} /> History
                </button>
            </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 no-scrollbar">
            {activeTab === 'info' ? (
                <div className="space-y-6 animate-fade-in">
                    {/* Media Preview */}
                    <div className="relative group rounded-3xl overflow-hidden aspect-video bg-black/40 border border-white/[0.08]">
                        <img 
                            src={`https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=300&fit=crop&q=80`} 
                            alt={exercise?.name}
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-700 hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:scale-110 transition-transform">
                            <PlayCircle size={60} className="text-white/80" />
                        </div>
                        <div className="absolute bottom-4 left-4 flex gap-2">
                             <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[8px] font-black text-white uppercase tracking-widest border border-white/10">4K VIDEO</span>
                             <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[8px] font-black text-white uppercase tracking-widest border border-white/10">PRO FORM</span>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] italic">Instructions</h4>
                        <div className="space-y-2">
                            {exercise?.instructions?.split('\n').map((line: string, i: number) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <span className="text-accent font-black text-xs shrink-0 mt-0.5">{i + 1}.</span>
                                    <p className="text-sm text-text-muted leading-relaxed font-medium">{line}</p>
                                </div>
                            )) || (
                                <p className="text-sm text-text-muted italic">No instructions available for this exercise.</p>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3 pt-4">
                        <ActionItem 
                          icon={<RefreshCcw size={18} />} 
                          label="Replace" 
                          onClick={onReplace} 
                          className="bg-accent/10 border-accent/20 text-accent hover:bg-accent/20"
                        />
                        <ActionItem 
                          icon={<Star size={18} />} 
                          label="Favorite" 
                          onClick={() => {}} 
                          className="bg-yellow-500/10 border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20"
                        />
                        <ActionItem 
                          icon={<HistoryIcon size={18} />} 
                          label="History" 
                          onClick={() => setActiveTab('history')} 
                          className="bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/20"
                        />
                        <ActionItem 
                          icon={<Trash2 size={18} />} 
                          label="Remove" 
                          onClick={onRemove} 
                          className="bg-danger/10 border-danger/20 text-danger hover:bg-danger/20"
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-4 animate-fade-in">
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] italic mb-4">Your Progress</h4>
                    {loadingHistory ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-4">
                            <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest animate-pulse">Retrieving Logs...</span>
                        </div>
                    ) : history.length > 0 ? (
                        history.map((log: any) => (
                            <div key={log.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between hover:border-accent/30 transition-all">
                                <div>
                                    <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{new Date(log.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                    <div className="text-lg font-black text-text-primary font-mono tracking-tighter">
                                        {log.weight} <span className="text-[10px] text-accent uppercase">{log.weightUnit}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Set Profile</div>
                                    <div className="flex gap-1 justify-end">
                                        {[log.set1Reps, log.set2Reps, log.set3Reps, log.set4Reps].filter(Boolean).map((reps, i) => (
                                            <span key={i} className="text-xs font-black bg-accent/20 text-accent px-2 py-0.5 rounded-md min-w-[24px] text-center">{reps}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 px-8 rounded-[40px] bg-white/[0.02] border border-dashed border-white/[0.08]">
                            <HistoryIcon size={40} className="mx-auto text-text-muted/20 mb-4" />
                            <p className="text-sm font-black text-text-muted uppercase tracking-tighter">No History Yet</p>
                            <p className="text-xs text-text-muted mt-2">Log your first session to see your progress here.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

function ActionItem({ 
  icon, 
  label, 
  onClick, 
  className = '' 
}: { 
  icon: React.ReactNode, 
  label: string, 
  onClick: () => void, 
  className?: string 
}) {
    return (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-3xl border transition-all text-[10px] font-black uppercase tracking-widest ${className}`}
        >
            {icon}
            {label}
        </button>
    );
}
