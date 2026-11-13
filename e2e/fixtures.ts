import { test as base, expect } from '@playwright/test';
import { CookieConsent } from './pages/components';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ErrorPage, HomePage } from './pages/SimplePages';
import { newUser, registerViaHttp, type TestUser } from './support/users';

interface Options {
  /**
   * 'rejected' (default) plants a "reject non-essential" consent cookie so the banner
   * does not cover the page. Cookie-consent tests set it to 'none' for a first visit.
   */
  consent: 'none' | 'rejected';
}

interface Fixtures {
  homePage: HomePage;
  registerPage: RegisterPage;
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  errorPage: ErrorPage;
  /** A user that already exists (registered over HTTP), not logged in. */
  registeredUser: TestUser;
  /** A registered user who is logged in through the UI in this test's browser. */
  loggedInUser: TestUser;
}

export const test = base.extend<Options & Fixtures>({
  consent: ['rejected', { option: true }],

  context: async ({ context, consent, baseURL }, use) => {
    if (consent === 'rejected') {
      await CookieConsent.plant(context, baseURL as string, { analytics: false, marketing: false });
    }
    await use(context);
  },

  homePage: async ({ page }, use) => use(new HomePage(page)),
  registerPage: async ({ page }, use) => use(new RegisterPage(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
  errorPage: async ({ page }, use) => use(new ErrorPage(page)),

  registeredUser: async ({ request }, use) => {
    const user = newUser();
    await registerViaHttp(request, user);
    await use(user);
  },

  loggedInUser: async ({ registeredUser, loginPage, page }, use) => {
    await loginPage.login(registeredUser.email, registeredUser.password);
    await expect(page).toHaveURL(/\/dashboard$/);
    await use(registeredUser);
  },
});

export { expect };
export { newUser };
