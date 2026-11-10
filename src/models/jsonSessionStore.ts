import path from 'node:path';
import session from 'express-session';
import type { SessionData } from 'express-session';
import { config } from '../config';
import { JsonFile } from '../utils/jsonFile';

interface StoredSession {
  expires: number; // epoch ms
  data: SessionData;
}

interface SessionsFile {
  sessions: Record<string, StoredSession>;
}

const isSessionsFile = (d: unknown): d is SessionsFile =>
  !!d && typeof d === 'object' && typeof (d as SessionsFile).sessions === 'object' && (d as SessionsFile).sessions !== null;

type Cb<T = void> = (err?: unknown, value?: T) => void;

/**
 * express-session store backed by data/sessions.json (no database).
 *
 * Sessions live server-side; the browser only gets a signed, random session id
 * in an HttpOnly cookie. Expired sessions are pruned periodically.
 */
export class JsonSessionStore extends session.Store {
  private readonly file: JsonFile<SessionsFile>;
  private readonly ttlMs: number;
  private pruneTimer?: NodeJS.Timeout;

  constructor(options: { filePath?: string; ttlMs: number; pruneIntervalMs?: number }) {
    super();
    this.file = new JsonFile<SessionsFile>(
      options.filePath ?? path.join(config.paths.data, 'sessions.json'),
      () => ({ sessions: {} }),
      isSessionsFile,
    );
    this.ttlMs = options.ttlMs;
    const interval = options.pruneIntervalMs ?? 10 * 60 * 1000;
    this.pruneTimer = setInterval(() => void this.prune(), interval);
    this.pruneTimer.unref(); // never keep the process alive just for pruning
    void this.prune();
  }

  private expiryOf(sess: SessionData): number {
    const cookieExpires = sess.cookie?.expires ? new Date(sess.cookie.expires).getTime() : NaN;
    return Number.isFinite(cookieExpires) ? cookieExpires : Date.now() + this.ttlMs;
  }

  override get(sid: string, cb: Cb<SessionData | null>): void {
    this.file
      .read()
      .then(({ sessions }) => {
        const entry = sessions[sid];
        if (!entry || entry.expires <= Date.now()) return cb(null, null);
        cb(null, entry.data);
      })
      .catch((err) => cb(err));
  }

  override set(sid: string, sess: SessionData, cb?: Cb): void {
    this.file
      .update((data) => {
        data.sessions[sid] = { expires: this.expiryOf(sess), data: sess };
      })
      .then(() => cb?.())
      .catch((err) => cb?.(err));
  }

  override destroy(sid: string, cb?: Cb): void {
    this.file
      .update((data) => {
        delete data.sessions[sid];
      })
      .then(() => cb?.())
      .catch((err) => cb?.(err));
  }

  /**
   * Called by express-session on requests that did not modify the session.
   * Sessions are not "rolling" in this app, so the expiry is fixed at creation
   * and there's nothing to persist - this avoids a file write on every request.
   */
  override touch(_sid: string, _sess: SessionData, cb?: Cb): void {
    cb?.();
  }

  async prune(): Promise<void> {
    try {
      await this.file.update((data) => {
        const now = Date.now();
        for (const [sid, entry] of Object.entries(data.sessions)) {
          if (!entry || entry.expires <= now) delete data.sessions[sid];
        }
      });
    } catch (err) {
      console.error('[session-store] prune failed:', err);
    }
  }

  close(): void {
    if (this.pruneTimer) clearInterval(this.pruneTimer);
  }
}
