import type { Request, Response } from 'express';
import { consentService } from '../services/consentService';

export const apiController = {
  /** Protected API example: returns only safe public fields of the current user. */
  me(req: Request, res: Response) {
    res.json({ user: req.user });
  },

  /** Records proof of a cookie-consent decision (anonymous, no IP stored). */
  async recordConsent(req: Request, res: Response) {
    const parsed = consentService.parse(req.body);
    if (!parsed.ok) {
      res.status(400).json({ error: 'Invalid consent payload.', fields: parsed.errors });
      return;
    }
    await consentService.record(parsed.record);
    res.status(204).end();
  },
};
