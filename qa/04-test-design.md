# Test Design – DemoSite

> **Agent:** Test Design Agent (`mcp-qa-lab/.github/agents/test-design-agent.agent.md`) · **Workflow B** (requirements-based) · **Date:** 2026-11-13
> **Input:** `qa/03-requirements.json`. REQ IDs are reused from the Requirements Agent.
> **Status:** proposed for human review. Every scenario below is also automated in `e2e/specs/` and tagged with its scenario ID.

## 1. Requirement Analysis

| Requirement ID | Requirement | Testability | Observation |
| --- | --- | --- | --- |
| REQ-01 | The Register page shows Full name, Email address, Password and Confirm password; all are required. | Testable | Covered by TS-001, TS-002 |
| REQ-02 | Full name is 2–100 characters after trimming and contains no "&lt;" or "&gt;". | Testable | Covered by TS-008, TS-009 |
| REQ-03 | Email address matches name@domain.tld, has no spaces and is at most 254 characters. | Testable | Covered by TS-003 |
| REQ-04 | Password is at least 8 characters, at most 72 bytes, and has at least one letter and one number; the rule is shown as a hint. | Testable | Covered by TS-004, TS-005, TS-006 |
| REQ-05 | Confirm password must equal Password. | Testable | Covered by TS-007 |
| REQ-06 | The server re-validates every registration field independently of browser validation. | Testable | Covered by TS-011 |
| REQ-07 | An already-registered email (any letter case) is rejected with "An account with this email already exists. Try logging in instead." | Needs clarification | Covered by TS-010 |
| REQ-08 | Successful registration creates an active account, redirects to Login and shows "Your account has been created and is active. Please log in." | Testable | Covered by TS-001 |
| REQ-09 | Password fields have a Show/Hide toggle. | Testable | Covered by TS-012 |
| REQ-10 | Registration attempts are rate-limited per network. | Needs clarification | Not covered – see gaps |
| REQ-11 | The Login page has required Email address and Password fields. | Testable | Covered by TS-017 |
| REQ-12 | Valid credentials log the user in, open the Dashboard and show "Welcome back, &lt;full name&gt;!". | Testable | Covered by TS-013 |
| REQ-13 | Email matching at login ignores letter case. | Testable | Covered by TS-014 |
| REQ-14 | Wrong password and unknown email both show "Invalid email or password." | Testable | Covered by TS-015, TS-016 |
| REQ-15 | Too many failed logins from one IP are blocked for a time window. | Needs clarification | Covered by existing integration test only |
| REQ-16 | Logout ends the session, returns to Home and shows "You have been logged out." | Testable | Covered by TS-018 |
| REQ-17 | A logged-in user opening /login or /register is redirected to the Dashboard with "You are already logged in." | Testable | Covered by TS-019 |
| REQ-18 | While logged in, the header shows name, email, initials and a Log out button instead of Login/Register. | Testable | Covered by TS-013 |
| REQ-19 | Anonymous visitors to /dashboard are redirected to Login with "Please log in to view that page." | Testable | Covered by TS-020 |
| REQ-20 | After login the user returns to the page originally requested (same-site paths only). | Testable | Covered by TS-020 |
| REQ-21 | The Dashboard shows full name, email, status "Active" and member-since date, and never the password or hash. | Testable | Covered by TS-021 |
| REQ-22 | The session cookie is HttpOnly and SameSite=Lax. | Testable | Covered by TS-022 |
| REQ-23 | A new session ID is issued on login. | Testable | Covered by TS-023 |
| REQ-24 | State-changing requests without a valid CSRF token are rejected. | Testable | Covered by TS-024 |
| REQ-25 | A first visit shows a banner with Accept all, Reject non-essential and Customize. | Testable | Covered by TS-025 |
| REQ-26 | No optional cookie or optional script before the visitor chooses. | Testable | Covered by TS-025 |
| REQ-27 | Accept all enables Analytics and Marketing and their cookies are set. | Testable | Covered by TS-026 |
| REQ-28 | Reject non-essential keeps all optional cookies off. | Testable | Covered by TS-027 |
| REQ-29 | The preferences dialog shows Strictly necessary always on and disabled, and optional categories unticked by default. | Testable | Covered by TS-028 |
| REQ-30 | Closing the dialog without saving is not consent; the banner stays. | Testable | Covered by TS-029 |
| REQ-31 | The choice is stored in cookie_consent for 180 days and the banner does not reappear. | Testable | Covered by TS-026 |
| REQ-32 | Cookie Settings in the footer lets the visitor change or withdraw consent; withdrawn cookies are deleted immediately. | Testable | Covered by TS-030 |
| REQ-33 | Each decision is recorded on the server anonymously. | Testable | Covered by TS-026 |
| REQ-34 | A policy version change invalidates earlier consent and the banner reappears. | Testable | Covered by TS-031 |
| REQ-35 | The Dashboard shows Analytics and Marketing as Allowed, Refused or Not set. | Testable | Covered by TS-032 |
| REQ-36 | The header shows navigation for the current auth state and highlights the current page. | Testable | Covered by TS-033 |
| REQ-37 | On small screens a menu button opens and closes the navigation. | Needs clarification | Covered by TS-036 |
| REQ-38 | The footer links to Privacy Policy, Cookie Policy, Terms of Use and Cookie Settings on every page. | Testable | Covered by TS-034 |
| REQ-39 | An unknown URL shows "Page not found" with a link back to Home. | Testable | Covered by TS-035 |
| REQ-40 | Pages are served with security headers including a strict Content Security Policy. | Needs clarification | Covered by existing integration test only |

