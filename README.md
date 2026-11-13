# DemoSite: Express + TypeScript auth demo with GDPR cookie consent

This is a small, complete demo website. It shows how to build registration, login, protected pages and GDPR-aware cookie consent with **Express.js and TypeScript** on the server and **plain HTML, CSS and vanilla JavaScript** in the browser. There is **no database**: all data is stored in JSON files.

> This is a demo. It follows secure coding practices, but the JSON-file storage and in-memory rate limiting are designed for a single process. They are not meant for production scale.

---

## Features

- **Pages**: Home, Login, Register, Dashboard (protected), Privacy Policy, Cookie Policy, Terms of Use, and the 404 and error pages.
- **Authentication**
  - Registration with full name, email, password and confirm password.
  - Validation runs on both client **and** server. Password policy: at least 8 characters, at least one letter and one number, and no more than 72 bytes (bcrypt's limit).
  - Passwords are hashed with **bcrypt**. Plaintext passwords are never stored.
  - New accounts are **active immediately**. No email is ever sent.
  - Duplicate emails are rejected case-insensitively. The check is race-safe because it runs under a file lock.
  - Login shows a generic "Invalid email or password" error. For unknown emails a dummy bcrypt comparison runs, so response timing doesn't reveal which accounts exist.
  - The session ID is regenerated on login, which protects against session fixation.
  - Logout destroys the server-side session and clears the cookie.
  - Logged-in users who visit `/login` or `/register` are redirected to `/dashboard`.
  - After login, users are sent back to the protected page they originally asked for. Only same-origin paths are allowed, to prevent open redirects.
- **Security**
  - Server-side sessions are stored in `data/sessions.json` and identified by an `HttpOnly`, `SameSite=Lax` cookie with an expiry. The cookie also gets `Secure` over HTTPS.
  - **CSRF protection** uses synchronizer tokens on every POST. Forms send a hidden `_csrf` field and `fetch` calls send an `X-CSRF-Token` header.
  - **Login throttling**: failed attempts are limited per IP with `express-rate-limit`. Registration and the API are also rate-limited.
  - **Helmet** adds security headers and a strict **Content Security Policy** (`script-src 'self'`, `style-src 'self'`). This is why the HTML contains no inline JS or CSS.
  - Dynamic pages are sent with `Cache-Control: no-store`.
  - Request bodies are limited in size. Untrusted input is type-coerced and validated.
  - Errors are handled centrally. Users never see stack traces.
- **GDPR cookie consent**: banner, preferences dialog, Cookie Policy and Privacy Policy. See [GDPR implementation notes](#gdpr-cookie-consent-implementation-notes).
- **UI**: responsive and accessible.
  - Header with a mobile hamburger menu and the active link highlighted.
  - Reusable footer.
  - Labelled inputs, required-field markers, inline errors with `aria-invalid` and `aria-describedby`, a skip link and visible focus states.
  - A show/hide password toggle.

---

## Requirements

- Node.js **20 or newer** (tested with Node 24)
- npm

## Installation

```bash
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
```

Then edit `.env` and set `SESSION_SECRET`. You can generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> In development the app starts without a `.env` file and uses an insecure fallback secret, printing a warning. In production it **refuses to start** without a strong `SESSION_SECRET`.

## Running

| Command | What it does |
|---|---|
| `npm run dev` | Development server with auto-reload (`tsx watch`) at http://localhost:3000 |
| `npm run build` | Compiles TypeScript to `dist/` |
| `npm start` | Runs the compiled app (`node dist/server.js`). Run `npm run build` first. |
| `npm run start:prod` | Build, then start |
| `npm run typecheck` | Type-check without emitting files |
| `npm test` | Runs the test suite |

For a production-like run:

```bash
npm run build
NODE_ENV=production SESSION_SECRET=... COOKIE_SECURE=true npm start
```

`COOKIE_SECURE=true` needs HTTPS. If you terminate TLS at a reverse proxy, also set `TRUST_PROXY=true`.

## Testing

```bash
npm test
```

The tests use Node's built-in test runner with `tsx` and `supertest`. Each test file runs against a **temporary data directory**, so your `data/` folder is never touched. The tests cover:

- page rendering and navigation state,
- security headers,
- access control,
- CSRF rejection,
- registration validation, password hashing and duplicate prevention,
- the generic login error,
- the session cookie flags,
- logout,
- the consent API,
- login throttling,
- atomic, concurrent-safe JSON writes.

### End-to-end browser tests (Playwright)

The `e2e/` folder holds Playwright browser tests for every user-facing flow: registration, login and logout, the protected dashboard, session security, cookie consent, navigation and error pages. They follow the Page Object Model:

- `e2e/pages/`: page objects (locators and actions only)
- `e2e/specs/`: one spec per user story (scenarios and assertions)
- `e2e/fixtures.ts`: page objects, ready-made users and the consent setup as Playwright fixtures

First-time setup:

```bash
npm install
npx playwright install chromium
```

| Command | What it does |
|---|---|
| `npm run test:e2e` | Runs all browser tests (headless) |
| `npm run test:e2e:headed` | Same, with a visible browser |
| `npm run test:e2e:ui` | Playwright UI mode, for picking and debugging tests |
| `npm run test:e2e:report` | Opens the last HTML report |
| `npm run typecheck:e2e` | Type-checks the test code |
| `npx playwright test --grep @TS-013` | Runs one scenario (each test is tagged with its scenario ID and story) |

Playwright starts its **own** copy of the app on port 3100 (`e2e/server.ts`). It uses a throw-away data folder (`tests/.tmp/e2e-data`) and raised rate limits, so your `data/` folder and your dev server on port 3000 are never touched. To test a server that is already running, set `E2E_BASE_URL`, for example `E2E_BASE_URL=http://localhost:3000 npm run test:e2e`. In that case the real rate limits apply: about 10 failed logins per 15 minutes.

Reports: `playwright-report/` (HTML) and `test-results/junit-results.xml` (JUnit, the same format mcp-qa-lab uses for Xray imports).

### QA documents and traceability

The `qa/` folder holds the output of the mcp-qa-lab agent pipeline for this app:

| File | Agent | Content |
|---|---|---|
| `01-user-stories.md` | (input) | Draft user stories DRAFT-1 to DRAFT-5 with acceptance criteria |
| `02-story-review.md` | Story Review Agent | Clarity, testability and open questions per story |
| `03-requirements.md` / `.json` | Requirements Agent | 40 traceable requirements (REQ-01 to REQ-40) |
| `04-test-design.md` | Test Design Agent | 36 scenarios (TS-001 to TS-036) with steps and expected results |
| `05-xray-creation-preview.md` / `05-xray-payloads.json` | Xray Test Creation Agent | Preview and exact `create_xray_manual_test` payloads (nothing created yet) |

Each Playwright test is named and tagged with its scenario ID, so `TS-013` in the test design is `TS-013` in the report. Once the scenarios exist in Xray, map them in `e2e/xray-test-keys.json` (`{ "TS-013": "AQA-123" }`). The JUnit report then carries a `test_key` for each test, ready for import into Xray.

### Manual test checklist

1. Open http://localhost:3000. The cookie banner appears. Click **Reject non-essential**. In DevTools → Application → Cookies, only `cookie_consent` (and `sid`) exist.
2. Click **Cookie Settings** in the footer, enable Analytics and click **Save my choices**. `_demo_analytics` appears and the console logs `[demo-analytics] page view`.
3. Register with a weak password and check the inline errors. Then register properly. You are redirected to Login with a success message.
4. Log in with a wrong password and check the generic error. Then log in correctly. The Dashboard shows your name and email, and the header shows your name and **Log out**.
5. Log out. You land on Home with a "logged out" message, and `/dashboard` redirects to Login again.

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `production` enables strict checks and secure cookies by default |
| `PORT` | `3000` | HTTP port |
| `SESSION_SECRET` | (none) | **Required in production**, at least 32 random characters. Signs the session cookie. |
| `SESSION_TTL_MINUTES` | `120` | Session and cookie lifetime |
| `COOKIE_SECURE` | `true` in production | Adds the `Secure` flag to cookies. Requires HTTPS. |
| `TRUST_PROXY` | `false` | Trust `X-Forwarded-*` headers when running behind a proxy |
| `BCRYPT_ROUNDS` | `12` | bcrypt cost factor, clamped to 4–15 |
| `LOGIN_RATE_LIMIT_MAX` | `10` | Failed login attempts allowed per IP per window |
| `LOGIN_RATE_LIMIT_WINDOW_MINUTES` | `15` | Throttling window |
| `REGISTER_RATE_LIMIT_MAX` | `20` | Registration attempts allowed per IP per hour |
| `DATA_DIR` | `data` | Folder holding the JSON files. Relative to the project root, or absolute. |
| `COOKIE_POLICY_VERSION` | `1` | Bump this to ask every visitor for consent again |
| `SITE_NAME` | `DemoSite` | Displayed site name |
| `CONTACT_EMAIL` | `privacy@example.com` | Privacy contact shown in the footer and policies |

---

## Folder structure

```
.
├── src/
│   ├── app.ts                  # Express app: security headers, middleware order, routes
│   ├── server.ts               # HTTP server + graceful shutdown
│   ├── config/
│   │   ├── index.ts            # Env-based configuration (validated)
│   │   └── cookies.ts          # Cookie catalogue: single source for consent UI + policy page
│   ├── routes/                 # pageRoutes, authRoutes, apiRoutes
│   ├── controllers/            # authController, pageController, apiController
│   ├── services/               # authService (bcrypt, auth logic), consentService
│   ├── models/                 # Data access: userRepository, consentRepository, jsonSessionStore
│   ├── middleware/             # session, csrf, auth guards, rate limits, locals/rendering, errors
│   ├── utils/                  # jsonFile (atomic JSON I/O), validation, HttpError
│   └── types/                  # Domain types + Express/session type augmentation
├── views/                      # EJS templates (plain HTML + includes)
│   ├── layouts/main.ejs
│   ├── partials/               # header, footer, flash, cookie-consent, form-field
│   └── pages/                  # home, login, register, dashboard, privacy, cookies, terms, error
├── public/
│   ├── css/                    # base (tokens), layout (header/footer), components, cookie-consent
│   ├── js/                     # nav, form-validation, cookie-consent, vendor/ (simulated trackers)
│   └── images/
├── data/
│   ├── users.json              # { "users": [] } - empty template
│   ├── cookie-consent.json     # { "consents": [] } - empty template
│   └── sessions.json           # created at runtime (git-ignored)
├── tests/                      # node:test + supertest
├── e2e/                        # Playwright browser tests (pages/, specs/, fixtures)
├── qa/                         # Stories, requirements, test design, Xray preview
├── playwright.config.ts
├── .env.example
├── package.json
└── tsconfig.json
```

**Why EJS?** The brief asks for plain HTML with a reusable header and footer. EJS is plain HTML plus `include()`, and it HTML-escapes output with `<%= %>` by default. A tiny `res.renderPage()` helper in `src/middleware/locals.ts` wraps each page in the layout.

---

## Data storage (JSON files)

`src/utils/jsonFile.ts` handles all file access:

- **Initial creation**: the file and its folder are created with a default structure if missing.
- **Safe reading**: invalid JSON or an unexpected structure raises a `JsonFileError`. A corrupt file is **never overwritten automatically**, so no data is silently lost.
- **Atomic writes**: data is written to a temp file in the same folder and then renamed over the target. On Windows the rename is retried if antivirus briefly locks the file.
- **Concurrency**: each file has a promise-queue mutex, so read-modify-write cycles (`update()`) never interleave. For example, two simultaneous registrations with the same email can't both succeed.
- **Limitation**: the lock only works inside one process. Don't run several instances against the same `data/` folder.

Example `users.json` record (created by the app):

```json
{
  "users": [
    {
      "id": "6c1f5b0e-1a2b-4c3d-9e8f-0123456789ab",
      "fullName": "Jane Example",
      "email": "jane@example.com",
      "passwordHash": "$2b$12$...",
      "isActive": true,
      "createdAt": "2026-01-01T12:00:00.000Z",
      "updatedAt": "2026-01-01T12:00:00.000Z"
    }
  ]
}
```

---

## Security notes

- **Password hashes never leave the server.** Controllers only ever handle `PublicUser` (`id`, `fullName`, `email`, `createdAt`), produced by `toPublicUser()`. The session stores only the `userId`.
- **The client is never trusted.** Every field is re-validated in `src/utils/validation.ts`, and request-body values are coerced to strings so that arrays or objects are rejected.
- **CSRF**: every non-GET request is checked by `verifyCsrf` (constant-time comparison). Logout is POST-only, so a link or image can't log you out.
- **Sessions**: a generic cookie name (`sid`), `HttpOnly`, `SameSite=Lax`, a fixed expiry, and `Secure` when `COOKIE_SECURE=true`. The ID is regenerated on login and the session destroyed on logout. Expired sessions are pruned periodically.
- **Throttling** uses in-memory counters. Use a shared store such as Redis if you run more than one instance.
- **Registration tells users when an email is already taken.** Usable sign-up needs this. The registration rate limiter reduces the enumeration risk.
- **Secrets**: `.env` is git-ignored, and only `.env.example` is committed. `data/sessions.json` is git-ignored. `users.json` and `cookie-consent.json` are committed as empty templates. To stop git tracking your local data:
  `git update-index --skip-worktree data/users.json data/cookie-consent.json`

---

## GDPR cookie consent implementation notes

| Requirement | How it's met |
|---|---|
| Banner on first visit | `views/partials/cookie-consent.ejs` is hidden by default. `public/js/cookie-consent.js` shows it when there is no valid `cookie_consent` cookie. |
| No non-essential cookies before consent | The only cookie set before a choice is the strictly necessary `sid` (login and CSRF security). Optional scripts are injected only after consent. |
| Necessary vs analytics vs marketing | Defined once in `src/config/cookies.ts` and rendered in both the dialog and the Cookie Policy table: name, purpose, duration, provider. |
| Accept all / Reject non-essential / Customize | All three are on the banner. Accept and Reject get **equal visual weight**, because a weaker Reject button is considered a dark pattern. |
| No pre-ticked boxes | Optional toggles render unchecked. The dialog only reflects choices the user already saved. A test enforces this. |
| Clear affirmative action only | Consent is stored only when a button is clicked. Closing the dialog, clicking the backdrop, scrolling or doing nothing does **not** store consent. |
| Change or withdraw later | A **Cookie Settings** link in the footer of every page, a button on the Cookie Policy page, and a summary on the Dashboard. Withdrawal deletes the optional cookies immediately. |
| Preferences stored only after a choice | The `cookie_consent` cookie holds a policy version, random ID, choices and timestamp, and lasts 180 days. |
| Site usable when rejected | Nothing depends on optional cookies. |
| Third-party scripts gated | `public/js/vendor/analytics-demo.js` and `marketing-demo.js` simulate third-party tags. They are loaded dynamically only for consented categories. Adding a real provider also needs its domain added to the CSP in `src/app.ts`. |
| Proof of consent (Art. 7(1)) | `POST /api/consent` (CSRF-protected, rate-limited) adds an anonymous record to `data/cookie-consent.json`: random ID, choices, server-side policy version, action and timestamp. **No IP address** is stored. |
| Re-consent when the policy changes | Bump `COOKIE_POLICY_VERSION`. Old consent cookies become invalid and the banner reappears. |
| Works without JavaScript | No optional cookies can ever be set. "Cookie Settings" falls back to a link to the Cookie Policy page. |

The Privacy Policy (`/privacy`) covers the data collected, purposes, legal basis (GDPR Art. 6), retention, sharing, user rights and contact details. The policy texts are **templates**: have them reviewed before any real-world use.
