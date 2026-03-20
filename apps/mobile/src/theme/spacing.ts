/**
 * Spacing Tokens
 *
 * Use only these values for margin/padding/gap to ensure a consistent
 * 4pt grid throughout the app.
 *
 * xs=4  sm=8  md=16  lg=24  xl=32  xxl=48
 */

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export type SpacingKey = keyof typeof spacing;
