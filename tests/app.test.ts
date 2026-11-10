import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import type { Express } from 'express';
import { cleanup, csrfFrom, setupTestEnv } from './helpers';

const dataDir = setupTestEnv({ LOGIN_RATE_LIMIT_MAX: '5' });
let app: Express;

const USER = { fullName: 'Ada Lovelace', email: 'Ada@Example.com', password: 'secret123', confirmPassword: 'secret123' };

function readJson(file: string) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
}

/** Load a page with the agent and return its CSRF token. */
async function tokenFor(agent: ReturnType<typeof request.agent>, url: string): Promise<string> {
  const res = await agent.get(url).expect(200);
  return csrfFrom(res.text);
}

before(async () => {
  const mod = await import('../src/app');
  app = mod.createApp();
});

after(() => {
  // The session store prunes on an unref'd timer, so the process can exit cleanly.
  cleanup(dataDir);
});

describe('public pages', () => {
  it('renders the home page with guest navigation, footer and cookie banner', async () => {
    const res = await request(app).get('/').expect(200);
    assert.match(res.text, /href="\/login"/);
    assert.match(res.text, /href="\/register"/);
    assert.doesNotMatch(res.text, /Log out/);
    assert.match(res.text, /aria-current="page">Home/);
    assert.match(res.text, /Cookie Settings/);
    assert.match(res.text, /id="cookie-banner"/);
    assert.match(res.text, new RegExp(`&copy; ${new Date().getFullYear()}`));
  });

  it('serves privacy, cookie and terms pages', async () => {
    await request(app).get('/privacy').expect(200).expect(/Privacy Policy/);
    await request(app).get('/cookies').expect(200).expect(/_demo_analytics/);
    await request(app).get('/terms').expect(200).expect(/Terms of Use/);
  });

  it('never pre-ticks optional cookie categories', async () => {
    const res = await request(app).get('/').expect(200);
    const analytics = res.text.match(/<input type="checkbox" id="consent-analytics"[^>]*>/)?.[0] ?? '';
    const marketing = res.text.match(/<input type="checkbox" id="consent-marketing"[^>]*>/)?.[0] ?? '';
    assert.ok(analytics && marketing, 'checkboxes should render');
    assert.doesNotMatch(analytics, /checked/);
    assert.doesNotMatch(marketing, /checked/);
  });

  it('sets security headers and a strict CSP', async () => {
    const res = await request(app).get('/').expect(200);
    assert.match(res.headers['content-security-policy'], /script-src 'self'/);
    assert.equal(res.headers['x-powered-by'], undefined);
    assert.equal(res.headers['cache-control'], 'no-store');
  });

  it('returns a 404 page for unknown routes', async () => {
    await request(app).get('/does-not-exist').expect(404).expect(/Page not found/);
  });
});

describe('access control', () => {
  it('redirects anonymous users from the dashboard to login', async () => {
    const res = await request(app).get('/dashboard').expect(302);
    assert.equal(res.headers.location, '/login');
  });

  it('rejects anonymous API access with 401', async () => {
    await request(app).get('/api/me').expect(401);
  });

  it('rejects state-changing requests without a CSRF token', async () => {
    await request(app).post('/register').type('form').send(USER).expect(403);
  });
});

describe('registration', () => {
  it('validates fields on the server', async () => {
    const agent = request.agent(app);
    const _csrf = await tokenFor(agent, '/register');
    const res = await agent
      .post('/register')
      .type('form')
      .send({ _csrf, fullName: 'A', email: 'not-an-email', password: 'short', confirmPassword: 'nope' })
      .expect(400);
    assert.match(res.text, /Full name must be between/);
    assert.match(res.text, /Enter a valid email address/);
    assert.match(res.text, /at least 8 characters/);
    assert.match(res.text, /Passwords do not match/);
  });

  it('enforces letter + number in passwords', async () => {
    const agent = request.agent(app);
    const _csrf = await tokenFor(agent, '/register');
    const res = await agent
      .post('/register')
      .type('form')
      .send({ _csrf, ...USER, password: 'onlyletters', confirmPassword: 'onlyletters' })
      .expect(400);
    assert.match(res.text, /at least one letter and one number/);
  });

  it('creates an active user with a hashed password and redirects to login', async () => {
    const agent = request.agent(app);
    const _csrf = await tokenFor(agent, '/register');
    const res = await agent.post('/register').type('form').send({ _csrf, ...USER }).expect(302);
    assert.equal(res.headers.location, '/login');

    const login = await agent.get('/login').expect(200);
    assert.match(login.text, /account has been created/);

    const { users } = readJson('users.json');
    assert.equal(users.length, 1);
    const [u] = users;
    assert.equal(u.email, 'ada@example.com', 'email is normalised');
    assert.equal(u.isActive, true);
    assert.notEqual(u.passwordHash, USER.password);
    assert.match(u.passwordHash, /^\$2[aby]\$/);
    assert.ok(u.id && u.createdAt && u.updatedAt);
  });

  it('prevents duplicate registrations (case-insensitive)', async () => {
    const agent = request.agent(app);
    const _csrf = await tokenFor(agent, '/register');
    const res = await agent
      .post('/register')
      .type('form')
      .send({ _csrf, ...USER, email: 'ADA@example.COM' })
      .expect(409);
    assert.match(res.text, /already exists/);
    assert.equal(readJson('users.json').users.length, 1);
  });
});

