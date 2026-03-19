'use client';

import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Settings2, 
  ChevronRight, 
  Dumbbell, 
  Clock, 
  Zap, 
  History,
  MoreVertical,
  Plus
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import api, { ApiTodayWorkout, ApiWorkoutDay } from '@/lib/api';
import ExerciseBottomSheet from './ExerciseBottomSheet';
import ExerciseLibrary from './ExerciseLibrary';

export default function WorkoutView() {
  const [loading, setLoading] = useState(true);
  const [workoutData, setWorkoutData] = useState<ApiTodayWorkout | null>(null);
  const [activeFilter, setActiveFilter] = useState('All Equipment');
  
  // Interaction State
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryTitle, setLibraryTitle] = useState('Exercise Library');

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const data = await api.workouts.today();
        setWorkoutData(data);
      } catch (err) {
        console.error('Failed to fetch today\'s workout', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkout();
  }, []);

  const openSheet = (ep: any) => {
    setSelectedPrescription(ep);
    setIsSheetOpen(true);
  };

  const handleReplace = () => {
    setIsSheetOpen(false);
    setLibraryTitle('Replace Exercise');
    setIsLibraryOpen(true);
  };

  const handleAddExercise = () => {
    setLibraryTitle('Add Exercise');
    setIsLibraryOpen(true);
  };

  const handleRemove = () => {
    if (!selectedPrescription || !workoutData?.workoutDay) return;
    const updatedPrescriptions = workoutData.workoutDay.exercisePrescriptions.filter(
        ep => ep.id !== selectedPrescription.id
    );
    setWorkoutData({
        ...workoutData,
        workoutDay: {
            ...workoutData.workoutDay,
            exercisePrescriptions: updatedPrescriptions
        }
    });
    setIsSheetOpen(false);
  };

  const handleSelectFromLibrary = (exercise: any) => {
    if (libraryTitle === 'Replace Exercise' && selectedPrescription) {
        // Replace logic (local only for now)
        const updatedPrescriptions = workoutData?.workoutDay?.exercisePrescriptions.map(ep => 
            ep.id === selectedPrescription.id ? { ...ep, exercise, exerciseId: exercise.id } : ep
        );
        if (workoutData?.workoutDay) {
            setWorkoutData({
                ...workoutData,
                workoutDay: { ...workoutData.workoutDay, exercisePrescriptions: updatedPrescriptions || [] }
            });
        }
    } else {
        // Add logic (local only for now)
        const newPrescription: any = {
            id: `temp-${Date.now()}`,
            exerciseId: exercise.id,
            exercise,
            targetRepRange: '3 x 10',
            incrementValue: 'RPE 8',
            workoutDayId: workoutData?.workoutDay?.id || '',
            incrementUnit: 'kg',
            sortOrder: (workoutData?.workoutDay?.exercisePrescriptions.length || 0) + 1
        };
        if (workoutData?.workoutDay) {
            setWorkoutData({
                ...workoutData,
                workoutDay: { 
                    ...workoutData.workoutDay, 
                    exercisePrescriptions: [...workoutData.workoutDay.exercisePrescriptions, newPrescription] 
                }
            });
        }
    }
    setIsLibraryOpen(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        <p className="text-text-muted text-sm font-medium animate-pulse uppercase tracking-widest">Loading Protocol...</p>
      </div>
    );
  }

  const workout = workoutData?.workoutDay;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32 animate-fade-in">
      {/* Header Section */}
      <div className="p-6 pt-12 space-y-6">
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">WEEK {workoutData?.currentWeek?.weekNumber || 1} • DAY {workout?.dayCode || 'A'}</span>
                <h1 className="text-4xl font-black text-text-primary italic uppercase tracking-tight leading-none">
                    {workout?.workoutType || 'Strength'} <span className="text-accent underline decoration-4 underline-offset-8">PHASE</span>
                </h1>
            </div>
            <button className="w-10 h-10 rounded-full bg-surface border border-white/[0.08] flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
                <Settings2 size={20} />
            </button>
        </div>

        <div className="flex items-center gap-6 text-xs text-text-muted font-bold uppercase tracking-widest px-1">
            <div className="flex items-center gap-2">
                <Clock size={14} className="text-accent" />
                <span>~65 MIN</span>
            </div>
            <div className="flex items-center gap-2">
                <Zap size={14} className="text-accent" />
                <span>{workout?.phase || 'Hypertrophy'}</span>
            </div>
            <div className="flex items-center gap-2">
                <Dumbbell size={14} className="text-accent" />
                <span>{activeFilter}</span>
            </div>
        </div>
      </div>

      {/* Equipment Filter Bar */}
      <div className="px-6 mb-8 overflow-x-auto no-scrollbar flex items-center gap-2">
        {['All Equipment', 'Minimal', 'Bodyweight', 'Commercial'].map((filter) => (
            <button 
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeFilter === filter ? 'bg-accent border-accent text-white shadow-accent-sm' : 'bg-surface border-white/[0.08] text-text-muted hover:border-white/20'}`}
            >
                {filter}
            </button>
        ))}
      </div>

      {/* Exercise List */}
      <div className="px-6 space-y-4">
        {workout?.exercisePrescriptions?.map((ep, idx) => (
            <ExerciseCard 
                key={ep.id} 
                ep={ep} 
                index={idx} 
                onClick={() => openSheet(ep)}
            />
        )) || (
            <div className="text-center py-20 bg-surface/50 rounded-3xl border border-dashed border-white/[0.08]">
                <p className="text-text-muted text-sm italic">No workout scheduled for today.</p>
                <Button variant="ghost" className="mt-4">Pick a program</Button>
            </div>
        )}

        <button 
            onClick={handleAddExercise}
            className="w-full py-6 rounded-3xl border border-dashed border-white/[0.08] flex items-center justify-center gap-2 text-text-muted hover:text-accent hover:border-accent/30 transition-all group"
        >
            <Plus size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Add Exercise</span>
        </button>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent z-40">
        <div className="max-w-md mx-auto">
            <Button 
                variant="primary" 
                size="lg" 
                fullWidth 
                className="h-16 font-black text-lg shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all italic tracking-tight"
            >
                START WORKOUT <Play size={24} fill="currentColor" className="ml-3" />
            </Button>
        </div>
      </div>

      {/* Overlays */}
      <ExerciseBottomSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        prescription={selectedPrescription}
        onReplace={handleReplace}
        onRemove={handleRemove}
      />

      <ExerciseLibrary 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelect={handleSelectFromLibrary}
        title={libraryTitle}
      />
    </div>
  );
}

function ExerciseCard({ ep, index, onClick }: { ep: any, index: number, onClick: () => void }) {
    return (
        <Card 
            onClick={onClick}
            className="p-4 border-white/[0.08] bg-surface-elevated hover:bg-surface-elevated/80 transition-all group cursor-pointer relative overflow-hidden"
        >
            {/* Index badge */}
            <div className="absolute top-0 left-0 w-8 h-8 flex items-center justify-center bg-accent/10 rounded-br-2xl text-[10px] font-black text-accent/50 z-10">
                {String(index + 1).padStart(2, '0')}
            </div>

            <div className="flex items-center gap-4 relative z-20">
                {/* Exercise Thumbnail Placeholder */}
                <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/[0.04] flex items-center justify-center shrink-0 overflow-hidden group-hover:border-accent/30 transition-colors">
                    <img 
                      src={`https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=100&h=100&fit=crop&q=80`} 
                      alt={ep.exercise?.name} 
                      className="w-full h-full object-cover opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-text-primary uppercase tracking-tight truncate group-hover:text-accent transition-colors">
                        {ep.exercise?.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.04]">
                            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{ep.targetRepRange || '3 x 10'}</span>
                        </div>
                        <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                            {ep.incrementValue || 'RPE 8'}
                        </span>
                    </div>
                </div>

                <button className="p-2 text-text-muted hover:text-text-primary transition-colors">
                    <MoreVertical size={20} />
                </button>
            </div>
        </Card>
    );
}