## 2. Existing Test Coverage

**Xray:** the Xray MCP server is not connected in this session, so existing Xray tests could **not** be searched. Run `search_xray_tests` before creating tests (see `qa/05-xray-creation-preview.md`).

**Automated (repository):** the existing integration suite already covers:

| Existing test | Requirement | Existing Coverage |
| --- | --- | --- |
| tests/app.test.ts › registration › validates fields on the server | REQ-06 | Server-level (HTTP), not browser |
| tests/app.test.ts › registration › enforces letter + number in passwords | REQ-04 | Server-level (HTTP), not browser |
| tests/app.test.ts › registration › prevents duplicate registrations (case-insensitive) | REQ-07 | Server-level (HTTP), not browser |
| tests/app.test.ts › login › uses the same generic error for wrong password and unknown email | REQ-14 | Server-level (HTTP), not browser |
| tests/app.test.ts › login throttling › blocks after too many failed attempts | REQ-15 | Server-level (HTTP), not browser |
| tests/app.test.ts › access control › rejects state-changing requests without a CSRF token | REQ-24 | Server-level (HTTP), not browser |
| tests/app.test.ts › cookie consent API › records a valid consent decision without personal data | REQ-33 | Server-level (HTTP), not browser |
| tests/app.test.ts › public pages › sets security headers and a strict CSP | REQ-40 | Server-level (HTTP), not browser |
| tests/app.test.ts › public pages › never pre-ticks optional cookie categories | REQ-29 | Server-level (HTTP), not browser |

## 3. Proposed Test Scenarios

