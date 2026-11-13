# Requirements Package – DemoSite

> **Agent:** Requirements Agent (`.github/agents/requirements-agent.agent.md`) · **Date:** 2026-11-13
> **Input:** Jira stories AQA-58 … AQA-62, retrieved via Atlassian MCP (keys verified), and the review in `qa/02-story-review.md`.
> REQ IDs are unchanged from the draft package; only story keys and the new review findings were updated.
> A machine-readable copy for the Test Design Agent is in `qa/03-requirements.json`.

## Story Information

| Story key | Summary | Source |
| --- | --- | --- |
| AQA-58 | User registration | Jira |
| AQA-59 | User login and logout | Jira |
| AQA-60 | Protected dashboard and session security | Jira |
| AQA-61 | GDPR cookie consent | Jira |
| AQA-62 | Site navigation, legal pages and error pages | Jira |

## Requirement Summary

| Requirement ID | Story | Requirement Description | Source AC | Requirement Type | Priority | Testability | Ambiguities and Assumptions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-01 | AQA-58 | The Register page shows Full name, Email address, Password and Confirm password; all are required. | AC-1 | Functional | High | Testable | – |
| REQ-02 | AQA-58 | Full name is 2–100 characters after trimming and contains no "&lt;" or "&gt;". | AC-2 | Validation Rule | High | Testable | – |
| REQ-03 | AQA-58 | Email address matches name@domain.tld, has no spaces and is at most 254 characters. | AC-3 | Validation Rule | High | Testable | – |
| REQ-04 | AQA-58 | Password is at least 8 characters, at most 72 bytes, and has at least one letter and one number; the rule is shown as a hint. | AC-4 | Validation Rule | High | Testable | 72 bytes vs 72 characters for non-ASCII passwords. |
| REQ-05 | AQA-58 | Confirm password must equal Password. | AC-5 | Validation Rule | High | Testable | – |
| REQ-06 | AQA-58 | The server re-validates every registration field independently of browser validation. | AC-6 | Security | High | Testable | – |
| REQ-07 | AQA-58 | An already-registered email (any letter case) is rejected with "An account with this email already exists. Try logging in instead." | AC-7 | Business Rule | High | Needs clarification | Conflicts with enumeration protection in AQA-59 AC-4. Assumption (unconfirmed): the product owner accepts revealing that an email is registered, mitigated by rate limiting. |
| REQ-08 | AQA-58 | Successful registration creates an active account, redirects to Login and shows "Your account has been created and is active. Please log in." | AC-8 | Functional | High | Testable | – |
| REQ-09 | AQA-58 | Password fields have a Show/Hide toggle. | AC-9 | Functional | Low | Testable | – |
| REQ-10 | AQA-58 | Registration attempts are rate-limited per network. | AC-10 | Security | Medium | Needs clarification | Limit and window are not stated. "Per network" vs "per IP" in AQA-59 AC-5. Assumption (unconfirmed): 20 attempts per hour per IP, as currently coded. |
| REQ-11 | AQA-59 | The Login page has required Email address and Password fields. | AC-1 | Functional | High | Testable | – |
| REQ-12 | AQA-59 | Valid credentials log the user in, open the Dashboard and show "Welcome back, &lt;full name&gt;!". | AC-2 | Functional | High | Testable | Overlaps AQA-60 AC-2. Assumption (unconfirmed): Dashboard is the default only when no page was requested, as currently coded. |
| REQ-13 | AQA-59 | Email matching at login ignores letter case. | AC-3 | Business Rule | Medium | Testable | – |
| REQ-14 | AQA-59 | Wrong password and unknown email both show "Invalid email or password." | AC-4 | Security | High | Testable | – |
| REQ-15 | AQA-59 | Too many failed logins from one IP are blocked for a time window. | AC-5 | Security | High | Needs clarification | Limit and window not stated. Assumption (unconfirmed): 10 failed attempts per 15 minutes, as currently coded. |
| REQ-16 | AQA-59 | Logout ends the session, returns to Home and shows "You have been logged out." | AC-6 | Functional | High | Testable | – |
| REQ-17 | AQA-59 | A logged-in user opening /login or /register is redirected to the Dashboard with "You are already logged in." | AC-7 | Functional | Medium | Testable | – |
| REQ-18 | AQA-59 | While logged in, the header shows name, email, initials and a Log out button instead of Login/Register. | AC-8 | Functional | Medium | Testable | – |
| REQ-19 | AQA-60 | Anonymous visitors to /dashboard are redirected to Login with "Please log in to view that page." | AC-1 | Security | High | Testable | – |
| REQ-20 | AQA-60 | After login the user returns to the page originally requested (same-site paths only). | AC-2 | Functional | Medium | Testable | – |
| REQ-21 | AQA-60 | The Dashboard shows full name, email, status "Active" and member-since date, and never the password or hash. | AC-3 | Functional | High | Testable | – |
| REQ-22 | AQA-60 | The session cookie is HttpOnly and SameSite=Lax. | AC-4 | Security | High | Testable | – |
| REQ-23 | AQA-60 | A new session ID is issued on login. | AC-5 | Security | High | Testable | – |
| REQ-24 | AQA-60 | State-changing requests without a valid CSRF token are rejected. | AC-6 | Security | High | Testable | – |
| REQ-25 | AQA-61 | A first visit shows a banner with Accept all, Reject non-essential and Customize. | AC-1 | Functional | High | Testable | "Equally prominent" is subjective. |
| REQ-26 | AQA-61 | No optional cookie or optional script before the visitor chooses. | AC-2 | Business Rule | High | Testable | – |
| REQ-27 | AQA-61 | Accept all enables Analytics and Marketing and their cookies are set. | AC-3 | Functional | High | Testable | – |
| REQ-28 | AQA-61 | Reject non-essential keeps all optional cookies off. | AC-4 | Functional | High | Testable | – |
| REQ-29 | AQA-61 | The preferences dialog shows Strictly necessary always on and disabled, and optional categories unticked by default. | AC-5 | Business Rule | High | Testable | – |
| REQ-30 | AQA-61 | Closing the dialog without saving is not consent; the banner stays. | AC-6 | Business Rule | High | Testable | – |
| REQ-31 | AQA-61 | The choice is stored in cookie_consent for 180 days and the banner does not reappear. | AC-7 | Functional | Medium | Testable | – |
| REQ-32 | AQA-61 | Cookie Settings in the footer lets the visitor change or withdraw consent; withdrawn cookies are deleted immediately. | AC-8 | Functional | High | Testable | – |
| REQ-33 | AQA-61 | Each decision is recorded on the server anonymously. | AC-9 | Business Rule | Medium | Testable | – |
| REQ-34 | AQA-61 | A policy version change invalidates earlier consent and the banner reappears. | AC-10 | Business Rule | Medium | Testable | – |
| REQ-35 | AQA-61 | The Dashboard shows Analytics and Marketing as Allowed, Refused or Not set. | AC-11 | Functional | Low | Testable | – |
| REQ-36 | AQA-62 | The header shows navigation for the current auth state and highlights the current page. | AC-1 | Functional | Medium | Testable | "Highlighted" is not defined objectively. |
| REQ-37 | AQA-62 | On small screens a menu button opens and closes the navigation. | AC-2 | Functional | Low | Needs clarification | Breakpoint not stated. Assumption (unconfirmed): below 768 px, as currently coded. |
| REQ-38 | AQA-62 | The footer links to Privacy Policy, Cookie Policy, Terms of Use and Cookie Settings on every page. | AC-3 | Functional | Medium | Testable | – |
| REQ-39 | AQA-62 | An unknown URL shows "Page not found" with a link back to Home. | AC-4 | Functional | Medium | Testable | – |
| REQ-40 | AQA-62 | Pages are served with security headers including a strict Content Security Policy. | AC-5 | Security | Medium | Needs clarification | "Strict" not defined. |

