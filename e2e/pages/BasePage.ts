import type { Locator, Page } from '@playwright/test';
import { CookieConsent, Footer, Header } from './components';

/** Shared layout pieces available on every page. */
export abstract class BasePage {
  abstract readonly path: string;
  readonly header: Header;
  readonly footer: Footer;
  readonly consent: CookieConsent;
  /** One-time flash messages shown after redirects (success, info, errors). */
  readonly flash: Locator;
  readonly heading: Locator;

  constructor(readonly page: Page) {
    this.header = new Header(page);
    this.footer = new Footer(page);
    this.consent = new CookieConsent(page);
    this.flash = page.getByTestId('flash-message');
    this.heading = page.getByRole('heading', { level: 1 });
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }
}
