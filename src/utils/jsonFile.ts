import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * Small, robust JSON-file persistence helper used instead of a database.
 *
 * Guarantees:
 *  - The file (and its directory) is created with `defaultValue` if missing.
 *  - Writes are atomic: data is written to a temp file in the same directory and
 *    then renamed over the target, so a crash never leaves a half-written file.
 *  - All operations on one file go through a per-file promise queue (a mutex),
 *    so concurrent read-modify-write cycles inside this process never interleave
 *    and cannot lose updates or create duplicates.
 *
 * Limitation (acceptable for a demo): the lock is in-process only. Running several
 * Node processes against the same files would need an OS-level lock or a database.
 */

/** One shared queue per absolute path, even if multiple JsonFile instances exist. */
const queues = new Map<string, Promise<unknown>>();

function enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = queues.get(key) ?? Promise.resolve();
  // Run after the previous task regardless of whether it failed.
  const run = previous.then(task, task);
  // Keep the chain alive but never let a rejection propagate into the next task.
  const tail = run.catch(() => undefined);
  queues.set(key, tail);
  void tail.then(() => {
    if (queues.get(key) === tail) queues.delete(key);
  });
  return run;
}

const RETRYABLE = new Set(['EPERM', 'EBUSY', 'EACCES']);

/** On Windows, rename can briefly fail if another process (e.g. antivirus) has the file open. */
async function renameWithRetry(from: string, to: string, attempts = 5): Promise<void> {
  for (let i = 0; ; i++) {
    try {
      await fs.rename(from, to);
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code ?? '';
      if (i >= attempts - 1 || !RETRYABLE.has(code)) throw err;
      await new Promise((r) => setTimeout(r, 20 * (i + 1)));
    }
  }
}

export class JsonFileError extends Error {
  constructor(message: string, public readonly filePath: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'JsonFileError';
  }
}

export class JsonFile<T> {
  private readonly filePath: string;
  private initialized = false;

  constructor(
    filePath: string,
    private readonly defaultValue: () => T,
    /** Optional shape check run after parsing; return false to reject the file. */
    private readonly isValid: (data: unknown) => data is T = (d): d is T => d !== null && typeof d === 'object',
  ) {
    this.filePath = path.resolve(filePath);
  }

  get path(): string {
    return this.filePath;
  }

  /** Read the current contents (serialized with writes to avoid reading mid-update). */
  read(): Promise<T> {
    return enqueue(this.filePath, () => this.readUnlocked());
  }

  /** Replace the whole file content. */
  write(data: T): Promise<void> {
    return enqueue(this.filePath, () => this.writeUnlocked(data));
  }

  /**
   * Atomically read, modify and write the file. The updater may mutate `data`
   * in place and/or return a result. Throwing inside the updater aborts the
   * write and leaves the file untouched.
   */
  update<R>(updater: (data: T) => R | Promise<R>): Promise<R> {
    return enqueue(this.filePath, async () => {
      const data = await this.readUnlocked();
      const result = await updater(data);
      await this.writeUnlocked(data);
      return result;
    });
  }

  private async ensureFile(): Promise<void> {
    if (this.initialized) return;
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch {
      await this.writeUnlocked(this.defaultValue());
    }
    this.initialized = true;
  }

  private async readUnlocked(): Promise<T> {
    await this.ensureFile();
    let raw: string;
    try {
      raw = await fs.readFile(this.filePath, 'utf8');
    } catch (err) {
      throw new JsonFileError(`Unable to read data file`, this.filePath, { cause: err });
    }

    // Treat an empty file as "not yet initialised".
    if (raw.trim() === '') return this.defaultValue();

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      // Deliberately do NOT overwrite a corrupt file: that could silently destroy data.
      throw new JsonFileError(`Data file contains invalid JSON`, this.filePath, { cause: err });
    }
    if (!this.isValid(parsed)) {
      throw new JsonFileError(`Data file has an unexpected structure`, this.filePath);
    }
    return parsed;
  }

  private async writeUnlocked(data: T): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`;
    const json = JSON.stringify(data, null, 2) + '\n';
    try {
      // 0o600: owner read/write only (ignored on Windows).
      await fs.writeFile(tmp, json, { encoding: 'utf8', mode: 0o600 });
      await renameWithRetry(tmp, this.filePath);
    } catch (err) {
      await fs.rm(tmp, { force: true }).catch(() => undefined);
      throw new JsonFileError(`Unable to write data file`, this.filePath, { cause: err });
    }
  }
}
