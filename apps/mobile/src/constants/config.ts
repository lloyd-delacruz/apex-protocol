/**
 * App Configuration
 *
 * Central location for all app-level constants.
 * Environment-specific values should come from .env via EXPO_PUBLIC_* prefix.
 */

export const CONFIG = {
  // Set to true to auto-login during development (skips session restore so
  // onboarding always runs). Set back to false before any production build.
  DEV_MODE: true,

  // Backend port used for auto-detection from Expo host
  API_PORT: 4001,

  // Default pagination page size
  PAGINATION_LIMIT: 20,

  // How many recent sessions to show on the dashboard
  RECENT_SESSIONS_LIMIT: 3,

  // Minimum password length
  MIN_PASSWORD_LENGTH: 8,
} as const;
