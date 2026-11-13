import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly path = '/dashboard';
  readonly profile: Locator;
  readonly privacy: Locator;
  readonly greeting: Locator;

  constructor(page: Page) {
    super(page);
    this.profile = page.getByTestId('profile-card');
    this.privacy = page.getByTestId('privacy-card');
    this.greeting = page.locator('.page-header__lead');
  }

  /** The <dd> value next to a profile label such as "Email" or "Account status". */
  profileValue(label: 'Full name' | 'Email' | 'Account status' | 'Member since'): Locator {
    return this.profile
      .locator('div')
      .filter({ has: this.page.locator('dt', { hasText: new RegExp(`^${label}$`) }) })
      .locator('dd');
  }

  /** "Allowed", "Refused" or "Not set", filled in by cookie-consent.js. */
  consentValue(category: 'analytics' | 'marketing'): Locator {
    return this.privacy.locator(`[data-consent-value="${category}"]`);
  }
}
