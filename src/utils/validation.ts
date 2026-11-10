import type { FieldErrors } from '../types/models';

/**
 * Server-side validation. These rules mirror public/js/validation.js, but the
 * server is the source of truth: client-side checks are only a UX convenience.
 */

// Pragmatic email pattern (not full RFC 5322): something@something.tld, no spaces.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const PASSWORD_MIN = 8;
/** bcrypt only uses the first 72 bytes; reject longer input instead of silently truncating. */
export const PASSWORD_MAX_BYTES = 72;
export const NAME_MIN = 2;
export const NAME_MAX = 100;
export const EMAIL_MAX = 254;

/** Coerce untrusted body values to a string (rejects arrays/objects from qs parsing). */
export function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function validateEmail(email: string): string | undefined {
  if (!email) return 'Email address is required.';
  if (email.length > EMAIL_MAX || !EMAIL_RE.test(email)) return 'Enter a valid email address.';
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Password is required.';
  if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) return 'Password is too long (max 72 bytes).';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }
  return undefined;
}

export interface RegistrationInput {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function validateRegistration(input: RegistrationInput): FieldErrors {
  const errors: FieldErrors = {};
  const name = input.fullName.trim();

  if (!name) errors.fullName = 'Full name is required.';
  else if (name.length < NAME_MIN || name.length > NAME_MAX) {
    errors.fullName = `Full name must be between ${NAME_MIN} and ${NAME_MAX} characters.`;
  } else if (/[<>]/.test(name)) {
    errors.fullName = 'Full name contains invalid characters.';
  }

  const emailError = validateEmail(input.email.trim());
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(input.password);
  if (passwordError) errors.password = passwordError;

  if (!input.confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (input.password !== input.confirmPassword) errors.confirmPassword = 'Passwords do not match.';

  return errors;
}

export function validateLogin(input: { email: string; password: string }): FieldErrors {
  const errors: FieldErrors = {};
  const email = input.email.trim();
  if (!email) errors.email = 'Email address is required.';
  else if (email.length > EMAIL_MAX || !EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
  // On login only check presence: policy checks here would leak policy details
  // and lock out users if the policy ever changes.
  if (!input.password) errors.password = 'Password is required.';
  else if (input.password.length > 1024) errors.password = 'Password is too long.';
  return errors;
}

/** Only allow same-origin relative redirects (prevents open-redirect attacks). */
export function safeReturnTo(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return undefined;
  return value;
}
