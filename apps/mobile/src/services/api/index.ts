/**
 * API Service — Mobile Entry Point
 *
 * Re-exports the shared API singleton and helper functions.
 * Also extends the client with the `progression` namespace which is
 * not yet in the shared package but has live backend endpoints.
 *
 * Usage:
 *   import { api, login, logout } from '../services/api';
 *   const res = await api.workouts.today();
 *   const progressions = await api.progression.pending();
 */

import api, { login, register, logout, loadToken } from '../../lib/api';
import type {
  PendingProgression,
  ProgressionConfirmRequest,
  SuggestedWeightsRequest,
  SuggestedWeightsResponse,
} from '../../types/api';
import type { ApiResponse } from '@apex/shared';

// ─── Progression namespace (not in shared client yet) ─────────────────────────

export const progression = {
  /**
   * Fetch all pending progression prompts for the current user.
   * These are exercises the user has ACHIEVED in the last 14 days
   * and have not yet confirmed a weight increase.
   * GET /api/progression/pending
   */
  pending: (): Promise<ApiResponse<{ progressions: PendingProgression[] }>> =>
    api.request('GET', '/api/progression/pending'),

  /**
   * Confirm the recommended weight increase for a progression.
   * POST /api/progression/confirm
   */
  confirm: (data: ProgressionConfirmRequest): Promise<ApiResponse<null>> =>
    api.request('POST', '/api/progression/confirm', data),

  /**
   * Dismiss a progression prompt without changing the weight.
   * POST /api/progression/dismiss
   */
  dismiss: (progressionId: string): Promise<ApiResponse<null>> =>
    api.request('POST', '/api/progression/dismiss', { progressionId }),

  /**
   * Batch-fetch suggested starting weights for a list of exercises.
   * Used when starting a new session to pre-populate weight inputs.
   * POST /api/progression/suggested-weights
   */
  suggestedWeights: (
    data: SuggestedWeightsRequest
  ): Promise<ApiResponse<SuggestedWeightsResponse>> =>
    api.request('POST', '/api/progression/suggested-weights', data),
};

// ─── Re-exports ───────────────────────────────────────────────────────────────

export { api, login, register, logout, loadToken };
export default api;
