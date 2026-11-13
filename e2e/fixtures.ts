import { test as base, expect, type BrowserContext } from '@playwright/test';
import { newUser, registerViaHttp, type TestUser } from './support/users';

interface Options {
  /**
   * 'rejected' (default) plants a "reject non-essential" consent cookie so the banner
   * does not cover the page. Cookie-consent tests set it to 'none' for a first visit.
   */
  consent: 'none' | 'rejected';
}

interface Fixtures {
  /** A user that already exists (registered over HTTP), not logged in. */
  registeredUser: TestUser;
  /** A registered user who is logged in through the UI in this test's browser. */
  loggedInUser: TestUser;
}

/** Plants a "reject non-essential" cookie_consent cookie (policy version 1, pinned in e2e/server.ts). */
async function plantRejectedConsent(context: BrowserContext, baseURL: string): Promise<void> {
  const value = {
    v: '1',
    id: '00000000-0000-4000-8000-000000000000',
    necessary: true,
    analytics: false,
    marketing: false,
    ts: new Date().toISOString(),
  };
  await context.addCookies([
    { name: 'cookie_consent', value: encodeURIComponent(JSON.stringify(value)), url: baseURL, sameSite: 'Lax' },
  ]);
}

export const test = base.extend<Options & Fixtures>({
  consent: ['rejected', { option: true }],

  context: async ({ context, consent, baseURL }, use) => {
    if (consent === 'rejected') await plantRejectedConsent(context, baseURL as string);
    await use(context);
  },

  registeredUser: async ({ request }, use) => {
    const user = newUser();
    await registerViaHttp(request, user);
    await use(user);
  },

  loggedInUser: async ({ registeredUser, page }, use) => {
    await page.goto('/login');
    await page.locator('#field-email').fill(registeredUser.email);
    await page.locator('#field-password').fill(registeredUser.password);
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await use(registeredUser);
  },
});

export { expect };
export { newUser };
