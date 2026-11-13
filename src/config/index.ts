import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

/**
 * Project root. Resolved relative to this file so it works both when running
 * from `src/config` (tsx in development) and `dist/config` (compiled build).
 */
export const ROOT_DIR = path.resolve(__dirname, '..', '..');

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function int(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

const DEV_FALLBACK_SECRET = 'dev-only-insecure-session-secret-change-me';
const PLACEHOLDER_SECRET = 'replace-me-with-a-long-random-string';

function resolveSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  const missing = !secret || secret === PLACEHOLDER_SECRET;
  if (missing || (secret && secret.length < 32)) {
    if (isProduction) {
      // Refuse to start in production with a weak or default secret.
      throw new Error('SESSION_SECRET must be set to a random string of at least 32 characters in production.');
    }
    if (!isTest) {
      console.warn('[config] SESSION_SECRET is missing or weak; using an insecure development fallback.');
    }
    return missing ? DEV_FALLBACK_SECRET : (secret as string);
  }
  return secret as string;
}

const dataDirEnv = process.env.DATA_DIR ?? 'data';

export const config = {
  env: nodeEnv,
  isProduction,
  isTest,
  port: int(process.env.PORT, 3000, 1, 65535),
  siteName: process.env.SITE_NAME ?? 'DemoSite',
  contactEmail: process.env.CONTACT_EMAIL ?? 'privacy@example.com',

  session: {
    secret: resolveSessionSecret(),
    cookieName: 'sid',
    ttlMinutes: int(process.env.SESSION_TTL_MINUTES, 120, 5, 60 * 24 * 30),
  },

  // Secure cookies require HTTPS. Default to on in production, overridable via env.
  cookieSecure: bool(process.env.COOKIE_SECURE, isProduction),
  trustProxy: bool(process.env.TRUST_PROXY, false),

  // Keep bcrypt rounds within a sane range; tests may use the minimum (4) for speed.
  bcryptRounds: int(process.env.BCRYPT_ROUNDS, 12, 4, 15),

  loginRateLimit: {
    max: int(process.env.LOGIN_RATE_LIMIT_MAX, 10, 1, 1000),
    windowMs: int(process.env.LOGIN_RATE_LIMIT_WINDOW_MINUTES, 15, 1, 24 * 60) * 60 * 1000,
  },

  // Registration attempts allowed per IP per hour. Raised for automated tests.
  registerRateLimit: {
    max: int(process.env.REGISTER_RATE_LIMIT_MAX, isTest ? 1000 : 20, 1, 10000),
  },

  cookiePolicyVersion: process.env.COOKIE_POLICY_VERSION ?? '1',

  paths: {
    root: ROOT_DIR,
    views: path.join(ROOT_DIR, 'views'),
    public: path.join(ROOT_DIR, 'public'),
    data: path.isAbsolute(dataDirEnv) ? dataDirEnv : path.join(ROOT_DIR, dataDirEnv),
  },
} as const;

export type AppConfig = typeof config;
