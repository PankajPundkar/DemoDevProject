# Requirements Package – DemoSite

> **Agent:** Requirements Agent (`mcp-qa-lab/.github/agents/requirements-agent.agent.md`) · **Date:** 2026-11-13
> **Input:** draft stories `qa/01-user-stories.md`, review `qa/02-story-review.md`. Stories are not yet in Jira (see the deviation note in the review).
> A machine-readable copy for the Test Design Agent is in `qa/03-requirements.json`.

## Story Information

| Story key | Summary | Source |
| --- | --- | --- |
| DRAFT-1 | User registration | qa/01-user-stories.md (draft) |
| DRAFT-2 | User login and logout | qa/01-user-stories.md (draft) |
| DRAFT-3 | Protected dashboard and session security | qa/01-user-stories.md (draft) |
| DRAFT-4 | GDPR cookie consent | qa/01-user-stories.md (draft) |
| DRAFT-5 | Site navigation, legal pages and error pages | qa/01-user-stories.md (draft) |

## Requirement Summary

| Requirement ID | Story | Requirement Description | Source AC | Requirement Type | Priority | Testability | Ambiguities and Assumptions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-01 | DRAFT-1 | The Register page shows Full name, Email address, Password and Confirm password; all are required. | AC-1 | Functional | High | Testable | – |
| REQ-02 | DRAFT-1 | Full name is 2–100 characters after trimming and contains no "&lt;" or "&gt;". | AC-2 | Validation Rule | High | Testable | – |
| REQ-03 | DRAFT-1 | Email address matches name@domain.tld, has no spaces and is at most 254 characters. | AC-3 | Validation Rule | High | Testable | – |
| REQ-04 | DRAFT-1 | Password is at least 8 characters, at most 72 bytes, and has at least one letter and one number; the rule is shown as a hint. | AC-4 | Validation Rule | High | Testable | 72 bytes vs 72 characters for non-ASCII passwords. |
| REQ-05 | DRAFT-1 | Confirm password must equal Password. | AC-5 | Validation Rule | High | Testable | – |
| REQ-06 | DRAFT-1 | The server re-validates every registration field independently of browser validation. | AC-6 | Security | High | Testable | – |
| REQ-07 | DRAFT-1 | An already-registered email (any letter case) is rejected with "An account with this email already exists. Try logging in instead." | AC-7 | Business Rule | High | Needs clarification | Conflicts with enumeration protection in DRAFT-2 AC-4. Assumption (unconfirmed): the product owner accepts revealing that an email is registered, mitigated by rate limiting. |
| REQ-08 | DRAFT-1 | Successful registration creates an active account, redirects to Login and shows "Your account has been created and is active. Please log in." | AC-8 | Functional | High | Testable | – |
| REQ-09 | DRAFT-1 | Password fields have a Show/Hide toggle. | AC-9 | Functional | Low | Testable | – |
| REQ-10 | DRAFT-1 | Registration attempts are rate-limited per network. | AC-10 | Security | Medium | Needs clarification | Limit and window are not stated. Assumption (unconfirmed): 20 attempts per hour per IP, as currently coded. |
| REQ-11 | DRAFT-2 | The Login page has required Email address and Password fields. | AC-1 | Functional | High | Testable | – |
| REQ-12 | DRAFT-2 | Valid credentials log the user in, open the Dashboard and show "Welcome back, &lt;full name&gt;!". | AC-2 | Functional | High | Testable | – |
| REQ-13 | DRAFT-2 | Email matching at login ignores letter case. | AC-3 | Business Rule | Medium | Testable | – |
| REQ-14 | DRAFT-2 | Wrong password and unknown email both show "Invalid email or password." | AC-4 | Security | High | Testable | – |
| REQ-15 | DRAFT-2 | Too many failed logins from one IP are blocked for a time window. | AC-5 | Security | High | Needs clarification | Limit and window not stated. Assumption (unconfirmed): 10 failed attempts per 15 minutes, as currently coded. |
| REQ-16 | DRAFT-2 | Logout ends the session, returns to Home and shows "You have been logged out." | AC-6 | Functional | High | Testable | – |
| REQ-17 | DRAFT-2 | A logged-in user opening /login or /register is redirected to the Dashboard with "You are already logged in." | AC-7 | Functional | Medium | Testable | – |
| REQ-18 | DRAFT-2 | While logged in, the header shows name, email, initials and a Log out button instead of Login/Register. | AC-8 | Functional | Medium | Testable | – |
| REQ-19 | DRAFT-3 | Anonymous visitors to /dashboard are redirected to Login with "Please log in to view that page." | AC-1 | Security | High | Testable | – |
| REQ-20 | DRAFT-3 | After login the user returns to the page originally requested (same-site paths only). | AC-2 | Functional | Medium | Testable | – |
| REQ-21 | DRAFT-3 | The Dashboard shows full name, email, status "Active" and member-since date, and never the password or hash. | AC-3 | Functional | High | Testable | – |
| REQ-22 | DRAFT-3 | The session cookie is HttpOnly and SameSite=Lax. | AC-4 | Security | High | Testable | – |
| REQ-23 | DRAFT-3 | A new session ID is issued on login. | AC-5 | Security | High | Testable | – |
| REQ-24 | DRAFT-3 | State-changing requests without a valid CSRF token are rejected. | AC-6 | Security | High | Testable | – |
| REQ-25 | DRAFT-4 | A first visit shows a banner with Accept all, Reject non-essential and Customize. | AC-1 | Functional | High | Testable | "Equally prominent" is subjective. |
| REQ-26 | DRAFT-4 | No optional cookie or optional script before the visitor chooses. | AC-2 | Business Rule | High | Testable | – |
| REQ-27 | DRAFT-4 | Accept all enables Analytics and Marketing and their cookies are set. | AC-3 | Functional | High | Testable | – |
| REQ-28 | DRAFT-4 | Reject non-essential keeps all optional cookies off. | AC-4 | Functional | High | Testable | – |
| REQ-29 | DRAFT-4 | The preferences dialog shows Strictly necessary always on and disabled, and optional categories unticked by default. | AC-5 | Business Rule | High | Testable | – |
| REQ-30 | DRAFT-4 | Closing the dialog without saving is not consent; the banner stays. | AC-6 | Business Rule | High | Testable | – |
| REQ-31 | DRAFT-4 | The choice is stored in cookie_consent for 180 days and the banner does not reappear. | AC-7 | Functional | Medium | Testable | – |
| REQ-32 | DRAFT-4 | Cookie Settings in the footer lets the visitor change or withdraw consent; withdrawn cookies are deleted immediately. | AC-8 | Functional | High | Testable | – |
| REQ-33 | DRAFT-4 | Each decision is recorded on the server anonymously. | AC-9 | Business Rule | Medium | Testable | – |
| REQ-34 | DRAFT-4 | A policy version change invalidates earlier consent and the banner reappears. | AC-10 | Business Rule | Medium | Testable | – |
| REQ-35 | DRAFT-4 | The Dashboard shows Analytics and Marketing as Allowed, Refused or Not set. | AC-11 | Functional | Low | Testable | – |
| REQ-36 | DRAFT-5 | The header shows navigation for the current auth state and highlights the current page. | AC-1 | Functional | Medium | Testable | – |
| REQ-37 | DRAFT-5 | On small screens a menu button opens and closes the navigation. | AC-2 | Functional | Low | Needs clarification | Breakpoint not stated. Assumption (unconfirmed): below 768 px, as currently coded. |
| REQ-38 | DRAFT-5 | The footer links to Privacy Policy, Cookie Policy, Terms of Use and Cookie Settings on every page. | AC-3 | Functional | Medium | Testable | – |
| REQ-39 | DRAFT-5 | An unknown URL shows "Page not found" with a link back to Home. | AC-4 | Functional | Medium | Testable | – |
| REQ-40 | DRAFT-5 | Pages are served with security headers including a strict Content Security Policy. | AC-5 | Security | Medium | Needs clarification | "Strict" not defined. |