| Scenario ID | Story | Category | Scenario Title | Priority | Requirement Reference | Automated in |
| --- | --- | --- | --- | --- | --- | --- |
| TS-001 | DRAFT-1 | Positive | Register with valid details | High | REQ-01, REQ-08 | `e2e/specs/registration.spec.ts` |
| TS-002 | DRAFT-1 | Negative | Submit an empty registration form | High | REQ-01 | `e2e/specs/registration.spec.ts` |
| TS-003 | DRAFT-1 | Validation | Reject an invalid email format | Medium | REQ-03 | `e2e/specs/registration.spec.ts` |
| TS-004 | DRAFT-1 | Boundary | Reject a 7-character password | High | REQ-04 | `e2e/specs/registration.spec.ts` |
| TS-005 | DRAFT-1 | Boundary | Accept an 8-character password | High | REQ-04 | `e2e/specs/registration.spec.ts` |
| TS-006 | DRAFT-1 | Validation | Reject a password without a number | Medium | REQ-04 | `e2e/specs/registration.spec.ts` |
| TS-007 | DRAFT-1 | Validation | Reject a confirm password that does not match | High | REQ-05 | `e2e/specs/registration.spec.ts` |
| TS-008 | DRAFT-1 | Security | Reject a full name containing &lt; or &gt; | Medium | REQ-02 | `e2e/specs/registration.spec.ts` |
| TS-009 | DRAFT-1 | Boundary | Reject a 1-character full name | Medium | REQ-02 | `e2e/specs/registration.spec.ts` |
| TS-010 | DRAFT-1 | Negative | Reject an already-registered email in different letter case | High | REQ-07 | `e2e/specs/registration.spec.ts` |
| TS-011 | DRAFT-1 | Security | Server rejects invalid input when browser validation is off | High | REQ-06 | `e2e/specs/registration.spec.ts` |
| TS-012 | DRAFT-1 | Positive | Show and hide the password | Low | REQ-09 | `e2e/specs/registration.spec.ts` |
| TS-013 | DRAFT-2 | Positive | Log in with valid credentials | High | REQ-12, REQ-18 | `e2e/specs/login-logout.spec.ts` |
| TS-014 | DRAFT-2 | Positive | Log in with the email in different letter case | Medium | REQ-13 | `e2e/specs/login-logout.spec.ts` |
| TS-015 | DRAFT-2 | Negative | Wrong password shows a generic error | High | REQ-14 | `e2e/specs/login-logout.spec.ts` |
| TS-016 | DRAFT-2 | Security | Unknown email shows the same generic error | High | REQ-14 | `e2e/specs/login-logout.spec.ts` |
| TS-017 | DRAFT-2 | Negative | Submit an empty login form | Medium | REQ-11 | `e2e/specs/login-logout.spec.ts` |
| TS-018 | DRAFT-2 | Positive | Log out | High | REQ-16 | `e2e/specs/login-logout.spec.ts` |
| TS-019 | DRAFT-2 | Positive | Logged-in user cannot open Login or Register | Medium | REQ-17 | `e2e/specs/login-logout.spec.ts` |
| TS-020 | DRAFT-3 | Security | Anonymous dashboard access redirects to Login and back | High | REQ-19, REQ-20 | `e2e/specs/dashboard-session.spec.ts` |
| TS-021 | DRAFT-3 | Positive | Dashboard shows the profile without sensitive data | High | REQ-21 | `e2e/specs/dashboard-session.spec.ts` |
| TS-022 | DRAFT-3 | Security | Session cookie is HttpOnly and SameSite=Lax | High | REQ-22 | `e2e/specs/dashboard-session.spec.ts` |
| TS-023 | DRAFT-3 | Security | Session ID changes on login | High | REQ-23 | `e2e/specs/dashboard-session.spec.ts` |
| TS-024 | DRAFT-3 | Security | Login with a tampered CSRF token is blocked | High | REQ-24 | `e2e/specs/dashboard-session.spec.ts` |
| TS-025 | DRAFT-4 | Positive | First visit shows the banner and sets no optional cookies | High | REQ-25, REQ-26 | `e2e/specs/cookie-consent.spec.ts` |
| TS-026 | DRAFT-4 | Positive | Accept all cookies | High | REQ-27, REQ-31, REQ-33 | `e2e/specs/cookie-consent.spec.ts` |
| TS-027 | DRAFT-4 | Positive | Reject non-essential cookies | High | REQ-28 | `e2e/specs/cookie-consent.spec.ts` |
| TS-028 | DRAFT-4 | Positive | Customize: allow analytics only | High | REQ-29 | `e2e/specs/cookie-consent.spec.ts` |
| TS-029 | DRAFT-4 | Negative | Closing the dialog is not consent | High | REQ-30 | `e2e/specs/cookie-consent.spec.ts` |
| TS-030 | DRAFT-4 | Positive | Withdraw consent via Cookie Settings | High | REQ-32 | `e2e/specs/cookie-consent.spec.ts` |
| TS-031 | DRAFT-4 | Positive | Outdated policy version shows the banner again | Medium | REQ-34 | `e2e/specs/cookie-consent.spec.ts` |
| TS-032 | DRAFT-4 | Positive | Dashboard shows the current consent choice | Low | REQ-35 | `e2e/specs/cookie-consent.spec.ts` |
| TS-033 | DRAFT-5 | Positive | Guest header navigation | Medium | REQ-36 | `e2e/specs/navigation.spec.ts` |
| TS-034 | DRAFT-5 | Positive | Footer legal links open the legal pages | Medium | REQ-38 | `e2e/specs/navigation.spec.ts` |
| TS-035 | DRAFT-5 | Negative | Unknown URL shows the 404 page | Medium | REQ-39 | `e2e/specs/navigation.spec.ts` |
| TS-036 | DRAFT-5 | Positive | Mobile menu opens and closes | Low | REQ-37 | `e2e/specs/navigation.spec.ts` |

