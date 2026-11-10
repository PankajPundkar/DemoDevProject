import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/httpError';

/**
 * CSRF protection using the synchronizer-token pattern:
 *  - a random token is stored in the server-side session,
 *  - every HTML form includes it as a hidden `_csrf` field, and fetch() calls send
 *    it in the `X-CSRF-Token` header (read from a <meta> tag),
 *  - every state-changing request must present a matching token.
 * The SameSite=Lax session cookie is a second layer of defence.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function newCsrfToken(req: Request): string {
  const token = crypto.randomBytes(32).toString('base64url');
  req.session.csrfToken = token;
  return token;
}

/** Make sure a token exists and expose it to templates as `csrfToken`. */
export function provideCsrfToken(req: Request, res: Response, next: NextFunction): void {
  res.locals.csrfToken = req.session.csrfToken ?? newCsrfToken(req);
  next();
}

function tokensMatch(expected: string, actual: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function verifyCsrf(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) return next();

  const expected = req.session?.csrfToken;
  const bodyToken = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>)._csrf : undefined;
  const supplied = typeof bodyToken === 'string' ? bodyToken : req.get('x-csrf-token');

  if (!expected || typeof supplied !== 'string' || !tokensMatch(expected, supplied)) {
    return next(new HttpError(403, 'Your session has expired or the form is invalid. Please reload the page and try again.', 'EBADCSRFTOKEN'));
  }
  next();
}
