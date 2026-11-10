import type { NextFunction, Request, Response } from 'express';
import { authService } from '../services/authService';
import { safeReturnTo } from '../utils/validation';

/**
 * Resolve the session's userId to a user on every request. If the account no
 * longer exists or was deactivated, the stale login is dropped.
 */
export async function loadUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  res.locals.currentUser = null;
  const userId = req.session?.userId;
  if (!userId) return next();

  const user = await authService.getActiveUser(userId);
  if (user) {
    req.user = user;
    res.locals.currentUser = user; // public fields only - safe for templates
  } else {
    delete req.session.userId;
  }
  next();
}

/** Protect HTML pages: redirect anonymous visitors to the login page. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.user) return next();
  const returnTo = safeReturnTo(req.originalUrl);
  if (returnTo) req.session.returnTo = returnTo;
  req.flash('info', 'Please log in to view that page.');
  res.redirect('/login');
}

/** Protect JSON APIs: respond 401 instead of redirecting. */
export function requireAuthApi(req: Request, res: Response, next: NextFunction): void {
  if (req.user) return next();
  res.status(401).json({ error: 'Authentication required.' });
}

/** Logged-in users have no reason to see /login or /register: send them to the dashboard. */
export function redirectIfAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) return next();
  req.flash('info', 'You are already logged in.');
  res.redirect('/dashboard');
}
