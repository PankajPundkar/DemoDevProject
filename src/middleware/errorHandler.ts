import type { NextFunction, Request, Response } from 'express';
import { config } from '../config';
import { HttpError } from '../utils/httpError';

function wantsJson(req: Request): boolean {
  return req.path.startsWith('/api/') || req.accepts(['html', 'json']) === 'json';
}

export function notFound(req: Request, res: Response): void {
  res.status(404);
  if (wantsJson(req)) {
    res.json({ error: 'Not found.' });
    return;
  }
  void res.renderPage('error', { title: 'Page not found', status: 404, message: "We couldn't find the page you were looking for." });
}

/**
 * Central error handler. Internal details (stack traces, file paths) are logged
 * server-side only; users see a generic message.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let status = 500;
  let message = 'Something went wrong on our side. Please try again later.';

  if (err instanceof HttpError) {
    status = err.status;
    message = err.publicMessage;
  } else if (err && typeof err === 'object' && 'status' in err && typeof err.status === 'number' && err.status < 500) {
    // e.g. body-parser errors (malformed JSON / payload too large)
    status = err.status;
    message = status === 413 ? 'The request was too large.' : 'The request could not be processed.';
  }

  if (status >= 500) console.error('[error]', req.method, req.originalUrl, err);
  else if (!config.isTest) console.warn('[warn]', status, req.method, req.originalUrl, message);

  if (res.headersSent) return;
  res.status(status);

  if (wantsJson(req)) {
    res.json({ error: message });
    return;
  }
  if (typeof res.renderPage !== 'function' || !req.session) {
    // Failure happened before the view helpers were set up (e.g. session store error).
    res.type('text').send(message);
    return;
  }
  // Rendering must never throw out of the error handler.
  res.renderPage('error', { title: status === 403 ? 'Request blocked' : 'Error', status, message }).catch((renderErr) => {
    console.error('[error] failed to render error page', renderErr);
    if (!res.headersSent) res.type('text').send(message);
  });
}
