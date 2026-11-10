import session from 'express-session';
import { config } from '../config';
import { JsonSessionStore } from '../models/jsonSessionStore';

const ttlMs = config.session.ttlMinutes * 60 * 1000;

export const sessionStore = new JsonSessionStore({ ttlMs });

/** Cookie options shared by the session middleware and logout (clearCookie must match). */
export const sessionCookieOptions = {
  httpOnly: true, // not readable from JavaScript -> mitigates session theft via XSS
  secure: config.cookieSecure, // only sent over HTTPS when enabled
  sameSite: 'lax' as const, // blocks cross-site POSTs carrying the cookie; allows normal link navigation
  path: '/',
};

/**
 * Server-side sessions. The session cookie is "strictly necessary" (login + CSRF
 * protection), so it does not require consent under the ePrivacy Directive.
 */
export const sessionMiddleware = session({
  name: config.session.cookieName, // generic name; avoids advertising "connect.sid"/Express
  secret: config.session.secret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false, // no cookie until the session actually holds something
  rolling: false,
  unset: 'destroy',
  cookie: { ...sessionCookieOptions, maxAge: ttlMs },
});