## 4. Detailed Test Cases

### TS-001 – Register with valid details

**Category:** Positive · **Priority:** High · **Jira Story:** DRAFT-1 · **Acceptance Criterion:** AC-1, AC-8 · **Requirement ID:** REQ-01, REQ-08 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** The email is not registered.

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /register | None | Register page shows Full name, Email address, Password and Confirm password |
| 2 | Fill all fields and click Create account | Unique generated user, e.g. "Ada Lovelace" / e2e-&lt;id&gt;@example.com / Passw0rd! | User is redirected to /login |
| 3 | Check the message on the Login page | None | "Your account has been created and is active. Please log in." is shown |
| 4 | Log in with the new credentials | Same credentials | Dashboard opens (account is active immediately) |

### TS-002 – Submit an empty registration form

**Category:** Negative · **Priority:** High · **Jira Story:** DRAFT-1 · **Acceptance Criterion:** AC-1 · **Requirement ID:** REQ-01 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** None (any visitor).

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /register and click Create account without filling anything | All fields empty | Form is not submitted; URL stays /register |
| 2 | Check the field errors | None | "Full name is required.", "Email address is required.", "Password is required." and "Please confirm your password." are shown, and each field is marked invalid |

### TS-003 – Reject an invalid email format

**Category:** Validation · **Priority:** Medium · **Jira Story:** DRAFT-1 · **Acceptance Criterion:** AC-3 · **Requirement ID:** REQ-03 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** None (any visitor).

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /register and enter an invalid email, then leave the field | ada@example | "Enter a valid email address." is shown |

### TS-004 – Reject a 7-character password

**Category:** Boundary · **Priority:** High · **Jira Story:** DRAFT-1 · **Acceptance Criterion:** AC-4 · **Requirement ID:** REQ-04 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** None (any visitor).

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /register and enter a 7-character password, then leave the field | abc1234 | "Password must be at least 8 characters." is shown |

### TS-005 – Accept an 8-character password

**Category:** Boundary · **Priority:** High · **Jira Story:** DRAFT-1 · **Acceptance Criterion:** AC-4 · **Requirement ID:** REQ-04 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** The email is not registered.

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Register with an 8-character password containing a letter and a number | abcdefg1 | Account is created and the user is redirected to /login |

### TS-006 – Reject a password without a number

**Category:** Validation · **Priority:** Medium · **Jira Story:** DRAFT-1 · **Acceptance Criterion:** AC-4 · **Requirement ID:** REQ-04 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** None (any visitor).

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /register and enter a letters-only password, then leave the field | abcdefgh | "Password must contain at least one letter and one number." is shown |

### TS-007 – Reject a confirm password that does not match

**Category:** Validation · **Priority:** High · **Jira Story:** DRAFT-1 · **Acceptance Criterion:** AC-5 · **Requirement ID:** REQ-05 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** None (any visitor).

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Enter a valid password and a different confirmation, then leave the field | Passw0rd! / Passw0rd? | "Passwords do not match." is shown |

### TS-008 – Reject a full name containing &lt; or &gt;

**Category:** Security · **Priority:** Medium · **Jira Story:** DRAFT-1 · **Acceptance Criterion:** AC-2 · **Requirement ID:** REQ-02 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** None (any visitor).

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Enter a full name containing angle brackets, then leave the field | &lt;b&gt;Ada&lt;/b&gt; | "Full name contains invalid characters." is shown |

### TS-009 – Reject a 1-character full name

**Category:** Boundary · **Priority:** Medium · **Jira Story:** DRAFT-1 · **Acceptance Criterion:** AC-2 · **Requirement ID:** REQ-02 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** None (any visitor).

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Enter a 1-character full name, then leave the field | A | "Full name must be between 2 and 100 characters." is shown |

### TS-010 – Reject an already-registered email in different letter case

