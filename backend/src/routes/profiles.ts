import { Router, Response } from 'express';
import { ProfileService } from '../services/ProfileService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ─── Onboarding ─────────────────────────────────────────────────────────────

/** 
 * GET /api/profiles/onboarding 
 * Fetches the user's persistent onboarding state and equipment setup.
 */
router.get('/onboarding', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = await ProfileService.getOnboardingProfile(req.userId!);
    res.json({ success: true, data: profile, error: null });
  } catch (err: any) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

/** 
 * POST /api/profiles/onboarding 
 * Persists user choices from the onboarding flow.
 * Payload includes goal, experience, environment, and equipment array.
 */
router.post('/onboarding', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = await ProfileService.upsertOnboardingProfile(req.userId!, req.body);
    res.json({ success: true, data: profile, error: null });
  } catch (err: any) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

// ─── User Profile ────────────────────────────────────────────────────────────

/** 
 * POST /api/profiles/user 
 * Updates health-specific profile data (gender, DOB, units).
 */
router.post('/user', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = await ProfileService.upsertUserProfile(req.userId!, req.body);
    res.json({ success: true, data: profile, error: null });
  } catch (err: any) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

// ─── Notifications ───────────────────────────────────────────────────────────

/** GET /api/profiles/notifications */
router.get('/notifications', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prefs = await ProfileService.getNotificationPreferences(req.userId!);
    res.json({ success: true, data: prefs, error: null });
  } catch (err: any) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

/** POST /api/profiles/notifications */
router.post('/notifications', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prefs = await ProfileService.upsertNotificationPreferences(req.userId!, req.body);
    res.json({ success: true, data: prefs, error: null });
  } catch (err: any) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

export default router;
