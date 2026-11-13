import { expect, test } from '../fixtures';
import { ANALYTICS_COOKIE, CONSENT_COOKIE, CookieConsent, MARKETING_COOKIE } from '../pages/components';
import { scenario } from '../support/scenarios';

/** DRAFT-4 – GDPR cookie consent. Scenarios: qa/04-test-design.md (TS-025 … TS-032). */
test.describe('DRAFT-4 GDPR cookie consent', () => {
  // Every test here starts as a first-time visitor with no consent cookie.
  test.use({ consent: 'none' });

  test('TS-025 first visit shows the banner and sets no optional cookies', scenario('TS-025', 'DRAFT-4', 'REQ-25, REQ-26'), async ({ page, context, homePage }) => {
    await homePage.goto();
    const { consent } = homePage;

    await expect(consent.banner).toBeVisible();
    await expect(consent.acceptAll).toBeVisible();
    await expect(consent.rejectAll).toBeVisible();
    await expect(consent.customize).toBeVisible();
    // Accept and Reject use the same button style (no "dark pattern" weaker reject).
    expect(await consent.rejectAll.getAttribute('class')).toBe(await consent.acceptAll.getAttribute('class'));

    const names = await CookieConsent.cookieNames(context);
    expect(names).not.toContain(CONSENT_COOKIE);
    expect(names).not.toContain(ANALYTICS_COOKIE);
    expect(names).not.toContain(MARKETING_COOKIE);
    await expect(page.locator('script[src^="/js/vendor/"]')).toHaveCount(0);
  });

  test('TS-026 accept all cookies', scenario('TS-026', 'DRAFT-4', 'REQ-27, REQ-31, REQ-33'), async ({ page, context, homePage }) => {
    await homePage.goto();
    const status = await homePage.consent.choose(homePage.consent.acceptAll);

    expect(status, 'POST /api/consent').toBe(204);
    await expect(homePage.consent.banner).toBeHidden();

    const stored = await CookieConsent.read(context);
    expect(stored).toMatchObject({ v: '1', necessary: true, analytics: true, marketing: true });

    const cookie = (await context.cookies()).find((c) => c.name === CONSENT_COOKIE);
    const days = ((cookie?.expires ?? 0) - Date.now() / 1000) / 86_400;
    expect(days).toBeGreaterThan(179);
    expect(days).toBeLessThanOrEqual(180);

    // The simulated vendor scripts load after consent and set their cookies.
    await expect.poll(() => CookieConsent.cookieNames(context)).toEqual(expect.arrayContaining([ANALYTICS_COOKIE, MARKETING_COOKIE]));

    await page.goto('/privacy');
    await expect(homePage.consent.banner).toBeHidden();
  });

  test('TS-027 reject non-essential cookies', scenario('TS-027', 'DRAFT-4', 'REQ-28'), async ({ page, context, homePage }) => {
    await homePage.goto();
    expect(await homePage.consent.choose(homePage.consent.rejectAll)).toBe(204);

    await expect(homePage.consent.banner).toBeHidden();
    expect(await CookieConsent.read(context)).toMatchObject({ analytics: false, marketing: false });

    const names = await CookieConsent.cookieNames(context);
    expect(names).not.toContain(ANALYTICS_COOKIE);
    expect(names).not.toContain(MARKETING_COOKIE);
    await expect(page.locator('script[src^="/js/vendor/"]')).toHaveCount(0);
  });

  test('TS-028 customize: allow analytics only', scenario('TS-028', 'DRAFT-4', 'REQ-29'), async ({ context, homePage }) => {
    await homePage.goto();
    const { consent } = homePage;
    await consent.customize.click();

    await expect(consent.dialog).toBeVisible();
    await expect(consent.necessary).toBeChecked();
    await expect(consent.necessary).toBeDisabled();
    await expect(consent.analytics).not.toBeChecked();
    await expect(consent.marketing).not.toBeChecked();

    await consent.setCategory(consent.analytics, true);
    expect(await consent.choose(consent.save)).toBe(204);

    await expect(consent.dialog).toBeHidden();
    await expect(consent.banner).toBeHidden();
    expect(await CookieConsent.read(context)).toMatchObject({ analytics: true, marketing: false });
    await expect.poll(() => CookieConsent.cookieNames(context)).toContain(ANALYTICS_COOKIE);
    expect(await CookieConsent.cookieNames(context)).not.toContain(MARKETING_COOKIE);
  });

  test('TS-029 closing the dialog is not consent', scenario('TS-029', 'DRAFT-4', 'REQ-30'), async ({ context, homePage }) => {
    await homePage.goto();
    const { consent } = homePage;
    await consent.customize.click();
    await expect(consent.dialog).toBeVisible();

    await consent.closeDialog.click();

    await expect(consent.dialog).toBeHidden();
    await expect(consent.banner).toBeVisible();
    expect(await CookieConsent.cookieNames(context)).not.toContain(CONSENT_COOKIE);
  });

  test('TS-030 withdraw consent via Cookie Settings', scenario('TS-030', 'DRAFT-4', 'REQ-32'), async ({ context, homePage }) => {
    await homePage.goto();
    const { consent, footer } = homePage;
    await consent.choose(consent.acceptAll);
    await expect.poll(() => CookieConsent.cookieNames(context)).toEqual(expect.arrayContaining([ANALYTICS_COOKIE, MARKETING_COOKIE]));

    await footer.cookieSettings.click();
    await expect(consent.dialog).toBeVisible();
    await expect(consent.analytics).toBeChecked();
    await expect(consent.marketing).toBeChecked();

    await consent.setCategory(consent.analytics, false);
    await consent.setCategory(consent.marketing, false);
    await consent.choose(consent.save);

    await expect(consent.dialog).toBeHidden();
    await expect.poll(() => CookieConsent.cookieNames(context)).not.toContain(ANALYTICS_COOKIE);
    expect(await CookieConsent.cookieNames(context)).not.toContain(MARKETING_COOKIE);
    expect(await CookieConsent.read(context)).toMatchObject({ analytics: false, marketing: false });
  });

  test('TS-031 outdated policy version shows the banner again', scenario('TS-031', 'DRAFT-4', 'REQ-34'), async ({ context, baseURL, homePage }) => {
    await CookieConsent.plant(context, baseURL as string, { analytics: true, marketing: true, version: '0' });

    await homePage.goto();

    await expect(homePage.consent.banner).toBeVisible();
    // The outdated consent is cleared and nothing optional is loaded.
    await expect.poll(() => CookieConsent.read(context)).toBeNull();
    expect(await CookieConsent.cookieNames(context)).not.toContain(ANALYTICS_COOKIE);
  });

  test('TS-032 dashboard shows the current consent choice', scenario('TS-032', 'DRAFT-4', 'REQ-35'), async ({ page, homePage, loginPage, dashboardPage, registeredUser }) => {
    await homePage.goto();
    const { consent } = homePage;
    await consent.customize.click();
    await consent.setCategory(consent.analytics, true);
    await consent.choose(consent.save);

    await loginPage.login(registeredUser.email, registeredUser.password);
    await expect(page).toHaveURL(/\/dashboard$/);

    await expect(dashboardPage.consentValue('analytics')).toHaveText('Allowed');
    await expect(dashboardPage.consentValue('marketing')).toHaveText('Refused');
  });
});
