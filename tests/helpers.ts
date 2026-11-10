import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Must be called BEFORE importing anything from src/, because config is read
 * at import time. Points the app at a throwaway data directory.
 */
export function setupTestEnv(overrides: Record<string, string> = {}): string {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-site-test-'));
  Object.assign(process.env, {
    NODE_ENV: 'test',
    DATA_DIR: dataDir,
    SESSION_SECRET: 'test-secret-that-is-definitely-longer-than-32-chars',
    BCRYPT_ROUNDS: '4', // fast hashing for tests only
    COOKIE_SECURE: 'false',
    ...overrides,
  });
  return dataDir;
}

export function cleanup(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

/** Extract the CSRF token from a rendered HTML page. */
export function csrfFrom(html: string): string {
  const match = html.match(/name="_csrf" value="([^"]+)"/) ?? html.match(/name="csrf-token" content="([^"]+)"/);
  if (!match) throw new Error('No CSRF token found in page');
  return match[1];
}
