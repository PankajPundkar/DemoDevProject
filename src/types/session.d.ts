import 'express-session';

export interface FlashMessage {
  type: 'success' | 'error' | 'info';
  text: string;
}

declare module 'express-session' {
  interface SessionData {
    /** Present only when authenticated. We store the id, never the user record. */
    userId?: string;
    /** Per-session CSRF synchronizer token. */
    csrfToken?: string;
    /** One-time messages shown on the next rendered page. */
    flash?: FlashMessage[];
    /** Where to send the user after logging in (same-origin relative path only). */
    returnTo?: string;
  }
}
