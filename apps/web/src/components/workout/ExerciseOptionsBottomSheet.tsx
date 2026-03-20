'use client';

import React, { useState } from 'react';
import { X, Play, Calendar, RefreshCw, ArrowUp, ArrowDown, Ban, Trash2, ChevronRight } from 'lucide-react';

interface ExerciseOptionsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  onReplace: () => void;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onTogglePreference: (pref: 'more' | 'less' | 'exclude') => void;
}

export default function ExerciseOptionsBottomSheet({
  isOpen,
  onClose,
  exerciseName,
  onReplace,
  onRemove,
  onTogglePreference
}: ExerciseOptionsBottomSheetProps) {
  const [recommendMore, setRecommendMore] = useState(false);
  const [recommendLess, setRecommendLess] = useState(false);

  if (!isOpen) return null;

  const menuRows = [
    {
      icon: <Play size={20} />,
      label: 'Video & Instructions',
      action: () => {},
      showChevron: true,
    },
    {
      icon: <Calendar size={20} />,
      label: 'Exercise History',
      action: () => {},
      showChevron: true,
    },
    {
      icon: <RefreshCw size={20} />,
      label: 'Replace',
      action: onReplace,
      showChevron: true,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[140] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#111118] border-t border-white/[0.08] rounded-t-[28px] flex flex-col pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-white/[0.06]">
          <h3 className="text-base font-bold text-text-primary truncate flex-1 mr-4">{exerciseName}</h3>
          <button onClick={onClose} className="text-accent hover:opacity-80 transition-opacity">
            <X size={22} />
          </button>
        </div>

        {/* Menu rows */}
        {menuRows.map((row, i) => (
          <button
            key={i}
            onClick={row.action}
            className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors text-left"
          >
            <span className="text-text-primary">{row.icon}</span>
            <span className="flex-1 text-sm font-medium text-text-primary">{row.label}</span>
            {row.showChevron && <ChevronRight size={16} className="text-text-muted" />}
          </button>
        ))}

        {/* Recommend more often */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04]">
          <span className="text-text-primary"><ArrowUp size={20} /></span>
          <span className="flex-1 text-sm font-medium text-text-primary">Recommend more often</span>
          <button
            onClick={() => { setRecommendMore(v => !v); if (!recommendMore) onTogglePreference('more'); }}
            className={`w-11 h-6 rounded-full transition-colors relative ${recommendMore ? 'bg-accent' : 'bg-white/10'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${recommendMore ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Recommend less often */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04]">
          <span className="text-text-primary"><ArrowDown size={20} /></span>
          <span className="flex-1 text-sm font-medium text-text-primary">Recommend less often</span>
          <button
            onClick={() => { setRecommendLess(v => !v); if (!recommendLess) onTogglePreference('less'); }}
            className={`w-11 h-6 rounded-full transition-colors relative ${recommendLess ? 'bg-accent' : 'bg-white/10'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${recommendLess ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Don't recommend again */}
        <button
          onClick={() => { onTogglePreference('exclude'); onClose(); }}
          className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors text-left"
        >
          <span className="text-text-muted"><Ban size={20} /></span>
          <span className="flex-1 text-sm font-medium text-text-primary">Don&apos;t recommend again</span>
        </button>

        {/* Delete */}
        <button
          onClick={() => { onRemove(); onClose(); }}
          className="flex items-center gap-4 px-6 py-4 hover:bg-danger/5 transition-colors text-left"
        >
          <span className="text-danger"><Trash2 size={20} /></span>
          <span className="flex-1 text-sm font-bold text-danger">Delete from workout</span>
        </button>
      </div>
    </div>
  );
}
