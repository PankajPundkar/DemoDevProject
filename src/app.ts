import express from 'express';
import helmet from 'helmet';
import { config } from './config';
import { sessionMiddleware } from './middleware/session';
import { provideCsrfToken, verifyCsrf } from './middleware/csrf';
import { loadUser } from './middleware/auth';
import { flash, noStore, pageRenderer, templateLocals } from './middleware/locals';
import { errorHandler, notFound } from './middleware/errorHandler';
import { routes } from './routes';

export function createApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);

  app.set('view engine', 'ejs');
  app.set('views', config.paths.views);

  // Security headers. The CSP forbids inline scripts/styles, which is why all JS
  // and CSS live in /public. Third-party analytics would need to be added here.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'"],
          'img-src': ["'self'", 'data:'],
          'connect-src': ["'self'"],
          'form-action': ["'self'"],
          'frame-ancestors': ["'none'"],
          'upgrade-insecure-requests': config.cookieSecure ? [] : null,
        },
      },
      strictTransportSecurity: config.cookieSecure ? { maxAge: 15552000, includeSubDomains: true } : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // Static assets first: they need no session, so no session lookup/cookie for them.
  app.use(express.static(config.paths.public, { maxAge: config.isProduction ? '1d' : 0, index: false }));

  app.use(sessionMiddleware);
  app.use(noStore);
  app.use(flash);
  app.use(templateLocals);
  app.use(pageRenderer);

  // Small body limits: forms here are tiny. `extended: false` = flat key/values only.
  app.use(express.urlencoded({ extended: false, limit: '10kb' }));
  app.use(express.json({ limit: '10kb' }));

  app.use(loadUser);
  app.use(provideCsrfToken);
  app.use(verifyCsrf); // all POST/PUT/PATCH/DELETE routes below are CSRF-protected

  app.use(routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
