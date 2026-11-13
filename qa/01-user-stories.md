# DemoSite – User Stories

> **Status: in Jira.** These stories were written from the current behaviour of the
> application (code, templates and README at commit `486bb82`) so the mcp-qa-lab agent
> pipeline can run on DemoSite. They were created in Jira project AQA on 2026-11-13 as
> AQA-58 … AQA-62 (draft keys DRAFT-1 … DRAFT-5; see `qa/02-story-review.md`).
> Jira is the source of truth; this file is the text they were created from.

| Key | Summary | Area |
| --- | --- | --- |
| AQA-58 | User registration | Authentication |
| AQA-59 | User login and logout | Authentication |
| AQA-60 | Protected dashboard and session security | Access control |
| AQA-61 | GDPR cookie consent | Privacy |
| AQA-62 | Site navigation, legal pages and error pages | Navigation |

---

## AQA-58 – User registration

**Issue type:** Story · **Priority:** High

**As a** visitor
**I want to** create an account with my name, email and a password
**So that** I can log in and use the members-only dashboard.

### Acceptance criteria

- **AC-1** The Register page (`/register`) shows the fields Full name, Email address, Password and Confirm password. All four are required.
- **AC-2** Full name must be 2–100 characters after trimming and must not contain `<` or `>`.
- **AC-3** Email address must be a valid address (`name@domain.tld`, no spaces, max 254 characters).
- **AC-4** Password must be at least 8 characters, at most 72 bytes, and contain at least one letter and one number. The rule is shown as a hint under the field.
- **AC-5** Confirm password must match Password.
- **AC-6** Validation runs in the browser for quick feedback, and the server re-validates every field (it must not rely on the browser).
- **AC-7** An email that is already registered is rejected, ignoring letter case, with the message "An account with this email already exists. Try logging in instead."
- **AC-8** On success the account is active immediately (no email verification), the user is sent to the Login page and sees "Your account has been created and is active. Please log in."
- **AC-9** Password fields have a Show/Hide toggle.
- **AC-10** Registration attempts are rate-limited per network to block mass sign-ups.

---

## AQA-59 – User login and logout

**Issue type:** Story · **Priority:** High

**As a** registered user
**I want to** log in and log out
**So that** I can access my dashboard and end my session safely.

### Acceptance criteria

- **AC-1** The Login page (`/login`) has Email address and Password fields, both required.
- **AC-2** Valid credentials log the user in, send them to the Dashboard and show "Welcome back, &lt;full name&gt;!".
- **AC-3** Email matching ignores letter case.
- **AC-4** A wrong password and an unknown email show the same message, "Invalid email or password.", so attackers can't tell which accounts exist.
- **AC-5** After too many failed attempts from one IP, login is blocked for a time window with a "Too many login attempts" message.
- **AC-6** Logging out ends the server-side session, returns the user to Home and shows "You have been logged out."
- **AC-7** A logged-in user who opens `/login` or `/register` is sent to the Dashboard with "You are already logged in."
- **AC-8** While logged in, the header shows the user's name, email and initials, and a Log out button instead of the Login/Register links.

---

## AQA-60 – Protected dashboard and session security

**Issue type:** Story · **Priority:** High

**As a** logged-in user
**I want** a private dashboard that only I can see
**So that** my account details stay protected.

### Acceptance criteria

- **AC-1** Anonymous visitors who open `/dashboard` are sent to Login with "Please log in to view that page."
- **AC-2** After logging in, the user is returned to the page they originally asked for.
- **AC-3** The Dashboard shows the user's full name, email, account status "Active" and member-since date. It never shows the password or its hash.
- **AC-4** The session cookie is `HttpOnly` and `SameSite=Lax`.
- **AC-5** A new session ID is issued on login (protects against session fixation).
- **AC-6** Every form and state-changing request is protected by a CSRF token.

---

## AQA-61 – GDPR cookie consent

**Issue type:** Story · **Priority:** High

**As a** visitor
**I want to** choose which optional cookies the site may use
**So that** my privacy choices are respected, as GDPR and the ePrivacy Directive require.

### Acceptance criteria

- **AC-1** On a first visit a cookie banner shows three equally prominent choices: Accept all, Reject non-essential and Customize.
- **AC-2** No optional cookie is set and no optional script is loaded before the visitor makes a choice.
- **AC-3** Accept all enables Analytics and Marketing; the matching cookies (`_demo_analytics`, `_demo_marketing`) are then set.
- **AC-4** Reject non-essential keeps all optional cookies off; the site still works normally.
- **AC-5** Customize opens a preferences dialog. Strictly necessary is always on and cannot be switched off. Optional categories are off by default (never pre-ticked).
- **AC-6** Closing the dialog without saving is not consent; the banner stays.
- **AC-7** The choice is stored in the `cookie_consent` cookie for 180 days, so the banner does not reappear on later pages.
- **AC-8** The visitor can change or withdraw consent at any time via "Cookie Settings" in the footer. Withdrawing deletes the related optional cookies immediately.
- **AC-9** Each decision is recorded on the server anonymously (random ID, choices, policy version, timestamp; no IP address).
- **AC-10** When the cookie policy version changes, earlier consent is no longer valid and the banner is shown again.
- **AC-11** The Dashboard shows the current choice for Analytics and Marketing (Allowed / Refused / Not set).

---

## AQA-62 – Site navigation, legal pages and error pages

**Issue type:** Story · **Priority:** Medium

**As a** visitor
**I want** clear navigation and easy access to the legal pages
**So that** I can find my way around and understand how my data is used.

### Acceptance criteria

- **AC-1** The header shows Home, Login and Register for visitors, and Home and Dashboard for logged-in users. The current page is highlighted.
- **AC-2** On small screens the navigation collapses behind a menu button that opens and closes it.
- **AC-3** The footer links to Privacy Policy, Cookie Policy, Terms of Use and Cookie Settings on every page.
- **AC-4** An unknown URL shows a "Page not found" page with a link back to Home.
- **AC-5** Pages are served with security headers, including a strict Content Security Policy.
