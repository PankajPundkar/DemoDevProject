import type { BrowserContext } from '@playwright/test';
import { expect, test } from '../fixtures';
import { scenario } from '../support/scenarios';

/** DRAFT-3 – Protected dashboard and session security. Scenarios: TS-020 … TS-024. */
async function sessionCookie(context: BrowserContext) {
  return (await context.cookies()).find((c) => c.name === 'sid');
}

test.describe('DRAFT-3 Protected dashboard and session security', () => {
  test('TS-020 anonymous dashboard access redirects to Login and back', scenario('TS-020', 'DRAFT-3', 'REQ-19, REQ-20'), async ({ page, loginPage, registeredUser }) => {
    // A query string makes the "originally requested page" distinguishable from the default target.
    await page.goto('/dashboard?from=e2e');

    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.flash).toContainText('Please log in to view that page.');

    await loginPage.login(registeredUser.email, registeredUser.password);
    await expect(page).toHaveURL(/\/dashboard\?from=e2e$/);
  });

  test('TS-021 dashboard shows the profile without sensitive data', scenario('TS-021', 'DRAFT-3', 'REQ-21'), async ({ page, dashboardPage, loggedInUser }) => {
    await dashboardPage.goto();

    await expect(dashboardPage.heading).toHaveText('Dashboard');
    await expect(dashboardPage.profileValue('Full name')).toHaveText(loggedInUser.fullName);
    await expect(dashboardPage.profileValue('Email')).toHaveText(loggedInUser.email.toLowerCase());
    await expect(dashboardPage.profileValue('Account status')).toHaveText('Active');
    await expect(dashboardPage.profileValue('Member since')).toHaveText(/^\d{1,2} [A-Z][a-z]+ \d{4}$/);

    const html = await page.content();
    expect(html).not.toContain(loggedInUser.password);
    expect(html).not.toContain('passwordHash');
    expect(html).not.toMatch(/\$2[aby]\$\d{2}\$/); // bcrypt hash prefix
  });

  test('TS-022 session cookie is HttpOnly and SameSite=Lax', scenario('TS-022', 'DRAFT-3', 'REQ-22'), async ({ page, context, loggedInUser }) => {
    expect(loggedInUser.email).toContain('@');
    const sid = await sessionCookie(context);

    expect(sid, 'sid cookie').toBeDefined();
    expect(sid?.httpOnly).toBe(true);
    expect(sid?.sameSite).toBe('Lax');
    expect(sid?.path).toBe('/');
    expect(await page.evaluate(() => document.cookie)).not.toContain('sid=');
  });

  test('TS-023 session ID changes on login', scenario('TS-023', 'DRAFT-3', 'REQ-23'), async ({ page, context, loginPage, registeredUser }) => {
    await loginPage.goto();
    const before = await sessionCookie(context);
    expect(before, 'the login page starts a session (it holds the CSRF token)').toBeDefined();

    await loginPage.login(registeredUser.email, registeredUser.password);
    await expect(page).toHaveURL(/\/dashboard$/);

    const after = await sessionCookie(context);
    expect(after?.value).toBeTruthy();
    expect(after?.value).not.toBe(before?.value);
  });

  test('TS-024 login with a tampered CSRF token is blocked', scenario('TS-024', 'DRAFT-3', 'REQ-24'), async ({ page, loginPage, errorPage, registeredUser }) => {
    await loginPage.goto();
    await loginPage.csrfField.evaluate((input: HTMLInputElement) => {
      input.value = 'tampered-token';
    });
    await loginPage.fill(registeredUser.email, registeredUser.password);

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith('/login') && r.request().method() === 'POST'),
      loginPage.submit(),
    ]);

    expect(response.status()).toBe(403);
    await expect(errorPage.status).toHaveText('403');
    await expect(errorPage.heading).toHaveText('Request blocked');

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });
});
