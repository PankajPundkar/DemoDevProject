import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { TestUser } from '../support/users';

export type RegisterField = 'fullName' | 'email' | 'password' | 'confirmPassword';

export class RegisterPage extends BasePage {
  readonly path = '/register';
  readonly fullName: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly confirmPassword: Locator;
  readonly passwordHint: Locator;
  readonly passwordToggle: Locator;
  readonly submitButton: Locator;
  readonly formError: Locator;

  constructor(page: Page) {
    super(page);
    // Ids come from views/partials/form-field.ejs (field-<name>); labels alone are ambiguous
    // because "Password" is part of "Confirm password".
    this.fullName = page.locator('#field-fullName');
    this.email = page.locator('#field-email');
    this.password = page.locator('#field-password');
    this.confirmPassword = page.locator('#field-confirmPassword');
    this.passwordHint = page.locator('#field-password-hint');
    this.passwordToggle = page.locator('[data-toggle-password="field-password"]');
    this.submitButton = page.getByRole('button', { name: 'Create account' });
    this.formError = page.getByTestId('form-error');
  }

  field(name: RegisterField): Locator {
    return this.page.locator(`#field-${name}`);
  }

  /** Inline error text for a field (rendered by the server or by form-validation.js). */
  errorFor(name: RegisterField): Locator {
    return this.page.locator(`#field-${name}-error`);
  }

  /** Types a value and leaves the field, which triggers client-side validation. */
  async enter(name: RegisterField, value: string): Promise<void> {
    const input = this.field(name);
    await input.fill(value);
    await input.blur();
  }

  async fill(user: TestUser, confirmPassword = user.password): Promise<void> {
    await this.fullName.fill(user.fullName);
    await this.email.fill(user.email);
    await this.password.fill(user.password);
    await this.confirmPassword.fill(confirmPassword);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async register(user: TestUser): Promise<void> {
    await this.goto();
    await this.fill(user);
    await this.submit();
  }
}
