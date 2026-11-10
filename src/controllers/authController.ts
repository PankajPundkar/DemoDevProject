import type { Request, Response } from 'express';
import { config } from '../config';
import { authService } from '../services/authService';
import { newCsrfToken } from '../middleware/csrf';
import { sessionCookieOptions } from '../middleware/session';
import { safeReturnTo, str, validateLogin, validateRegistration } from '../utils/validation';

const GENERIC_LOGIN_ERROR = 'Invalid email or password.';

/** Promise wrappers around express-session's callback API. */
const regenerate = (req: Request) => new Promise<void>((ok, fail) => req.session.regenerate((e) => (e ? fail(e) : ok())));
const save = (req: Request) => new Promise<void>((ok, fail) => req.session.save((e) => (e ? fail(e) : ok())));
const destroy = (req: Request) => new Promise<void>((ok, fail) => req.session.destroy((e) => (e ? fail(e) : ok())));

export const authController = {
  showLogin(_req: Request, res: Response) {
    return res.renderPage('login', { title: 'Log in', values: {}, errors: {} });
  },

  async login(req: Request, res: Response) {
    const email = str(req.body.email).trim();
    const password = str(req.body.password);
    const values = { email }; // never echo the password back

    const errors = validateLogin({ email, password });
    if (Object.keys(errors).length) {
      res.status(400);
      return res.renderPage('login', { title: 'Log in', values, errors, formError: 'Please correct the highlighted fields.' });
    }

    const user = await authService.authenticate(email, password);
    if (!user) {
      // Generic message: do not reveal whether the email exists or the password was wrong.
      res.status(401);
      return res.renderPage('login', { title: 'Log in', values, errors: {}, formError: GENERIC_LOGIN_ERROR });
    }

    const returnTo = safeReturnTo(req.session.returnTo) ?? '/dashboard';

    // New session id on login prevents session-fixation attacks.
    await regenerate(req);
    req.session.userId = user.id;
    newCsrfToken(req); // rotate CSRF token together with the session
    req.flash('success', `Welcome back, ${user.fullName}!`);
    await save(req);
    res.redirect(returnTo);
  },

  showRegister(_req: Request, res: Response) {
    return res.renderPage('register', { title: 'Create account', values: {}, errors: {} });
  },

  async register(req: Request, res: Response) {
    const input = {
      fullName: str(req.body.fullName),
      email: str(req.body.email),
      password: str(req.body.password),
      confirmPassword: str(req.body.confirmPassword),
    };
    const values = { fullName: input.fullName.trim(), email: input.email.trim() };

    const errors = validateRegistration(input);
    if (Object.keys(errors).length) {
      res.status(400);
      return res.renderPage('register', { title: 'Create account', values, errors, formError: 'Please correct the highlighted fields.' });
    }

    const result = await authService.register(input);
    if (!result.ok) {
      // Telling the user the email is taken is necessary for usable registration.
      // Enumeration risk is mitigated by the registration rate limiter.
      res.status(409);
      return res.renderPage('register', {
        title: 'Create account',
        values,
        errors: { email: 'An account with this email already exists. Try logging in instead.' },
        formError: 'We could not create your account.',
      });
    }

    // Account is active immediately (no email verification). Send user to log in.
    req.flash('success', 'Your account has been created and is active. Please log in.');
    res.redirect('/login');
  },

  async logout(req: Request, res: Response) {
    // Destroy the server-side session AND remove the cookie from the browser.
    await destroy(req);
    res.clearCookie(config.session.cookieName, sessionCookieOptions);
    // The session (and its flash storage) is gone, so signal success via the URL.
    res.redirect('/?loggedOut=1');
  },
};
