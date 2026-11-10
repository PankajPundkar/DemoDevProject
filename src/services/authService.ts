import bcrypt from 'bcryptjs';
import { config } from '../config';
import { userRepository, normalizeEmail, DuplicateEmailError } from '../models/userRepository';
import type { PublicUser, UserRecord } from '../types/models';

/**
 * A pre-computed hash of a random value. When a login uses an unknown email we
 * still run a bcrypt comparison against this, so response timing does not reveal
 * whether the account exists (user-enumeration protection).
 */
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password-' + Math.random(), config.bcryptRounds);

/** Strip internal/sensitive fields (passwordHash, isActive, updatedAt). */
export function toPublicUser(user: UserRecord): PublicUser {
  return { id: user.id, fullName: user.fullName, email: user.email, createdAt: user.createdAt };
}

export type RegisterResult = { ok: true; user: PublicUser } | { ok: false; reason: 'duplicate_email' };

export const authService = {
  async register(input: { fullName: string; email: string; password: string }): Promise<RegisterResult> {
    const email = normalizeEmail(input.email);

    // Fast path: avoid paying the bcrypt cost for an obvious duplicate.
    if (await userRepository.findByEmail(email)) return { ok: false, reason: 'duplicate_email' };

    const passwordHash = await bcrypt.hash(input.password, config.bcryptRounds);
    try {
      // The repository re-checks for duplicates under the file lock (race-safe).
      const user = await userRepository.create({ fullName: input.fullName.trim(), email, passwordHash });
      return { ok: true, user: toPublicUser(user) };
    } catch (err) {
      if (err instanceof DuplicateEmailError) return { ok: false, reason: 'duplicate_email' };
      throw err;
    }
  },

  /** Returns the user on success, or null for ANY failure (never says which part was wrong). */
  async authenticate(email: string, password: string): Promise<PublicUser | null> {
    const user = await userRepository.findByEmail(email);
    const hash = user?.passwordHash ?? DUMMY_HASH;
    const matches = await bcrypt.compare(password, hash);
    if (!user || !matches || !user.isActive) return null;
    return toPublicUser(user);
  },

  async getActiveUser(id: string): Promise<PublicUser | null> {
    const user = await userRepository.findById(id);
    return user && user.isActive ? toPublicUser(user) : null;
  },
};
