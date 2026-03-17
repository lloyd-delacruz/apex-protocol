'use client';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const difficultyClasses: Record<string, string> = {
  beginner: 'bg-success/10 text-success border-success/20',
  intermediate: 'bg-warning/10 text-warning border-warning/20',
  advanced: 'bg-danger/10 text-danger border-danger/20',
};

const equipmentClasses: Record<string, string> = {
  barbell: 'bg-accent/10 text-accent border-accent/20',
  dumbbell: 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20',
  cable: 'bg-accent/10 text-accent border-accent/20',
  machine: 'bg-white/[0.06] text-text-secondary border-white/[0.10]',
  kettlebell: 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20',
  band: 'bg-warning/10 text-warning border-warning/20',
  bodyweight: 'bg-success/10 text-success border-success/20',
  cardio_machine: 'bg-white/[0.06] text-text-secondary border-white/[0.10]',
  default: 'bg-white/[0.06] text-text-muted border-white/[0.08]',
};

interface MetaBadgeProps {
  label: string;
  className?: string;
}

function MetaBadge({ label, className = 'bg-white/[0.06] text-text-muted border-white/[0.08]' }: MetaBadgeProps) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border tracking-wide ${className}`}>
      {label}
    </span>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

type ExerciseMetaField = 'equipment' | 'bodyPart' | 'primaryMuscle' | 'movementPattern' | 'difficulty';

interface Props {
  exercise: {
    equipment?: string | null;
    bodyPart?: string | null;
    primaryMuscle?: string | null;
    movementPattern?: string | null;
    difficulty?: string | null;
  };
  /** Which fields to show. Defaults to equipment + bodyPart + movementPattern. */
  fields?: ExerciseMetaField[];
  className?: string;
}

export default function ExerciseMetaBadges({
  exercise,
  fields = ['equipment', 'bodyPart', 'movementPattern'],
  className = '',
}: Props) {
  const badges: React.ReactNode[] = [];

  if (fields.includes('equipment') && exercise.equipment) {
    const cls = equipmentClasses[exercise.equipment] ?? equipmentClasses.default;
    badges.push(<MetaBadge key="equipment" label={formatLabel(exercise.equipment)} className={cls} />);
  }

  if (fields.includes('bodyPart') && exercise.bodyPart) {
    badges.push(<MetaBadge key="bodyPart" label={exercise.bodyPart} />);
  }

  if (fields.includes('primaryMuscle') && exercise.primaryMuscle) {
    badges.push(<MetaBadge key="primaryMuscle" label={exercise.primaryMuscle} />);
  }

  if (fields.includes('movementPattern') && exercise.movementPattern) {
    badges.push(<MetaBadge key="movementPattern" label={formatLabel(exercise.movementPattern)} />);
  }

  if (fields.includes('difficulty') && exercise.difficulty) {
    const cls = difficultyClasses[exercise.difficulty] ?? 'bg-white/[0.06] text-text-muted border-white/[0.08]';
    badges.push(<MetaBadge key="difficulty" label={formatLabel(exercise.difficulty)} className={cls} />);
  }

  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {badges}
    </div>
  );
}
