import type { PublicUser } from './models';
import type { FlashMessage } from './session';

declare global {
  namespace Express {
    interface Request {
      /** The authenticated user (safe public fields only), set by loadUser middleware. */
      user?: PublicUser;
      /** Queue a one-time message for the next rendered page. */
      flash(type: FlashMessage['type'], text: string): void;
    }
    interface Response {
      /** Render views/pages/<view>.ejs inside views/layouts/main.ejs. */
      renderPage(view: string, locals?: Record<string, unknown>): Promise<void>;
    }
  }
}

export {};