## Business Rules and Validation Rules

- **REQ-02** (DRAFT-1 AC-2, Validation Rule): Full name is 2–100 characters after trimming and contains no "&lt;" or "&gt;".
- **REQ-03** (DRAFT-1 AC-3, Validation Rule): Email address matches name@domain.tld, has no spaces and is at most 254 characters.
- **REQ-04** (DRAFT-1 AC-4, Validation Rule): Password is at least 8 characters, at most 72 bytes, and has at least one letter and one number; the rule is shown as a hint.
- **REQ-05** (DRAFT-1 AC-5, Validation Rule): Confirm password must equal Password.
- **REQ-07** (DRAFT-1 AC-7, Business Rule): An already-registered email (any letter case) is rejected with "An account with this email already exists. Try logging in instead."
- **REQ-13** (DRAFT-2 AC-3, Business Rule): Email matching at login ignores letter case.
- **REQ-26** (DRAFT-4 AC-2, Business Rule): No optional cookie or optional script before the visitor chooses.
- **REQ-29** (DRAFT-4 AC-5, Business Rule): The preferences dialog shows Strictly necessary always on and disabled, and optional categories unticked by default.
- **REQ-30** (DRAFT-4 AC-6, Business Rule): Closing the dialog without saving is not consent; the banner stays.
- **REQ-33** (DRAFT-4 AC-9, Business Rule): Each decision is recorded on the server anonymously.
- **REQ-34** (DRAFT-4 AC-10, Business Rule): A policy version change invalidates earlier consent and the banner reappears.

