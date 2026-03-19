'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Minus, 
  Plus, 
  SkipForward, 
  Bell, 
  BellOff,
  Maximize2
} from 'lucide-react';
import Button from '@/components/ui/Button';

interface RestTimerProps {
  duration: number; // seconds
  onFinished: () => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function RestTimer({
  duration,
  onFinished,
  onClose,
  isOpen
}: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  // Reset timer when opened or duration changes
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(duration);
      setIsPaused(false);
    }
  }, [isOpen, duration]);

  // Countdown — only depends on isOpen and isPaused, never on timeLeft
  useEffect(() => {
    if (!isOpen || isPaused) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onFinishedRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / duration) * 100;
  const strokeDasharray = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = strokeDasharray * (1 - timeLeft / duration);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[130] p-4 bg-gradient-to-t from-background via-background/95 to-transparent animate-in slide-in-from-bottom duration-500">
      <div className="max-w-md mx-auto bg-surface border border-white/[0.08] rounded-[40px] shadow-2xl p-6 overflow-hidden relative">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/20 blur-[100px] rounded-full -z-10" />

        <div className="flex items-center justify-between mb-8">
           <button 
            onClick={() => setIsMuted(!isMuted)}
            className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
           >
             {isMuted ? <BellOff size={18} /> : <Bell size={18} />}
           </button>
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-accent">Resting</h3>
           <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
           >
             <X size={18} />
           </button>
        </div>

        <div className="flex flex-col items-center justify-center gap-8 py-4">
           {/* Progress Circle */}
           <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-white/[0.04]"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="url(#timerGradient)"
                  strokeWidth="8"
                  strokeDasharray="552.92"
                  strokeDashoffset={552.92 * (1 - timeLeft / duration)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear shadow-accent-sm"
                />
                <defs>
                   <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--accent)" />
                      <stop offset="100%" stopColor="#FB7185" />
                   </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-5xl font-black text-text-primary tabular-nums tracking-tighter">
                    {formatTime(timeLeft)}
                 </span>
                 <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">
                    Remaining
                 </span>
              </div>
           </div>

           {/* Controls */}
           <div className="flex items-center gap-6">
              <button 
                onClick={() => setTimeLeft(Math.max(0, timeLeft - 15))}
                className="w-12 h-12 rounded-2xl bg-surface-elevated flex items-center justify-center text-text-primary hover:bg-white/10 active:scale-95 transition-all text-sm font-bold"
              >
                -15
              </button>
              
              <button 
                onClick={() => setIsPaused(!isPaused)}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 ${isPaused ? 'bg-accent text-white shadow-accent-sm' : 'bg-surface-elevated text-text-primary'}`}
              >
                {isPaused ? (
                  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <div className="flex gap-1.5">
                     <div className="w-2 h-8 bg-current rounded-full" />
                     <div className="w-2 h-8 bg-current rounded-full" />
                  </div>
                )}
              </button>

              <button 
                onClick={() => setTimeLeft(timeLeft + 15)}
                className="w-12 h-12 rounded-2xl bg-surface-elevated flex items-center justify-center text-text-primary hover:bg-white/10 active:scale-95 transition-all text-sm font-bold"
              >
                +15
              </button>
           </div>
        </div>

        <div className="mt-8 flex gap-3">
           <Button 
            variant="ghost" 
            fullWidth 
            className="h-14 rounded-2xl border border-white/[0.04] bg-white/[0.02]"
            onClick={onClose}
           >
             Cancel
           </Button>
           <Button 
            variant="secondary" 
            fullWidth 
            className="h-14 rounded-2xl gap-2 font-black uppercase tracking-tight"
            onClick={onFinished}
           >
             Skip <SkipForward size={18} />
           </Button>
        </div>
      </div>
    </div>
  );
}
