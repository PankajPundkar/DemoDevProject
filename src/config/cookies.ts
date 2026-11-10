import { config } from './index';

/**
 * Single source of truth for every cookie the site can set. Rendered in the
 * consent dialog and on the Cookie Policy page, so the two can never disagree.
 * If you add a cookie anywhere in the code, document it here.
 */
export interface CookieInfo {
  name: string;
  purpose: string;
  duration: string;
  provider: string;
}

export interface CookieCategory {
  id: 'necessary' | 'analytics' | 'marketing';
  title: string;
  required: boolean;
  description: string;
  cookies: CookieInfo[];
}

function sessionDuration(): string {
  const m = config.session.ttlMinutes;
  return m % 60 === 0 ? `${m / 60} hour${m === 60 ? '' : 's'}` : `${m} minutes`;
}

export const CONSENT_COOKIE_NAME = 'cookie_consent';
export const CONSENT_MAX_AGE_DAYS = 180;

export const cookieCatalog: CookieCategory[] = [
  {
    id: 'necessary',
    title: 'Strictly necessary',
    required: true,
    description:
      'Needed for the site to work: keeping you logged in, protecting forms against forgery (CSRF) and remembering your cookie choices. These cannot be switched off and do not require consent.',
    cookies: [
      {
        name: config.session.cookieName,
        purpose: 'Keeps your login session and a security token used to protect forms. HttpOnly - not readable by scripts.',
        duration: `${sessionDuration()} (or until you log out)`,
        provider: `${config.siteName} (first party)`,
      },
      {
        name: CONSENT_COOKIE_NAME,
        purpose: 'Stores your cookie preferences so we do not ask again on every page. Only set after you make a choice.',
        duration: `${CONSENT_MAX_AGE_DAYS} days`,
        provider: `${config.siteName} (first party)`,
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    required: false,
    description:
      'Help us understand how visitors use the site (for example, which pages are visited) so we can improve it. Off unless you switch them on.',
    cookies: [
      {
        name: '_demo_analytics',
        purpose: 'Demo analytics visitor identifier (simulated third-party analytics script, loaded only after consent).',
        duration: '365 days',
        provider: 'Demo Analytics (simulated)',
      },
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing & advertising',
    required: false,
    description:
      'Used to show more relevant advertising and measure campaigns. Off unless you switch them on.',
    cookies: [
      {
        name: '_demo_marketing',
        purpose: 'Demo advertising identifier (simulated ad script, loaded only after consent).',
        duration: '90 days',
        provider: 'Demo Ads (simulated)',
      },
    ],
  },
];
