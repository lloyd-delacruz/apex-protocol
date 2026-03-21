import 'dotenv/config';
// Centralised config — all env vars resolved once at startup

const config = {
  port: parseInt(process.env.PORT ?? '4001', 10),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:4000',
  nodeEnv: process.env.NODE_ENV ?? 'development',

  jwt: {
    secret: process.env.JWT_SECRET ?? 'apex-protocol-dev-secret-change-in-production',
    expiresIn: '7d' as const,
  },

  rateLimit: {
    // General API: 100 req / 15 min per IP
    windowMs: 15 * 60 * 1000,
    max: 100,
    // Auth endpoints: 20 req / 15 min per IP
    authMax: 20,
  },
} as const;

export default config;
