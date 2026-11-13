import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly path = '/login';
  readonly email: Locator;
  readonly password: Locator;
  readonly submitButton: Locator;
  readonly formError: Locator;
  readonly csrfField: Locator;

  constructor(page: Page) {
    super(page);
    this.email = page.locator('#field-email');
    this.password = page.locator('#field-password');
    this.submitButton = page.getByRole('button', { name: 'Log in', exact: true });
    this.formError = page.getByTestId('form-error');
    this.csrfField = page.locator('form[action="/login"] input[name="_csrf"]');
  }

  errorFor(name: 'email' | 'password'): Locator {
    return this.page.locator(`#field-${name}-error`);
  }

  async fill(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /** Opens the Login page (unless already there) and submits the credentials. */
  async login(email: string, password: string): Promise<void> {
    if (!new URL(this.page.url(), 'http://x').pathname.startsWith(this.path)) await this.goto();
    await this.fill(email, password);
    await this.submit();
  }
}
