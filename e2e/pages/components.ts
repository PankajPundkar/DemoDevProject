import type { BrowserContext, Locator, Page } from '@playwright/test';

/** Site header: main navigation, signed-in user chip and Log out. */
export class Header {
  readonly nav: Locator;
  readonly currentLink: Locator;
  readonly userChip: Locator;
  readonly logoutButton: Locator;
  readonly menuToggle: Locator;

  constructor(page: Page) {
    this.nav = page.getByRole('navigation', { name: 'Main navigation' });
    this.currentLink = this.nav.locator('[aria-current="page"]');
    this.userChip = page.getByTestId('user-chip');
    this.logoutButton = page.getByRole('banner').getByRole('button', { name: 'Log out' });
    this.menuToggle = page.getByRole('button', { name: 'Menu' });
  }

  link(name: 'Home' | 'Login' | 'Register' | 'Dashboard'): Locator {
    return this.nav.getByRole('link', { name, exact: true });
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}

/** Site footer: legal links and the Cookie Settings opener. */
export class Footer {
  readonly legalNav: Locator;
  readonly cookieSettings: Locator;

  constructor(page: Page) {
    this.legalNav = page.getByRole('navigation', { name: 'Legal links' });
    this.cookieSettings = this.legalNav.getByRole('link', { name: 'Cookie Settings' });
  }

  legalLink(name: 'Privacy Policy' | 'Cookie Policy' | 'Terms of Use'): Locator {
    return this.legalNav.getByRole('link', { name, exact: true });
  }
}

export const CONSENT_COOKIE = 'cookie_consent';
export const ANALYTICS_COOKIE = '_demo_analytics';
export const MARKETING_COOKIE = '_demo_marketing';

export interface ConsentState {
  v: string;
  id: string;
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  ts: string;
}

/** Cookie banner and the Cookie preferences dialog. */
export class CookieConsent {
  readonly banner: Locator;
  readonly acceptAll: Locator;
  readonly rejectAll: Locator;
  readonly customize: Locator;
  readonly dialog: Locator;
  readonly necessary: Locator;
  readonly analytics: Locator;
  readonly marketing: Locator;
  readonly save: Locator;
  readonly closeDialog: Locator;

  constructor(private readonly page: Page) {
    this.banner = page.getByRole('region', { name: 'Your privacy choices' });
    this.acceptAll = this.banner.getByRole('button', { name: 'Accept all' });
    this.rejectAll = this.banner.getByRole('button', { name: 'Reject non-essential' });
    this.customize = this.banner.getByRole('button', { name: 'Customize' });
    this.dialog = page.getByRole('dialog', { name: 'Cookie preferences' });
    this.necessary = this.dialog.getByRole('checkbox', { name: 'Strictly necessary' });
    this.analytics = this.dialog.getByRole('checkbox', { name: 'Analytics' });
    this.marketing = this.dialog.getByRole('checkbox', { name: 'Marketing' });
    this.save = this.dialog.getByRole('button', { name: 'Save my choices' });
    this.closeDialog = this.dialog.getByRole('button', { name: 'Close without saving' });
  }

  /**
   * Switches a category on or off. The real checkbox is transparent and sits under the styled
   * switch track (which receives the click), so the actionability check is skipped; the click
   * still lands on the label and toggles the checkbox like a user's click would.
   */
  async setCategory(category: Locator, on: boolean): Promise<void> {
    await category.setChecked(on, { force: true });
  }

  /** Clicks a consent choice and waits for the anonymous proof-of-consent request. */
  async choose(button: Locator): Promise<number> {
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().endsWith('/api/consent') && r.request().method() === 'POST'),
      button.click(),
    ]);
    return response.status();
  }

  /** Cookie names currently set in the browser. */
  static async cookieNames(context: BrowserContext): Promise<string[]> {
    return (await context.cookies()).map((c) => c.name);
  }

  /** Parsed cookie_consent value, or null when there is none. */
  static async read(context: BrowserContext): Promise<ConsentState | null> {
    const cookie = (await context.cookies()).find((c) => c.name === CONSENT_COOKIE);
    return cookie ? (JSON.parse(decodeURIComponent(cookie.value)) as ConsentState) : null;
  }

  /** Plants a consent cookie so the banner stays out of the way (or to simulate an old policy). */
  static async plant(
    context: BrowserContext,
    baseURL: string,
    prefs: { analytics: boolean; marketing: boolean; version?: string },
  ): Promise<void> {
    const value: ConsentState = {
      v: prefs.version ?? '1',
      id: '00000000-0000-4000-8000-000000000000',
      necessary: true,
      analytics: prefs.analytics,
      marketing: prefs.marketing,
      ts: new Date().toISOString(),
    };
    await context.addCookies([
      { name: CONSENT_COOKIE, value: encodeURIComponent(JSON.stringify(value)), url: baseURL, sameSite: 'Lax' },
    ]);
  }
}
