export type OnboardingGoal =
  | 'strength'
  | 'muscle'
  | 'body_composition'
  | 'weight_loss'
  | 'general_fitness'
  | 'performance';

export type TrainingConsistency =
  | 'brand_new'
  | 'returning'
  | 'inconsistent'
  | 'consistent'
  | 'very_consistent';

export type ExperienceLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced';

export type WorkoutEnvironment =
  | 'commercial_gym'
  | 'small_gym'
  | 'home_gym'
  | 'minimal_home'
  | 'bodyweight_only'
  | 'custom';

export type LiftEntry = {
  exerciseKey: string;
  exerciseName: string;
  reps?: number;
  weight?: number;
  unit?: 'kg' | 'lb';
};

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type NotificationPreference = {
  enabled: boolean;
  time?: string;
};

export type OnboardingProfile = {
  goal?: OnboardingGoal;
  consistency?: TrainingConsistency;
  experience?: ExperienceLevel;
  environment?: WorkoutEnvironment;
  equipment: string[];
  bestLifts: LiftEntry[];
  workoutsPerWeek?: number;
  specificDays?: string[];
  notifications?: NotificationPreference;
  skippedSteps: string[];
  bodyStats?: {
    gender?: string;
    dob?: string;
    height?: number;
    weight?: number;
    unit: 'kg' | 'lb';
  };
  generatedProgram?: any; // We'll type this as 'any' for now or use ApiProgramFull if imported
};

export const INITIAL_ONBOARDING_DATA: OnboardingProfile = {
  equipment: [],
  bestLifts: [],
  skippedSteps: [],
};
