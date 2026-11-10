import { config } from '../config';
import { consentRepository } from '../models/consentRepository';
import type { ConsentRecord, FieldErrors } from '../types/models';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = ['accept_all', 'reject_all', 'custom'] as const;

export type ConsentValidation = { ok: true; record: ConsentRecord } | { ok: false; errors: FieldErrors };

export const consentService = {
  /** Validate the untrusted JSON body sent by public/js/cookie-consent.js. */
  parse(body: unknown): ConsentValidation {
    const errors: FieldErrors = {};
    const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;

    if (typeof b.consentId !== 'string' || !UUID_RE.test(b.consentId)) errors.consentId = 'Invalid consent id.';
    if (typeof b.analytics !== 'boolean') errors.analytics = 'Must be true or false.';
    if (typeof b.marketing !== 'boolean') errors.marketing = 'Must be true or false.';
    if (typeof b.action !== 'string' || !(ACTIONS as readonly string[]).includes(b.action)) {
      errors.action = 'Invalid action.';
    }
    if (Object.keys(errors).length) return { ok: false, errors };

    return {
      ok: true,
      record: {
        consentId: (b.consentId as string).toLowerCase(),
        preferences: { necessary: true, analytics: b.analytics as boolean, marketing: b.marketing as boolean },
        // Server decides the policy version, the client cannot claim a different one.
        policyVersion: config.cookiePolicyVersion,
        action: b.action as ConsentRecord['action'],
        recordedAt: new Date().toISOString(),
      },
    };
  },

  async record(record: ConsentRecord): Promise<void> {
    await consentRepository.append(record);
  },
};
