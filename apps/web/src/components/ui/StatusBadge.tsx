import { TrainingStatus } from '@apex/shared';

interface StatusBadgeProps {
  status: TrainingStatus;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

const config: Record<TrainingStatus, { label: string; classes: string; dotColor: string }> = {
  ACHIEVED: {
    label: 'Achieved',
    classes: 'bg-success/10 text-success border-success/20',
    dotColor: 'bg-success',
  },
  PROGRESS: {
    label: 'Progress',
    classes: 'bg-accent/10 text-accent border-accent/20',
    dotColor: 'bg-accent',
  },
  FAILED: {
    label: 'Failed',
    classes: 'bg-danger/10 text-danger border-danger/20',
    dotColor: 'bg-danger',
  },
};

export default function StatusBadge({
  status,
  size = 'sm',
  showDot = true,
}: StatusBadgeProps) {
  const { label, classes, dotColor } = config[status];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 border rounded-full font-semibold
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
        ${classes}
      `}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
      )}
      {label}
    </span>
  );
}
