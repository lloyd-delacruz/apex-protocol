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
import profilesRouter from './routes/profiles';

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
  const fs = require('fs');
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logLine = `[${timestamp}] 📡 ${req.method} ${req.path} — ${res.statusCode} (${duration}ms)\n`;
      console.log(logLine.trim());
      try {
        fs.appendFileSync('/tmp/backend_requests.log', logLine);
      } catch (e) {}
    });
    
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
app.use('/api/profiles', profilesRouter);

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

process.on('uncaughtException', (err) => {
  const fs = require('fs');
  const log = `[${new Date().toISOString()}] 🚨 UNCAUGHT EXCEPTION: ${err.message}\n${err.stack}\n`;
  console.error(log);
  try { fs.appendFileSync('/tmp/backend_errors.log', log); } catch (e) {}
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const fs = require('fs');
  const log = `[${new Date().toISOString()}] 🚨 UNHANDLED REJECTION: ${reason}\n`;
  console.error(log);
  try { fs.appendFileSync('/tmp/backend_errors.log', log); } catch (e) {}
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error', data: null });
});

// ─── Start server ─────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'test') {
  const PORT = config.port;
  // Listening on '::' allows both IPv4 and IPv6 connections on most systems
  app.listen(PORT, '0.0.0.0', () => {
    console.log('────────────────────────────────────────────────────────────────');
    console.log(`🚀 Apex Protocol API is LIVE`);
    console.log(`📡 Listening on: 0.0.0.0:${PORT}`);
    console.log(`⚙️  Environment: ${config.nodeEnv}`);
    console.log('────────────────────────────────────────────────────────────────');
  });
}

export default app;
