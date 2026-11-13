import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly path = '/';
}

/** Privacy Policy, Cookie Policy and Terms of Use. */
export class LegalPage extends BasePage {
  constructor(page: Page, readonly path: '/privacy' | '/cookies' | '/terms') {
    super(page);
  }
}

/** The 404 / error page (views/pages/error.ejs). */
export class ErrorPage extends BasePage {
  readonly path = '/';
  readonly status: Locator;
  readonly backHome: Locator;

  constructor(page: Page) {
    super(page);
    this.status = page.getByTestId('error-status');
    this.backHome = page.getByRole('main').getByRole('link', { name: 'Back to home' });
  }
}
