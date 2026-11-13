import { expect, test } from '../fixtures';
import { LegalPage } from '../pages/SimplePages';
import { scenario } from '../support/scenarios';

/** DRAFT-5 – Site navigation, legal pages and error pages. Scenarios: TS-033 … TS-036. */
test.describe('DRAFT-5 Site navigation, legal pages and error pages', () => {
  test('TS-033 guest header navigation', scenario('TS-033', 'DRAFT-5', 'REQ-36'), async ({ page, homePage }) => {
    await homePage.goto();
    const { header } = homePage;

    await expect(header.link('Home')).toBeVisible();
    await expect(header.link('Login')).toBeVisible();
    await expect(header.link('Register')).toBeVisible();
    await expect(header.link('Dashboard')).toHaveCount(0);
    await expect(header.currentLink).toHaveText('Home');

    await header.link('Login').click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(header.currentLink).toHaveText('Login');

    await header.link('Register').click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(header.currentLink).toHaveText('Register');
  });

  test('TS-034 footer legal links open the legal pages', scenario('TS-034', 'DRAFT-5', 'REQ-38'), async ({ page, homePage }) => {
    const pages = [
      { link: 'Privacy Policy', path: '/privacy', heading: 'Privacy Policy' },
      { link: 'Cookie Policy', path: '/cookies', heading: 'Cookie Policy' },
      { link: 'Terms of Use', path: '/terms', heading: 'Terms of Use' },
    ] as const;

    await homePage.goto();
    await expect(homePage.footer.cookieSettings).toBeVisible();

    for (const target of pages) {
      await homePage.footer.legalLink(target.link).click();
      const legal = new LegalPage(page, target.path);
      await expect(page).toHaveURL(new RegExp(`${target.path}$`));
      await expect(legal.heading).toHaveText(target.heading);
      await expect(legal.footer.cookieSettings).toBeVisible();
    }
  });

  test('TS-035 unknown URL shows the 404 page', scenario('TS-035', 'DRAFT-5', 'REQ-39'), async ({ page, errorPage }) => {
    const response = await page.goto('/this-page-does-not-exist');

    expect(response?.status()).toBe(404);
    await expect(errorPage.status).toHaveText('404');
    await expect(errorPage.heading).toHaveText('Page not found');

    await errorPage.backHome.click();
    await expect(page).toHaveURL(/\/$/);
  });

  test.describe('on a small screen', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('TS-036 mobile menu opens and closes', scenario('TS-036', 'DRAFT-5', 'REQ-37'), async ({ page, homePage }) => {
      await homePage.goto();
      const { header } = homePage;

      await expect(header.menuToggle).toBeVisible();
      await expect(header.menuToggle).toHaveAttribute('aria-expanded', 'false');
      await expect(header.link('Login')).toBeHidden();

      await header.menuToggle.click();
      await expect(header.menuToggle).toHaveAttribute('aria-expanded', 'true');
      await expect(header.link('Login')).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(header.menuToggle).toHaveAttribute('aria-expanded', 'false');
      await expect(header.link('Login')).toBeHidden();
    });
  });
});
