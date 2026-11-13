import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { config } from '../config';
import { str } from '../utils/validation';

/**
 * Login throttling: limits FAILED login attempts per client IP.
 * Successful logins (redirect, status < 400) are not counted.
 * In-memory counters are fine for a single-process demo.
 */
export const loginLimiter = rateLimit({
  windowMs: config.loginRateLimit.windowMs,
  limit: config.loginRateLimit.max,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req: Request, res: Response) => {
    const minutes = Math.ceil(config.loginRateLimit.windowMs / 60000);
    res.status(429);
    void res.renderPage('login', {
      title: 'Log in',
      values: { email: str(req.body?.email) },
      errors: {},
      formError: `Too many login attempts. Please wait up to ${minutes} minutes and try again.`,
    });
  },
});

/** Light protection against automated mass sign-ups. */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: config.registerRateLimit.max,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429);
    void res.renderPage('register', {
      title: 'Create account',
      values: {},
      errors: {},
      formError: 'Too many registration attempts from your network. Please try again later.',
    });
  },
});

/** Generic API limiter (consent logging etc.). */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests.' },
});
