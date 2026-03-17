import express from 'express';
import cors from 'cors';
import config from './config';
import { apiLimiter, authLimiter } from './middleware/rateLimiter';
import authRouter from './routes/auth';
import programsRouter from './routes/programs';
import workoutsRouter from './routes/workouts';
import trainingLogRouter from './routes/trainingLog';
import metricsRouter from './routes/metrics';
import analyticsRouter from './routes/analytics';
import progressionRouter from './routes/progression';
import exercisesRouter from './routes/exercises';
import adminRouter from './routes/admin';

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: config.nodeEnv === 'development' ? true : config.clientOrigin,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiter to all API routes
app.use('/api', apiLimiter);

// ─── Request logging (dev) ────────────────────────────────────────────────────

if (config.nodeEnv !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Auth — stricter rate limit
app.use('/api/auth', authLimiter, authRouter);

// Programs, workouts, training log, metrics, analytics
app.use('/api/programs', programsRouter);
app.use('/api/workouts', workoutsRouter);
app.use('/api/training-log', trainingLogRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/progression', progressionRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/admin', adminRouter);

// Legacy route aliases (backward compat with existing frontend)
app.use('/auth', authLimiter, authRouter);
app.use('/programs', programsRouter);
app.use('/metrics', metricsRouter);

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: config.nodeEnv });
});

// ─── 404 handler ──────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found', data: null });
});

// ─── Global error handler ─────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error', data: null });
});

// ─── Start server ─────────────────────────────────────────────────────────────

app.listen(config.port, () => {
  console.log(`Apex Protocol API running on http://localhost:${config.port}`);
});

export default app;