describe('login, session and logout', () => {
  it('uses the same generic error for wrong password and unknown email', async () => {
    const agent = request.agent(app);
    let _csrf = await tokenFor(agent, '/login');
    const wrongPw = await agent.post('/login').type('form').send({ _csrf, email: USER.email, password: 'wrong1234' }).expect(401);
    _csrf = await tokenFor(agent, '/login');
    const noUser = await agent.post('/login').type('form').send({ _csrf, email: 'nobody@example.com', password: 'wrong1234' }).expect(401);
    assert.match(wrongPw.text, /Invalid email or password/);
    assert.match(noUser.text, /Invalid email or password/);
    assert.doesNotMatch(wrongPw.text, /wrong1234/, 'password must never be echoed');
  });

  it('logs in, shows the dashboard without sensitive fields, then logs out', async () => {
    const agent = request.agent(app);
    const _csrf = await tokenFor(agent, '/login');

    const loginRes = await agent.post('/login').type('form').send({ _csrf, email: USER.email, password: USER.password }).expect(302);
    assert.equal(loginRes.headers.location, '/dashboard');
    const setCookie = String(loginRes.headers['set-cookie']);
    assert.match(setCookie, /sid=/);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
    assert.match(setCookie, /Expires=/i);

    const dash = await agent.get('/dashboard').expect(200);
    assert.match(dash.text, /Ada Lovelace/);
    assert.match(dash.text, /ada@example.com/);
    assert.match(dash.text, /Log out/);
    assert.match(dash.text, /aria-current="page">Dashboard/);
    assert.doesNotMatch(dash.text, /passwordHash|\$2[aby]\$/);

    const me = await agent.get('/api/me').expect(200);
    assert.deepEqual(Object.keys(me.body.user).sort(), ['createdAt', 'email', 'fullName', 'id']);

    // Logged-in users are redirected away from login/register.
    assert.equal((await agent.get('/login').expect(302)).headers.location, '/dashboard');
    assert.equal((await agent.get('/register').expect(302)).headers.location, '/dashboard');

    // Logout: destroys session + clears cookie
    const logoutToken = csrfFrom(dash.text);
    const out = await agent.post('/logout').type('form').send({ _csrf: logoutToken }).expect(302);
    assert.equal(out.headers.location, '/?loggedOut=1');
    assert.match(String(out.headers['set-cookie']), /sid=;/);

    await agent.get('/?loggedOut=1').expect(200).expect(/You have been logged out/);
    await agent.get('/dashboard').expect(302);
    await agent.get('/api/me').expect(401);
  });

  it('sends users back to the protected page they originally requested', async () => {
    const agent = request.agent(app);
    await agent.get('/dashboard').expect(302);
    const _csrf = await tokenFor(agent, '/login');
    const res = await agent.post('/login').type('form').send({ _csrf, email: USER.email, password: USER.password }).expect(302);
    assert.equal(res.headers.location, '/dashboard');
  });
});

describe('cookie consent API', () => {
  it('records a valid consent decision without personal data', async () => {
    const agent = request.agent(app);
    const token = await tokenFor(agent, '/');
    const consentId = '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e';
    await agent
      .post('/api/consent')
      .set('X-CSRF-Token', token)
      .send({ consentId, analytics: true, marketing: false, action: 'custom' })
      .expect(204);

    const { consents } = readJson('cookie-consent.json');
    const rec = consents.find((c: { consentId: string }) => c.consentId === consentId);
    assert.ok(rec);
    assert.deepEqual(rec.preferences, { necessary: true, analytics: true, marketing: false });
    assert.equal(rec.ip, undefined);
  });

  it('rejects malformed consent payloads', async () => {
    const agent = request.agent(app);
    const token = await tokenFor(agent, '/');
    await agent.post('/api/consent').set('X-CSRF-Token', token).send({ consentId: 'x', analytics: 'yes' }).expect(400);
  });

  it('requires a CSRF token', async () => {
    await request(app)
      .post('/api/consent')
      .send({ consentId: '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e', analytics: false, marketing: false, action: 'reject_all' })
      .expect(403);
  });
});

describe('login throttling', () => {
  it('blocks after too many failed attempts', async () => {
    const agent = request.agent(app);
    let lastStatus = 0;
    // Earlier tests already used some attempts from this IP; keep going until blocked.
    for (let i = 0; i < 8; i++) {
      const _csrf = await tokenFor(agent, '/login');
      const res = await agent.post('/login').type('form').send({ _csrf, email: USER.email, password: 'bad-pass-1' });
      lastStatus = res.status;
      if (res.status === 429) {
        assert.match(res.text, /Too many login attempts/);
        break;
      }
    }
    assert.equal(lastStatus, 429);
  });
});
