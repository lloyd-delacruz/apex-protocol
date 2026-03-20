'use client';

import React, { useEffect, useState } from 'react';
import { Share2, MoreHorizontal, CheckCircle2, Activity } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ExerciseSummary {
  name: string;
  mediaUrl?: string | null;
  isFocus?: boolean;
  reps?: number;
  weight?: number;
}

interface WorkoutSummaryProps {
  stats: {
    duration: string;
    exercises: number;
    sets: number;
    volume: number;
  };
  workoutName?: string;
  exerciseList?: ExerciseSummary[];
  onClose: () => void;
  onShare?: () => void;
}

// Simple CSS confetti particles
function Confetti() {
  const particles = Array.from({ length: 24 }, (_, i) => i);
  const colors = ['#00C2FF', '#F59E0B', '#10B981', '#EF4444', '#7B61FF', '#F0F0F5'];
  const shapes = ['square', 'circle', 'rect'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(i => {
        const color = colors[i % colors.length];
        const shape = shapes[i % shapes.length];
        const left = (i * 4.2 + 2) % 100;
        const delay = (i * 0.12) % 1.5;
        const size = 6 + (i % 4) * 3;
        const duration = 2.5 + (i % 4) * 0.5;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: '-10px',
              width: shape === 'rect' ? size * 2 : size,
              height: size,
              backgroundColor: color,
              borderRadius: shape === 'circle' ? '50%' : shape === 'square' ? '2px' : '1px',
              opacity: 0,
              animation: `confettiFall ${duration}s ease-in ${delay}s forwards`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confettiFall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(320px) rotate(720deg); }
        }
      `}</style>
    </div>
  );
}

export default function WorkoutSummary({ stats, workoutName, exerciseList, onClose, onShare }: WorkoutSummaryProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const calories = Math.round(stats.sets * 8 + parseInt(stats.duration) * 4);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="max-w-xl mx-auto pb-32 animate-in fade-in zoom-in-95 duration-500">
      {/* Top bar */}
      <div className="flex items-center justify-between pt-6 pb-4 text-text-muted">
        <span className="text-xs font-medium">{dateStr}, {timeStr}</span>
        <div className="flex items-center gap-3">
          <button onClick={onShare} className="text-text-muted hover:text-text-primary transition-colors">
            <Share2 size={18} />
          </button>
          <button className="text-text-muted hover:text-text-primary transition-colors">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Celebration center */}
      <div className="relative flex flex-col items-center py-8">
        {showConfetti && <Confetti />}

        {/* Body icon badge */}
        <div className="w-20 h-20 rounded-2xl bg-surface-elevated border border-white/[0.08] flex items-center justify-center mb-4 relative z-10">
          <Activity size={40} className="text-text-muted/60" />
        </div>

        {/* Workout name */}
        <h1 className="text-4xl font-black italic text-text-primary text-center mb-1 leading-tight relative z-10">
          {workoutName || 'Workout Complete'}
        </h1>
        <p className="text-sm text-text-muted mb-6 relative z-10">{stats.duration}</p>

        {/* Stats */}
        <div className="flex items-center gap-8 relative z-10">
          <div className="text-center">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">CALORIES</p>
            <p className="text-xl font-black text-text-primary">{calories} <span className="text-sm font-bold text-text-muted">kCal</span></p>
          </div>
          <div className="w-px h-8 bg-white/[0.08]" />
          <div className="text-center">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">VOLUME</p>
            <p className="text-xl font-black text-text-primary">{stats.volume.toLocaleString()} <span className="text-sm font-bold text-text-muted">lb</span></p>
          </div>
        </div>
      </div>

      {/* Exercise list */}
      {exerciseList && exerciseList.length > 0 && (
        <div className="mt-2">
          <h3 className="text-lg font-black text-text-primary mb-4">
            {exerciseList.length} Exercise{exerciseList.length !== 1 ? 's' : ''}
          </h3>
          <div className="space-y-3">
            {exerciseList.map((ex, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-surface-elevated border border-white/[0.06]">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/30 border border-white/[0.06]">
                    {ex.mediaUrl ? (
                      <img src={ex.mediaUrl} alt={ex.name} className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Activity size={20} className="text-text-muted/40" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-success flex items-center justify-center border-2 border-background">
                    <CheckCircle2 size={12} className="text-white" strokeWidth={3} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  {ex.isFocus && (
                    <p className="text-[10px] font-black text-warning uppercase tracking-widest mb-0.5">FOCUS EXERCISE</p>
                  )}
                  <h4 className="text-sm font-bold text-text-primary truncate">{ex.name}</h4>
                  {(ex.reps || ex.weight) && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {ex.reps ? `${ex.reps} reps` : ''}{ex.reps && ex.weight ? ' x ' : ''}{ex.weight ? `${ex.weight} lb` : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/95 to-transparent z-40">
        <div className="max-w-xl mx-auto flex gap-3">
          <Button
            variant="secondary"
            className="flex-1 h-14 rounded-2xl font-bold border-white/[0.15] text-text-primary"
            onClick={onShare}
          >
            Share
          </Button>
          <Button
            variant="primary"
            className="flex-[2] h-14 rounded-2xl font-black"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
