import { WorkoutEnvironment } from './types';

export const EQUIPMENT_PRESETS: Record<Exclude<WorkoutEnvironment, 'custom'>, string[]> = {
  commercial_gym: [
    'Barbell', 'Dumbbell', 'Kettlebell', 'Cable', 'Machine', 'Smith Machine', 
    'Leg Press', 'Squat Rack', 'Bench Press', 'Pull Up Bar', 'Dip Station', 
    'Medicine Ball', 'Resistance Band', 'Cardio Machine'
  ],
  small_gym: [
    'Barbell', 'Dumbbell', 'Kettlebell', 'Cable', 'Machine', 'Squat Rack', 
    'Bench Press', 'Pull Up Bar', 'Resistance Band'
  ],
  home_gym: [
    'Barbell', 'Dumbbell', 'Squat Rack', 'Bench Press', 'Plates', 'Pull Up Bar'
  ],
  minimal_home: [
    'Dumbbell', 'Resistance Band', 'Yoga Mat', 'Bodyweight'
  ],
  bodyweight_only: [
    'Bodyweight'
  ]
};

export const ALL_EQUIPMENT_OPTIONS = [
  { category: 'Free Weights', items: ['Barbell', 'Dumbbell', 'Kettlebell', 'Plates'] },
  { category: 'Stations', items: ['Squat Rack', 'Bench Press', 'Full Rack', 'Wall Ball'] },
  { category: 'Cables & Machines', items: ['Cable', 'Machine', 'Smith Machine', 'Leg Press', 'Lat Pulldown', 'Cable Row'] },
  { category: 'Bodyweight', items: ['Pull Up Bar', 'Dip Station', 'Push Up Handles', 'Ab Wheel', 'TRX / Suspension'] },
  { category: 'Accessories', items: ['Resistance Band', 'Medicine Ball', 'Yoga Mat', 'Foam Roller', 'Jump Rope'] }
];
