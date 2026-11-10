import type { NextFunction, Request, Response } from 'express';
import { config } from '../config';
import { CONSENT_COOKIE_NAME, CONSENT_MAX_AGE_DAYS, cookieCatalog } from '../config/cookies';
import type { FlashMessage } from '../types/session';

/** Values every template needs (header/footer/cookie banner). */
export function templateLocals(req: Request, res: Response, next: NextFunction): void {
  res.locals.siteName = config.siteName;
  res.locals.contactEmail = config.contactEmail;
  res.locals.currentPath = req.path;
  res.locals.year = new Date().getFullYear();
  res.locals.cookiePolicyVersion = config.cookiePolicyVersion;
  res.locals.cookieSecure = config.cookieSecure;
  res.locals.cookieCatalog = cookieCatalog;
  res.locals.consentCookieName = CONSENT_COOKIE_NAME;
  res.locals.consentMaxAgeDays = CONSENT_MAX_AGE_DAYS;
  next();
}

/** Session-backed one-time messages (survive exactly one redirect). */
export function flash(req: Request, _res: Response, next: NextFunction): void {
  req.flash = (type, text) => {
    const list: FlashMessage[] = req.session.flash ?? [];
    list.push({ type, text });
    req.session.flash = list;
  };
  next();
}

/**
 * Adds res.renderPage(view, locals): renders views/pages/<view>.ejs, then wraps
 * it in views/layouts/main.ejs. Flash messages are consumed here (not when they
 * are queued), so they survive redirects and are shown exactly once.
 */
export function pageRenderer(req: Request, res: Response, next: NextFunction): void {
  res.renderPage = async (view, locals = {}) => {
    const messages = req.session?.flash ?? [];
    if (req.session?.flash) delete req.session.flash;

    const data = { ...res.locals, messages, title: '', ...locals };
    const body = await new Promise<string>((resolve, reject) => {
      req.app.render(`pages/${view}`, data, (err, html) => (err ? reject(err) : resolve(html)));
    });
    res.render('layouts/main', { ...data, body });
  };
  next();
}

/** Dynamic pages may include personal data; don't let browsers/proxies cache them. */
export function noStore(_req: Request, res: Response, next: NextFunction): void {
  res.set('Cache-Control', 'no-store');
  next();
}
