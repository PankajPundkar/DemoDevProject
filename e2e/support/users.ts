import { expect, type APIRequestContext } from '@playwright/test';

export interface TestUser {
  fullName: string;
  email: string;
  password: string;
}

/** A unique user for each test, so tests can run in parallel and in any order. */
export function newUser(overrides: Partial<TestUser> = {}): TestUser {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return { fullName: 'Ada Lovelace', email: `e2e-${id}@example.com`, password: 'Passw0rd!', ...overrides };
}

/**
 * Registers a user over HTTP (fast precondition, no browser). Uses the real form flow:
 * load /register for a CSRF token, then post the form with the same session cookie.
 */
export async function registerViaHttp(request: APIRequestContext, user: TestUser): Promise<void> {
  const page = await request.get('/register');
  expect(page.ok(), 'GET /register').toBeTruthy();
  const token = (await page.text()).match(/name="_csrf" value="([^"]+)"/)?.[1];
  expect(token, 'CSRF token on /register').toBeTruthy();

  const res = await request.post('/register', {
    form: {
      _csrf: token as string,
      fullName: user.fullName,
      email: user.email,
      password: user.password,
      confirmPassword: user.password,
    },
    maxRedirects: 0,
  });
  expect(res.status(), 'registration should redirect to /login').toBe(302);
  expect(res.headers()['location']).toBe('/login');
}
