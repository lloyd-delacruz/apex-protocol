'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Search, 
  ChevronRight, 
  X, 
  Check,
  ArrowLeft,
  Dumbbell,
  Activity,
  Layers
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import api, { ApiExercise } from '@/lib/api';

interface ExerciseLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercises: ApiExercise[]) => void;
  title?: string;
  initialSelection?: string[]; // IDs
  mode?: 'add' | 'replace';
}

type TabType = 'All' | 'By Muscle' | 'Categories';

const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Abs', 
  'Lower Back', 'Glutes', 'Quads', 'Hamstrings', 'Calves', 
  'Forearms', 'Traps', 'Neck'
];

const CATEGORIES = [
  { id: 'all', name: 'All Exercises', icon: Activity },
  { id: 'weighted', name: 'Weighted Exercises', icon: Dumbbell },
  { id: 'bodyweight', name: 'Bodyweight Only', icon: Activity },
  { id: 'equipment', name: 'By Equipment', icon: Layers },
  { id: 'cardio', name: 'Cardio', icon: Activity },
  { id: 'mobility', name: 'Stretching and Mobility', icon: Activity },
];

export default function ExerciseLibrary({ 
  isOpen, 
  onClose, 
  onSelect,
  title = 'Exercises',
  initialSelection = [],
  mode = 'add'
}: ExerciseLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [exercises, setExercises] = useState<ApiExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelection);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch exercises based on filters
  useEffect(() => {
    if (isOpen) {
      const fetchExercises = async () => {
        setLoading(true);
        try {
          const params: any = {
            limit: 100
          };
          if (searchTerm) params.search = searchTerm;
          
          if (activeTab === 'All' || searchTerm) {
            // No extra muscle/category filters unless active
          } else if (activeTab === 'By Muscle' && selectedMuscle) {
            params.muscleGroup = selectedMuscle;
          } else if (activeTab === 'Categories' && selectedCategory) {
             if (selectedCategory === 'weighted') params.isCompound = true; // Temporary mapping
             if (selectedCategory === 'bodyweight') params.equipment = 'Bodyweight';
             if (selectedCategory === 'cardio') params.exerciseType = 'Cardio';
          }
          
          const data = await api.exercises.list(params);
          setExercises(data.exercises || []);
        } catch (err) {
          console.error('Failed to fetch exercises', err);
        } finally {
          setLoading(false);
        }
      };
      
      const debounce = setTimeout(fetchExercises, activeTab === 'All' ? 300 : 0);
      return () => clearTimeout(debounce);
    }
  }, [isOpen, searchTerm, activeTab, selectedMuscle, selectedCategory]);

  const toggleExercise = (ex: ApiExercise) => {
    if (mode === 'replace') {
      onSelect([ex]);
      return;
    }

    setSelectedIds(prev => 
      prev.includes(ex.id) 
        ? prev.filter(id => id !== ex.id)
        : [...prev, ex.id]
    );
  };

  const handleAddSelected = () => {
    const selectedExercises = exercises.filter(ex => selectedIds.includes(ex.id));
    onSelect(selectedExercises);
  };

  const currentExercises = useMemo(() => {
    if (activeTab === 'All' || searchTerm) return exercises;
    if (activeTab === 'By Muscle' && !selectedMuscle) return [];
    if (activeTab === 'Categories' && !selectedCategory) return [];
    return exercises;
  }, [exercises, activeTab, searchTerm, selectedMuscle, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06] bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (selectedMuscle || selectedCategory) {
                  setSelectedMuscle(null);
                  setSelectedCategory(null);
                } else {
                  onClose();
                }
              }}
              className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-text-primary hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold text-text-primary">
              {selectedMuscle || selectedCategory || title}
            </h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={24} />
          </button>
        </div>

        <div className="relative mb-4">
          <Input 
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 bg-surface-elevated border-none rounded-2xl h-12"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
        </div>

        {/* Tabs */}
        {!searchTerm && (
          <div className="flex bg-surface-elevated p-1 rounded-xl">
            {(['All', 'By Muscle', 'Categories'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                   setActiveTab(tab);
                   setSelectedMuscle(null);
                   setSelectedCategory(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === tab 
                    ? 'bg-background text-text-primary shadow-sm' 
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
            <span className="text-xs font-medium text-text-muted">Searching...</span>
          </div>
        )}

        {!loading && activeTab === 'By Muscle' && !selectedMuscle && !searchTerm && (
          <div className="grid grid-cols-1 gap-px bg-white/[0.04]">
            {MUSCLE_GROUPS.map(muscle => (
              <button 
                key={muscle}
                onClick={() => setSelectedMuscle(muscle)}
                className="flex items-center justify-between p-5 bg-background hover:bg-surface-elevated transition-colors"
              >
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      <Activity size={20} />
                   </div>
                   <span className="font-semibold text-text-primary">{muscle}</span>
                </div>
                <ChevronRight size={20} className="text-text-muted" />
              </button>
            ))}
          </div>
        )}

        {!loading && activeTab === 'Categories' && !selectedCategory && !searchTerm && (
          <div className="grid grid-cols-1 gap-px bg-white/[0.04]">
            {CATEGORIES.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className="flex items-center justify-between p-5 bg-background hover:bg-surface-elevated transition-colors"
              >
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-text-muted">
                      <cat.icon size={20} />
                   </div>
                   <span className="font-semibold text-text-primary">{cat.name}</span>
                </div>
                <ChevronRight size={20} className="text-text-muted" />
              </button>
            ))}
          </div>
        )}

        {!loading && currentExercises.length > 0 && (
          <div className="space-y-px bg-white/[0.04]">
            {currentExercises.map((ex) => {
              const isSelected = selectedIds.includes(ex.id);
              return (
                <div 
                  key={ex.id}
                  onClick={() => toggleExercise(ex)}
                  className={`flex items-center gap-4 p-4 bg-background hover:bg-surface-elevated cursor-pointer transition-colors ${isSelected ? 'bg-accent/5' : ''}`}
                >
                  <div className="relative w-14 h-14 rounded-xl bg-surface-elevated overflow-hidden border border-white/[0.04]">
                    {ex.mediaUrl ? (
                      <img src={ex.mediaUrl} alt={ex.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted bg-gradient-to-br from-surface to-surface-elevated">
                        <Dumbbell size={24} />
                      </div>
                    )}
                    {isSelected && mode === 'add' && (
                      <div className="absolute inset-0 bg-accent/60 flex items-center justify-center text-white">
                        <Check size={24} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-accent uppercase tracking-wider mb-0.5">{ex.primaryMuscle || ex.muscleGroup}</p>
                    <h3 className="text-base font-bold text-text-primary truncate">{ex.name}</h3>
                    <p className="text-xs text-text-muted mt-0.5">{ex.equipment}</p>
                  </div>
                  {mode === 'add' && (
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-accent border-accent text-white' : 'border-white/10'}`}>
                       {isSelected && <Check size={14} strokeWidth={4} />}
                    </div>
                  )}
                  {mode === 'replace' && <ChevronRight size={20} className="text-text-muted" />}
                </div>
              );
            })}
          </div>
        )}

        {!loading && currentExercises.length === 0 && (activeTab === 'All' || selectedMuscle || selectedCategory || searchTerm) && (
          <div className="py-20 px-8 text-center">
            <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mx-auto mb-4 text-text-muted opacity-20">
              <Search size={32} />
            </div>
            <p className="font-bold text-text-primary">No exercises found</p>
            <p className="text-sm text-text-muted mt-1">Try a different search or filter.</p>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      {mode === 'add' && selectedIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-white/[0.06] flex gap-3 animate-in fade-in slide-in-from-bottom-5">
           <Button 
            variant="secondary" 
            className="flex-1 rounded-2xl h-14"
            onClick={() => setSelectedIds([])}
           >
             Clear ({selectedIds.length})
           </Button>
           <Button 
            variant="primary" 
            className="flex-[2] rounded-2xl h-14"
            onClick={handleAddSelected}
           >
             Add {selectedIds.length} Exercise{selectedIds.length > 1 ? 's' : ''}
           </Button>
        </div>
      )}
    </div>
  );
}