## Business Rules and Validation Rules

- **REQ-02** (AQA-58 AC-2, Validation Rule): Full name is 2–100 characters after trimming and contains no "&lt;" or "&gt;".
- **REQ-03** (AQA-58 AC-3, Validation Rule): Email address matches name@domain.tld, has no spaces and is at most 254 characters.
- **REQ-04** (AQA-58 AC-4, Validation Rule): Password is at least 8 characters, at most 72 bytes, and has at least one letter and one number; the rule is shown as a hint.
- **REQ-05** (AQA-58 AC-5, Validation Rule): Confirm password must equal Password.
- **REQ-07** (AQA-58 AC-7, Business Rule): An already-registered email (any letter case) is rejected with "An account with this email already exists. Try logging in instead."
- **REQ-13** (AQA-59 AC-3, Business Rule): Email matching at login ignores letter case.
- **REQ-26** (AQA-61 AC-2, Business Rule): No optional cookie or optional script before the visitor chooses.
- **REQ-29** (AQA-61 AC-5, Business Rule): The preferences dialog shows Strictly necessary always on and disabled, and optional categories unticked by default.
- **REQ-30** (AQA-61 AC-6, Business Rule): Closing the dialog without saving is not consent; the banner stays.
- **REQ-33** (AQA-61 AC-9, Business Rule): Each decision is recorded on the server anonymously.
- **REQ-34** (AQA-61 AC-10, Business Rule): A policy version change invalidates earlier consent and the banner reappears.