**Category:** Negative · **Priority:** High · **Jira Story:** DRAFT-1 · **Acceptance Criterion:** AC-7 · **Requirement ID:** REQ-07 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** Registered user created in a precondition

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Register again with the same email in upper case | Same email, upper case | Registration fails; "We could not create your account." is shown |
| 2 | Check the email field error | None | "An account with this email already exists. Try logging in instead." is shown |

### TS-011 – Server rejects invalid input when browser validation is off

**Category:** Security · **Priority:** High · **Jira Story:** DRAFT-1 · **Acceptance Criterion:** AC-6 · **Requirement ID:** REQ-06 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** JavaScript is disabled in the browser.

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /register and submit invalid data | Name "A", email "bad", password "short" | Server returns the Register page with "Please correct the highlighted fields." |
| 2 | Check the field errors | None | Server-side errors are shown for Full name, Email address, Password and Confirm password |

### TS-012 – Show and hide the password

**Category:** Positive · **Priority:** Low · **Jira Story:** DRAFT-1 · **Acceptance Criterion:** AC-9 · **Requirement ID:** REQ-09 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** None (any visitor).

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Type a password and click Show | Passw0rd! | Password is visible as text; button reads Hide |
| 2 | Click Hide | None | Password is masked again; button reads Show |

### TS-013 – Log in with valid credentials

**Category:** Positive · **Priority:** High · **Jira Story:** DRAFT-2 · **Acceptance Criterion:** AC-2, AC-8 · **Requirement ID:** REQ-12, REQ-18 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** Registered user created in a precondition

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /login and enter valid credentials, click Log in | Registered email and password | Dashboard opens |
| 2 | Check the message and header | None | "Welcome back, &lt;full name&gt;!" is shown; header shows name, email, initials and Log out; Login/Register links are gone |

### TS-014 – Log in with the email in different letter case

**Category:** Positive · **Priority:** Medium · **Jira Story:** DRAFT-2 · **Acceptance Criterion:** AC-3 · **Requirement ID:** REQ-13 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** Registered user created in a precondition

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Log in with the email in upper case | Upper-case email, correct password | Dashboard opens |

### TS-015 – Wrong password shows a generic error

**Category:** Negative · **Priority:** High · **Jira Story:** DRAFT-2 · **Acceptance Criterion:** AC-4 · **Requirement ID:** REQ-14 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** Registered user created in a precondition

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Log in with a wrong password | Registered email, WrongPass1 | "Invalid email or password." is shown; user stays on /login |

### TS-016 – Unknown email shows the same generic error

**Category:** Security · **Priority:** High · **Jira Story:** DRAFT-2 · **Acceptance Criterion:** AC-4 · **Requirement ID:** REQ-14 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** None (any visitor).

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Log in with an email that is not registered | nobody-&lt;id&gt;@example.com, Passw0rd! | The exact same "Invalid email or password." message is shown |

### TS-017 – Submit an empty login form

**Category:** Negative · **Priority:** Medium · **Jira Story:** DRAFT-2 · **Acceptance Criterion:** AC-1 · **Requirement ID:** REQ-11 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** None (any visitor).

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /login and click Log in without filling anything | All fields empty | "Email address is required." and "Password is required." are shown; URL stays /login |

### TS-018 – Log out

**Category:** Positive · **Priority:** High · **Jira Story:** DRAFT-2 · **Acceptance Criterion:** AC-6 · **Requirement ID:** REQ-16 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** User is logged in.

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Click Log out in the header | None | Home opens with "You have been logged out." |
| 2 | Check the header | None | Login and Register links are shown again |
| 3 | Open /dashboard | None | User is redirected to /login |

### TS-019 – Logged-in user cannot open Login or Register

**Category:** Positive · **Priority:** Medium · **Jira Story:** DRAFT-2 · **Acceptance Criterion:** AC-7 · **Requirement ID:** REQ-17 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** User is logged in.

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /login | None | Redirected to /dashboard with "You are already logged in." |
| 2 | Open /register | None | Redirected to /dashboard |

### TS-020 – Anonymous dashboard access redirects to Login and back

