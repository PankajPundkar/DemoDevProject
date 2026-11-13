import { expect, newUser, test } from '../fixtures';
import { scenario } from '../support/scenarios';

/** AQA-59 – User login and logout. Scenarios: qa/04-test-design.md (TS-013 … TS-019). */
const GENERIC_LOGIN_ERROR = 'Invalid email or password.';

test.describe('AQA-59 User login and logout', () => {
  test('TS-013 log in with valid credentials', scenario('TS-013', 'AQA-59', 'REQ-12, REQ-18'), async ({ page, loginPage, dashboardPage, registeredUser }) => {
    await loginPage.login(registeredUser.email, registeredUser.password);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(dashboardPage.flash).toContainText(`Welcome back, ${registeredUser.fullName}!`);

    const { header } = dashboardPage;
    await expect(header.userChip).toContainText(registeredUser.fullName);
    await expect(header.userChip).toContainText(registeredUser.email);
    await expect(header.userChip.locator('.user-chip__avatar')).toHaveText('AL');
    await expect(header.logoutButton).toBeVisible();
    await expect(header.link('Login')).toHaveCount(0);
    await expect(header.link('Register')).toHaveCount(0);
    await expect(header.link('Dashboard')).toBeVisible();
  });

  test('TS-014 log in with the email in different letter case', scenario('TS-014', 'AQA-59', 'REQ-13'), async ({ page, loginPage, registeredUser }) => {
    await loginPage.login(registeredUser.email.toUpperCase(), registeredUser.password);
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('TS-015 wrong password shows a generic error', scenario('TS-015', 'AQA-59', 'REQ-14'), async ({ page, loginPage, registeredUser }) => {
    await loginPage.login(registeredUser.email, 'WrongPass1');

    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.formError).toHaveText(GENERIC_LOGIN_ERROR);
    await expect(loginPage.header.userChip).toHaveCount(0);
  });

  test('TS-016 unknown email shows the same generic error', scenario('TS-016', 'AQA-59', 'REQ-14'), async ({ page, loginPage }) => {
    const stranger = newUser();
    await loginPage.login(stranger.email, stranger.password);

    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.formError).toHaveText(GENERIC_LOGIN_ERROR);
  });

  test('TS-017 submit an empty login form', scenario('TS-017', 'AQA-59', 'REQ-11'), async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.submit();

    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.errorFor('email')).toHaveText('Email address is required.');
    await expect(loginPage.errorFor('password')).toHaveText('Password is required.');
  });

  test('TS-018 log out', scenario('TS-018', 'AQA-59', 'REQ-16'), async ({ page, dashboardPage, homePage, loggedInUser }) => {
    await dashboardPage.header.logout();

    await expect(page).toHaveURL(/\/\?loggedOut=1$/);
    await expect(homePage.flash).toContainText('You have been logged out.');
    await expect(homePage.header.link('Login')).toBeVisible();
    await expect(homePage.header.link('Register')).toBeVisible();
    await expect(homePage.header.userChip).toHaveCount(0);

    await dashboardPage.goto();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TS-019 logged-in user cannot open Login or Register', scenario('TS-019', 'AQA-59', 'REQ-17'), async ({ page, loginPage, registerPage, dashboardPage, loggedInUser }) => {
    await loginPage.goto();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(dashboardPage.flash).toContainText('You are already logged in.');

    await registerPage.goto();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
