import rateLimit from 'express-rate-limit';
import config from '../config';

/** General API rate limiter: 100 requests per 15 minutes */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests — please try again later', data: null },
});

/** Stricter limiter for auth endpoints: 20 requests per 15 minutes */
export const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many auth attempts — please try again later', data: null },
});