**Category:** Security · **Priority:** High · **Jira Story:** DRAFT-3 · **Acceptance Criterion:** AC-1, AC-2 · **Requirement ID:** REQ-19, REQ-20 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** Registered user created in a precondition User is logged out.

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /dashboard | None | Redirected to /login with "Please log in to view that page." |
| 2 | Log in | Registered credentials | User lands on /dashboard (the page originally requested) |

### TS-021 – Dashboard shows the profile without sensitive data

**Category:** Positive · **Priority:** High · **Jira Story:** DRAFT-3 · **Acceptance Criterion:** AC-3 · **Requirement ID:** REQ-21 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** User is logged in.

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /dashboard | None | Full name, email (lower case), status "Active" and member-since date are shown |
| 2 | Inspect the page content | None | No password, password hash or "passwordHash" text appears |

### TS-022 – Session cookie is HttpOnly and SameSite=Lax

**Category:** Security · **Priority:** High · **Jira Story:** DRAFT-3 · **Acceptance Criterion:** AC-4 · **Requirement ID:** REQ-22 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** User is logged in.

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Inspect the "sid" cookie | None | Cookie is HttpOnly, SameSite=Lax, path "/" |
| 2 | Read document.cookie in the page | None | "sid" is not readable by scripts |

### TS-023 – Session ID changes on login

**Category:** Security · **Priority:** High · **Jira Story:** DRAFT-3 · **Acceptance Criterion:** AC-5 · **Requirement ID:** REQ-23 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** Registered user created in a precondition

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /login and note the "sid" cookie value | None | A "sid" cookie exists |
| 2 | Log in | Registered credentials | The "sid" cookie value is different from before |

### TS-024 – Login with a tampered CSRF token is blocked

**Category:** Security · **Priority:** High · **Jira Story:** DRAFT-3 · **Acceptance Criterion:** AC-6 · **Requirement ID:** REQ-24 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** Registered user created in a precondition

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /login and change the hidden _csrf value | tampered-token | None |
| 2 | Submit valid credentials | Registered credentials | 403 "Request blocked" page is shown; user is not logged in |

### TS-025 – First visit shows the banner and sets no optional cookies

**Category:** Positive · **Priority:** High · **Jira Story:** DRAFT-4 · **Acceptance Criterion:** AC-1, AC-2 · **Requirement ID:** REQ-25, REQ-26 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** Fresh browser with no cookies.

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open the Home page | None | Banner "Your privacy choices" shows Reject non-essential, Accept all and Customize |
| 2 | Inspect cookies and loaded scripts | None | No cookie_consent, _demo_analytics or _demo_marketing cookie; no /js/vendor/ script is loaded |

### TS-026 – Accept all cookies

**Category:** Positive · **Priority:** High · **Jira Story:** DRAFT-4 · **Acceptance Criterion:** AC-3, AC-7, AC-9 · **Requirement ID:** REQ-27, REQ-31, REQ-33 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** Fresh browser with no cookies.

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Click Accept all | None | Banner closes; POST /api/consent returns 204 |
| 2 | Inspect cookies | None | cookie_consent has analytics=true and marketing=true and expires in about 180 days; _demo_analytics and _demo_marketing are set |
| 3 | Open another page | /privacy | Banner is not shown again |

### TS-027 – Reject non-essential cookies

**Category:** Positive · **Priority:** High · **Jira Story:** DRAFT-4 · **Acceptance Criterion:** AC-4 · **Requirement ID:** REQ-28 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** Fresh browser with no cookies.

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Click Reject non-essential | None | Banner closes |
| 2 | Inspect cookies | None | cookie_consent has analytics=false and marketing=false; no _demo_analytics or _demo_marketing cookie |

### TS-028 – Customize: allow analytics only

**Category:** Positive · **Priority:** High · **Jira Story:** DRAFT-4 · **Acceptance Criterion:** AC-5 · **Requirement ID:** REQ-29 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** Fresh browser with no cookies.

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Click Customize | None | Cookie preferences dialog opens; Strictly necessary is ticked and disabled; Analytics and Marketing are unticked |
| 2 | Tick Analytics and click Save my choices | Analytics on, Marketing off | Dialog and banner close |
| 3 | Inspect cookies | None | _demo_analytics is set; _demo_marketing is not |

### TS-029 – Closing the dialog is not consent