## Positive and Negative Conditions

- **Positive:** valid registration; login with correct credentials (any email case); logout; returning to the requested page after login; Accept all / Reject / Customize consent; withdrawing consent.
- **Negative:** empty forms; invalid email; weak or mismatched password; duplicate email; wrong password; unknown email; tampered CSRF token; anonymous access to /dashboard; unknown URL; closing the consent dialog without saving.
- **Boundary:** full name 1 / 2 / 100 / 101 characters; password 7 / 8 characters and 72 / 73 bytes; email 254 / 255 characters.
- **Error cases:** too many failed logins (429); too many registrations (429); invalid consent payload (400).

## Missing or Ambiguous Requirements

- **REQ-04:** 72 bytes vs 72 characters for non-ASCII passwords.
- **REQ-07:** Conflicts with enumeration protection in AQA-59 AC-4.
- **REQ-10:** Limit and window are not stated; "per network" (AQA-58 AC-10) vs "per IP" (AQA-59 AC-5).
- **REQ-12:** Overlaps AQA-60 AC-2 (Dashboard vs originally requested page).
- **REQ-15:** Limit and window not stated.
- **REQ-25:** "Equally prominent" is subjective.
- **REQ-36:** "Highlighted" is not defined objectively.
- **REQ-37:** Breakpoint not stated.
- **REQ-40:** "Strict" not defined.
- Session expiry behaviour is not specified (code: 120 minutes).
- Behaviour when server-side consent recording fails is not specified (code: ignored; choice still applies).

## Assumptions

All assumptions are **unconfirmed** until the product owner agrees.

- **REQ-07:** Assumption (unconfirmed): the product owner accepts revealing that an email is registered, mitigated by rate limiting.
- **REQ-10:** Assumption (unconfirmed): 20 attempts per hour per IP, as currently coded.
- **REQ-12:** Assumption (unconfirmed): the Dashboard is the default destination only when no page was requested, as currently coded.
- **REQ-15:** Assumption (unconfirmed): 10 failed attempts per 15 minutes, as currently coded.
- **REQ-37:** Assumption (unconfirmed): below 768 px, as currently coded.

## Traceability Matrix

| Requirement ID | Story | Source AC |
| --- | --- | --- |
| REQ-01 | AQA-58 | AC-1 |
| REQ-02 | AQA-58 | AC-2 |
| REQ-03 | AQA-58 | AC-3 |
| REQ-04 | AQA-58 | AC-4 |
| REQ-05 | AQA-58 | AC-5 |
| REQ-06 | AQA-58 | AC-6 |
| REQ-07 | AQA-58 | AC-7 |
| REQ-08 | AQA-58 | AC-8 |
| REQ-09 | AQA-58 | AC-9 |
| REQ-10 | AQA-58 | AC-10 |
| REQ-11 | AQA-59 | AC-1 |
| REQ-12 | AQA-59 | AC-2 |
| REQ-13 | AQA-59 | AC-3 |
| REQ-14 | AQA-59 | AC-4 |
| REQ-15 | AQA-59 | AC-5 |
| REQ-16 | AQA-59 | AC-6 |
| REQ-17 | AQA-59 | AC-7 |
| REQ-18 | AQA-59 | AC-8 |
| REQ-19 | AQA-60 | AC-1 |
| REQ-20 | AQA-60 | AC-2 |
| REQ-21 | AQA-60 | AC-3 |
| REQ-22 | AQA-60 | AC-4 |
| REQ-23 | AQA-60 | AC-5 |
| REQ-24 | AQA-60 | AC-6 |
| REQ-25 | AQA-61 | AC-1 |
| REQ-26 | AQA-61 | AC-2 |
| REQ-27 | AQA-61 | AC-3 |
| REQ-28 | AQA-61 | AC-4 |
| REQ-29 | AQA-61 | AC-5 |
| REQ-30 | AQA-61 | AC-6 |
| REQ-31 | AQA-61 | AC-7 |
| REQ-32 | AQA-61 | AC-8 |
| REQ-33 | AQA-61 | AC-9 |
| REQ-34 | AQA-61 | AC-10 |
| REQ-35 | AQA-61 | AC-11 |
| REQ-36 | AQA-62 | AC-1 |
| REQ-37 | AQA-62 | AC-2 |
| REQ-38 | AQA-62 | AC-3 |
| REQ-39 | AQA-62 | AC-4 |
| REQ-40 | AQA-62 | AC-5 |
