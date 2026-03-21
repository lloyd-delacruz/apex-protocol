import { Router, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/analytics/dashboard — full analytics dashboard data
router.get('/dashboard', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const analytics = await AnalyticsService.getDashboardAnalytics(req.userId!);
    res.json({ success: true, data: analytics, error: null });
  } catch (err: any) {
    console.error('[Analytics] Error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      data: null
    });
  }
});

export default router;
