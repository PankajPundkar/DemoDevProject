import path from 'node:path';
import crypto from 'node:crypto';
import { config } from '../config';
import { JsonFile } from '../utils/jsonFile';
import type { UserRecord, UsersFile } from '../types/models';

const isUsersFile = (d: unknown): d is UsersFile =>
  !!d && typeof d === 'object' && Array.isArray((d as UsersFile).users);

const file = new JsonFile<UsersFile>(path.join(config.paths.data, 'users.json'), () => ({ users: [] }), isUsersFile);

export class DuplicateEmailError extends Error {
  constructor() {
    super('A user with this email already exists');
    this.name = 'DuplicateEmailError';
  }
}

/** Emails are compared case-insensitively; we persist the normalised form. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const userRepository = {
  async findByEmail(email: string): Promise<UserRecord | undefined> {
    const target = normalizeEmail(email);
    const { users } = await file.read();
    return users.find((u) => u.email === target);
  },

  async findById(id: string): Promise<UserRecord | undefined> {
    const { users } = await file.read();
    return users.find((u) => u.id === id);
  },

  /**
   * Insert a user. The duplicate check runs inside the same locked update as the
   * insert, so two simultaneous registrations with one email cannot both succeed.
   */
  async create(input: { fullName: string; email: string; passwordHash: string }): Promise<UserRecord> {
    return file.update((data) => {
      const email = normalizeEmail(input.email);
      if (data.users.some((u) => u.email === email)) throw new DuplicateEmailError();

      const now = new Date().toISOString();
      const user: UserRecord = {
        id: crypto.randomUUID(),
        fullName: input.fullName,
        email,
        passwordHash: input.passwordHash,
        isActive: true, // No email verification: accounts are active immediately.
        createdAt: now,
        updatedAt: now,
      };
      data.users.push(user);
      return user;
    });
  },
};