## Positive and Negative Conditions

- **Positive:** valid registration; login with correct credentials (any email case); logout; returning to the requested page after login; Accept all / Reject / Customize consent; withdrawing consent.
- **Negative:** empty forms; invalid email; weak or mismatched password; duplicate email; wrong password; unknown email; tampered CSRF token; anonymous access to /dashboard; unknown URL; closing the consent dialog without saving.
- **Boundary:** full name 1 / 2 / 100 / 101 characters; password 7 / 8 characters and 72 / 73 bytes; email 254 / 255 characters.
- **Error cases:** too many failed logins (429); too many registrations (429); invalid consent payload (400).

## Missing or Ambiguous Requirements

- **REQ-04:** 72 bytes vs 72 characters for non-ASCII passwords.
- **REQ-07:** Conflicts with enumeration protection in DRAFT-2 AC-4.
- **REQ-10:** Limit and window are not stated.
- **REQ-15:** Limit and window not stated.
- **REQ-25:** "Equally prominent" is subjective.
- **REQ-37:** Breakpoint not stated.
- **REQ-40:** "Strict" not defined.
- Session expiry behaviour is not specified (code: 120 minutes).
- Behaviour when server-side consent recording fails is not specified (code: ignored; choice still applies).

## Assumptions

All assumptions are **unconfirmed** until the product owner agrees.

- **REQ-07:** Assumption (unconfirmed): the product owner accepts revealing that an email is registered, mitigated by rate limiting.
- **REQ-10:** Assumption (unconfirmed): 20 attempts per hour per IP, as currently coded.
- **REQ-15:** Assumption (unconfirmed): 10 failed attempts per 15 minutes, as currently coded.
- **REQ-37:** Assumption (unconfirmed): below 768 px, as currently coded.

## Traceability Matrix

| Requirement ID | Story | Source AC |
| --- | --- | --- |
| REQ-01 | DRAFT-1 | AC-1 |
| REQ-02 | DRAFT-1 | AC-2 |
| REQ-03 | DRAFT-1 | AC-3 |
| REQ-04 | DRAFT-1 | AC-4 |
| REQ-05 | DRAFT-1 | AC-5 |
| REQ-06 | DRAFT-1 | AC-6 |
| REQ-07 | DRAFT-1 | AC-7 |
| REQ-08 | DRAFT-1 | AC-8 |
| REQ-09 | DRAFT-1 | AC-9 |
| REQ-10 | DRAFT-1 | AC-10 |
| REQ-11 | DRAFT-2 | AC-1 |
| REQ-12 | DRAFT-2 | AC-2 |
| REQ-13 | DRAFT-2 | AC-3 |
| REQ-14 | DRAFT-2 | AC-4 |
| REQ-15 | DRAFT-2 | AC-5 |
| REQ-16 | DRAFT-2 | AC-6 |
| REQ-17 | DRAFT-2 | AC-7 |
| REQ-18 | DRAFT-2 | AC-8 |
| REQ-19 | DRAFT-3 | AC-1 |
| REQ-20 | DRAFT-3 | AC-2 |
| REQ-21 | DRAFT-3 | AC-3 |
| REQ-22 | DRAFT-3 | AC-4 |
| REQ-23 | DRAFT-3 | AC-5 |
| REQ-24 | DRAFT-3 | AC-6 |
| REQ-25 | DRAFT-4 | AC-1 |
| REQ-26 | DRAFT-4 | AC-2 |
| REQ-27 | DRAFT-4 | AC-3 |
| REQ-28 | DRAFT-4 | AC-4 |
| REQ-29 | DRAFT-4 | AC-5 |
| REQ-30 | DRAFT-4 | AC-6 |
| REQ-31 | DRAFT-4 | AC-7 |
| REQ-32 | DRAFT-4 | AC-8 |
| REQ-33 | DRAFT-4 | AC-9 |
| REQ-34 | DRAFT-4 | AC-10 |
| REQ-35 | DRAFT-4 | AC-11 |
| REQ-36 | DRAFT-5 | AC-1 |
| REQ-37 | DRAFT-5 | AC-2 |
| REQ-38 | DRAFT-5 | AC-3 |
| REQ-39 | DRAFT-5 | AC-4 |
| REQ-40 | DRAFT-5 | AC-5 |
