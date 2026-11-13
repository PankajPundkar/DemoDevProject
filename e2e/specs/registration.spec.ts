import { expect, newUser, test } from '../fixtures';
import { scenario } from '../support/scenarios';

/** AQA-58 – User registration. Scenarios: qa/04-test-design.md (TS-001 … TS-012). */
test.describe('AQA-58 User registration', () => {
  test('TS-001 register with valid details', scenario('TS-001', 'AQA-58', 'REQ-01, REQ-08'), async ({ page, registerPage, loginPage }) => {
    const user = newUser();
    await registerPage.goto();
    for (const field of [registerPage.fullName, registerPage.email, registerPage.password, registerPage.confirmPassword]) {
      await expect(field).toBeVisible();
      await expect(field).toHaveAttribute('aria-required', 'true');
    }

    await registerPage.fill(user);
    await registerPage.submit();

    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.flash).toContainText('Your account has been created and is active. Please log in.');

    await loginPage.login(user.email, user.password);
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('TS-002 submit an empty registration form', scenario('TS-002', 'AQA-58', 'REQ-01'), async ({ page, registerPage }) => {
    await registerPage.goto();
    await registerPage.submit();

    await expect(page).toHaveURL(/\/register$/);
    await expect(registerPage.errorFor('fullName')).toHaveText('Full name is required.');
    await expect(registerPage.errorFor('email')).toHaveText('Email address is required.');
    await expect(registerPage.errorFor('password')).toHaveText('Password is required.');
    await expect(registerPage.errorFor('confirmPassword')).toHaveText('Please confirm your password.');
    for (const name of ['fullName', 'email', 'password', 'confirmPassword'] as const) {
      await expect(registerPage.field(name)).toHaveAttribute('aria-invalid', 'true');
    }
  });

  test('TS-003 reject an invalid email format', scenario('TS-003', 'AQA-58', 'REQ-03'), async ({ registerPage }) => {
    await registerPage.goto();
    await registerPage.enter('email', 'ada@example');
    await expect(registerPage.errorFor('email')).toHaveText('Enter a valid email address.');
  });

  test('TS-004 reject a 7-character password', scenario('TS-004', 'AQA-58', 'REQ-04'), async ({ registerPage }) => {
    await registerPage.goto();
    await expect(registerPage.passwordHint).toHaveText('At least 8 characters, including at least one letter and one number.');
    await registerPage.enter('password', 'abc1234');
    await expect(registerPage.errorFor('password')).toHaveText('Password must be at least 8 characters.');
  });

  test('TS-005 accept an 8-character password', scenario('TS-005', 'AQA-58', 'REQ-04'), async ({ page, registerPage }) => {
    await registerPage.register(newUser({ password: 'abcdefg1' }));
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TS-006 reject a password without a number', scenario('TS-006', 'AQA-58', 'REQ-04'), async ({ registerPage }) => {
    await registerPage.goto();
    await registerPage.enter('password', 'abcdefgh');
    await expect(registerPage.errorFor('password')).toHaveText('Password must contain at least one letter and one number.');
  });

  test('TS-007 reject a confirm password that does not match', scenario('TS-007', 'AQA-58', 'REQ-05'), async ({ registerPage }) => {
    await registerPage.goto();
    await registerPage.enter('password', 'Passw0rd!');
    await registerPage.enter('confirmPassword', 'Passw0rd?');
    await expect(registerPage.errorFor('confirmPassword')).toHaveText('Passwords do not match.');
  });

  test('TS-008 reject a full name containing < or >', scenario('TS-008', 'AQA-58', 'REQ-02'), async ({ registerPage }) => {
    await registerPage.goto();
    await registerPage.enter('fullName', '<b>Ada</b>');
    await expect(registerPage.errorFor('fullName')).toHaveText('Full name contains invalid characters.');
  });

  test('TS-009 reject a 1-character full name', scenario('TS-009', 'AQA-58', 'REQ-02'), async ({ registerPage }) => {
    await registerPage.goto();
    await registerPage.enter('fullName', 'A');
    await expect(registerPage.errorFor('fullName')).toHaveText('Full name must be between 2 and 100 characters.');
  });

  test('TS-010 reject an already-registered email in different letter case', scenario('TS-010', 'AQA-58', 'REQ-07'), async ({ page, registerPage, registeredUser }) => {
    await registerPage.register({ ...registeredUser, email: registeredUser.email.toUpperCase() });

    await expect(page).toHaveURL(/\/register$/);
    await expect(registerPage.formError).toHaveText('We could not create your account.');
    await expect(registerPage.errorFor('email')).toHaveText('An account with this email already exists. Try logging in instead.');
  });

  test.describe('with JavaScript disabled', () => {
    test.use({ javaScriptEnabled: false });

    test('TS-011 server rejects invalid input when browser validation is off', scenario('TS-011', 'AQA-58', 'REQ-06'), async ({ page, registerPage }) => {
      await registerPage.goto();
      await registerPage.fullName.fill('A');
      await registerPage.email.fill('bad');
      await registerPage.password.fill('short');

      const [response] = await Promise.all([
        page.waitForResponse((r) => r.url().endsWith('/register') && r.request().method() === 'POST'),
        registerPage.submit(),
      ]);

      expect(response.status()).toBe(400);
      await expect(registerPage.formError).toHaveText('Please correct the highlighted fields.');
      await expect(registerPage.errorFor('fullName')).toHaveText('Full name must be between 2 and 100 characters.');
      await expect(registerPage.errorFor('email')).toHaveText('Enter a valid email address.');
      await expect(registerPage.errorFor('password')).toHaveText('Password must be at least 8 characters.');
      await expect(registerPage.errorFor('confirmPassword')).toHaveText('Please confirm your password.');
    });
  });

  test('TS-012 show and hide the password', scenario('TS-012', 'AQA-58', 'REQ-09'), async ({ registerPage }) => {
    await registerPage.goto();
    await registerPage.password.fill('Passw0rd!');
    await expect(registerPage.password).toHaveAttribute('type', 'password');

    await registerPage.passwordToggle.click();
    await expect(registerPage.password).toHaveAttribute('type', 'text');
    await expect(registerPage.passwordToggle).toHaveText('Hide');

    await registerPage.passwordToggle.click();
    await expect(registerPage.password).toHaveAttribute('type', 'password');
    await expect(registerPage.passwordToggle).toHaveText('Show');
  });
});
