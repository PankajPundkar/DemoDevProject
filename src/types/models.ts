/** A user record as persisted in data/users.json. Never send this to the client. */
export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** The safe, client-facing subset of a user. */
export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface UsersFile {
  users: UserRecord[];
}

export interface ConsentPreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

/**
 * Proof-of-consent record (GDPR Art. 7(1): the controller must be able to demonstrate
 * consent). Contains no IP address or personal data - only a random identifier
 * generated in the visitor's browser.
 */
export interface ConsentRecord {
  consentId: string;
  preferences: ConsentPreferences;
  policyVersion: string;
  action: 'accept_all' | 'reject_all' | 'custom';
  recordedAt: string;
}

export interface ConsentFile {
  consents: ConsentRecord[];
}

export type FieldErrors = Record<string, string>;
