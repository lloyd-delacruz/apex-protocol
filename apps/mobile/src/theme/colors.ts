/**
 * Apex Protocol brand color palette.
 * Matches the web tailwind theme exactly.
 */
export const colors = {
  background: '#0A0A0F',
  surface: '#12121A',
  surfaceElevated: '#1A1A26',
  accent: '#00C2FF',
  accentSecondary: '#7B61FF',
  brandPrimary: '#00C2FF', // Premium Sapphire/Electric Blue
  brandSecondary: '#0066FF',
  textPrimary: '#F0F0F5',
  textMuted: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: 'rgba(255, 255, 255, 0.06)',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
} as const;

export type ColorKey = keyof typeof colors;

export const statusColors: Record<'ACHIEVED' | 'PROGRESS' | 'FAILED', string> = {
  ACHIEVED: colors.success,
  PROGRESS: colors.accent,
  FAILED: colors.danger,
};

export const statusBackgrounds: Record<'ACHIEVED' | 'PROGRESS' | 'FAILED', string> = {
  ACHIEVED: 'rgba(16, 185, 129, 0.1)',
  PROGRESS: 'rgba(0, 194, 255, 0.1)',
  FAILED: 'rgba(239, 68, 68, 0.1)',
};
