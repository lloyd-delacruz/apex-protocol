/**
 * Storage Keys
 *
 * Single source of truth for all AsyncStorage keys.
 * Never hardcode key strings outside this file.
 */

export const STORAGE_KEYS = {
  // Auth
  AUTH_TOKEN:    'apex_token',
  REFRESH_TOKEN: 'apex_refresh_token',

  // Onboarding
  ONBOARDING_STATE: 'apex_onboarding_state_v2',

  // Workout session (persisted in-progress session)
  WORKOUT_SESSION: 'apex_active_workout_session',

  // User preferences
  UNIT_PREFERENCE: 'apex_unit_preference',  // 'kg' | 'lb'

  // Local targets (until backend sync is added)
  TARGETS: 'apex_strength_targets',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
