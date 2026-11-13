/**
 * Starts DemoSite for the Playwright tests.
 *
 * - Uses a throw-away data folder (tests/.tmp/e2e-data), wiped on every start, so the real
 *   `data/` folder is never touched.
 * - Raises the login and registration rate limits: every test runs from the same IP, and the
 *   negative login tests would otherwise lock the whole suite out.
 * - Pins the cookie policy version so the tests can plant a valid consent cookie.
 *
 * The environment must be set BEFORE the app is imported, because config is read at import time.
 */
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(__dirname, '..', 'tests', '.tmp', 'e2e-data');
fs.rmSync(dataDir, { recursive: true, force: true });
fs.mkdirSync(dataDir, { recursive: true });

Object.assign(process.env, {
  NODE_ENV: 'development',
  DATA_DIR: dataDir,
  SESSION_SECRET: 'e2e-only-session-secret-that-is-longer-than-32-characters',
  BCRYPT_ROUNDS: '4',
  COOKIE_SECURE: 'false',
  LOGIN_RATE_LIMIT_MAX: '1000',
  REGISTER_RATE_LIMIT_MAX: '1000',
  COOKIE_POLICY_VERSION: '1',
});

// require (not import) so the app loads only after the environment above is set.
require('../src/server');