**Category:** Negative · **Priority:** High · **Jira Story:** DRAFT-4 · **Acceptance Criterion:** AC-6 · **Requirement ID:** REQ-30 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** Fresh browser with no cookies.

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Click Customize, then close the dialog with × | None | Dialog closes; banner is still shown |
| 2 | Inspect cookies | None | No cookie_consent cookie exists |

### TS-030 – Withdraw consent via Cookie Settings

**Category:** Positive · **Priority:** High · **Jira Story:** DRAFT-4 · **Acceptance Criterion:** AC-8 · **Requirement ID:** REQ-32 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** Visitor has accepted all cookies.

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Click Cookie Settings in the footer | None | Dialog opens with Analytics and Marketing ticked |
| 2 | Untick both and click Save my choices | Both off | Dialog closes |
| 3 | Inspect cookies | None | _demo_analytics and _demo_marketing are deleted; cookie_consent shows both false |

### TS-031 – Outdated policy version shows the banner again

**Category:** Positive · **Priority:** Medium · **Jira Story:** DRAFT-4 · **Acceptance Criterion:** AC-10 · **Requirement ID:** REQ-34 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** A cookie_consent cookie for an older policy version exists.

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open the Home page | cookie_consent with v="0" | Banner is shown again |

### TS-032 – Dashboard shows the current consent choice

**Category:** Positive · **Priority:** Low · **Jira Story:** DRAFT-4 · **Acceptance Criterion:** AC-11 · **Requirement ID:** REQ-35 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** User is logged in and has customized: Analytics on, Marketing off.

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /dashboard | None | Analytics shows "Allowed" and Marketing shows "Refused" |

### TS-033 – Guest header navigation

**Category:** Positive · **Priority:** Medium · **Jira Story:** DRAFT-5 · **Acceptance Criterion:** AC-1 · **Requirement ID:** REQ-36 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** None (any visitor).

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open Home | None | Header shows Home, Login and Register; Home is marked as the current page |
| 2 | Click Login, then Register | None | The matching page opens and its link is marked as current |

### TS-034 – Footer legal links open the legal pages

**Category:** Positive · **Priority:** Medium · **Jira Story:** DRAFT-5 · **Acceptance Criterion:** AC-3 · **Requirement ID:** REQ-38 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** None (any visitor).

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Click Privacy Policy, Cookie Policy and Terms of Use in the footer in turn | None | Each page opens with the matching heading |

### TS-035 – Unknown URL shows the 404 page

**Category:** Negative · **Priority:** Medium · **Jira Story:** DRAFT-5 · **Acceptance Criterion:** AC-4 · **Requirement ID:** REQ-39 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** None (any visitor).

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open a URL that does not exist | /this-page-does-not-exist | Status 404; "Page not found" is shown |
| 2 | Click Back to home | None | Home opens |

### TS-036 – Mobile menu opens and closes

**Category:** Positive · **Priority:** Low · **Jira Story:** DRAFT-5 · **Acceptance Criterion:** AC-2 · **Requirement ID:** REQ-37 · **Existing Xray coverage:** Not verified (Xray not reachable)

**Preconditions:** Viewport 375 × 812.

| Step | Action | Test Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Click the menu button | None | Navigation opens; button has aria-expanded="true" |
| 2 | Press Escape | None | Navigation closes; aria-expanded="false" |

## 5. Coverage Summary

- Existing Xray scenarios: not verified (Xray not connected).
- Existing automated integration tests mapped: 9.
- Newly proposed scenarios: 36 (Positive 17, Negative 6, Boundary 3, Validation 3, Security 7).
- Requirements covered by new scenarios: 37 of 40.
- Requirements covered only by existing integration tests: REQ-15, REQ-40.
- **Coverage gaps:** REQ-10 (Registration attempts are rate-limited per network.). Boundary values 100/101 characters, 72/73 bytes and 254/255 characters are listed in the requirements but not yet scenarios.

## 6. Questions and Assumptions

- DRAFT-1: Is revealing that an email is already registered acceptable given DRAFT-2 enumeration protection?
- DRAFT-1: What is the intended registration rate limit?
- DRAFT-2: What are the intended login throttling numbers and the session timeout?
- DRAFT-5: What is the mobile breakpoint and which CSP directives are required?
- Scenarios TS-010 and REQ-07 assume the "email already exists" message is intended (unconfirmed).
