# Xray Test Creation Preview – DemoSite

> **Agent:** Xray Test Creation Agent (`.github/agents/xray-test-creation-agent.agent.md`) · **Date:** 2026-11-13
>
> **Status: approved and executed 2026-11-13. See "Outcome" below; the sections after it are the approved preview.** The exact
> `create_xray_manual_test` payloads are in `qa/05-xray-payloads.json`.

## Outcome (2026-11-13)

All 36 approved tests were created with `create_xray_manual_test`, keys were resolved with
`resolve_xray_test_keys`, and each test was linked to its story.

| Scenario IDs | Xray tests | Story | Folder | "Tests" link |
| --- | --- | --- | --- | --- |
| TS-001 … TS-012 | AQA-63 … AQA-74 | AQA-58 | /DemoSite/User registration | Verified (12) |
| TS-013 … TS-019 | AQA-75 … AQA-81 | AQA-59 | /DemoSite/User login and logout | Verified (7) |
| TS-020 … TS-024 | AQA-82 … AQA-86 | AQA-60 | /DemoSite/Protected dashboard and session security | Verified (5) |
| TS-025 … TS-032 | AQA-87 … AQA-94 | AQA-61 | /DemoSite/GDPR cookie consent | Verified (8) |
| TS-033 … TS-036 | AQA-95 … AQA-98 | AQA-62 | /DemoSite/Site navigation, legal pages and error pages | Verified (4) |

Keys are consecutive: TS-0nn → AQA-(62 + nn). The full map is in `e2e/xray-test-keys.json`.

- **Created:** 36 of 36 Manual tests (Xray issueIds 10075 … 10110). Failed: 0. Duplicates skipped: 0.
- **Warnings:** TS-001 (AQA-63) returned "Could not find Test Repository folder
  '/DemoSite/User registration'". The folders did not exist yet. They were then created in Xray,
  and AQA-63 was moved manually. TS-002 … TS-036 were created with no warnings.
- **Story links:** created with Atlassian MCP `createJiraIssueLink`, link type "Test"
  ("AQA-xx tests AQA-58"). Verified by reading each story's issue links: 36 "is tested by" links,
  none missing or extra.
- **Test Plan AQA-57:** no MCP tool can add tests to a plan, so the 36 tests were added manually in
  Xray. Verified with `get_xray_test_plan_tests`: 36 tests (issueIds 10075 … 10110).
- **Changes after approval:** TS-024 step 1 expected result changed from "None" to "The hidden
  _csrf field holds the tampered value" (also in `qa/04-test-design.md`).
- **Test Execution:** `npm run test:e2e` passed 36/36, and `npm run xray:import-results`
  created Test Execution **AQA-99** in Test Plan AQA-57. The first import attempt was rejected
  with 400 "Requirement with key REQ-25 doesn't exist", because the reserved `requirements` property
  was used, and created nothing. It succeeded after renaming the annotation to `requirement_ids`.
- **Folder placement:** verified manually in the Xray Test Repository (12 / 7 / 5 / 8 / 4 = 36 under /DemoSite).
- **Not verified by tooling:** the per-test run statuses inside AQA-99 (taken from the imported JUnit report).

## Header

- **Project key:** AQA (verified: stories AQA-58 … AQA-62 retrieved from Jira project AQA)
- **Story keys:** AQA-58, AQA-59, AQA-60, AQA-61, AQA-62
- **Test Plan key:** AQA-57 (verified with `get_xray_test_plan_tests`: exists, issueId 10069, 0 tests)
- **Folder path:** `/DemoSite/<story summary>` (one folder per story)

## Duplicate check (read-only)

- `search_xray_tests` (projectKey AQA) was run once per scenario with the **full scenario title** (without the `[AQA-xx]` prefix): **0 matches for all 36**. 8 searches hit 429 rate limits and were re-run successfully.
- Broader checks: an unfiltered search of project AQA and a "mobile" search both return only issueId 10068 = **AQA-56** "TS-021 – Home page renders on desktop and mobile viewports" (resolved with `resolve_xray_test_keys`, steps read with `get_xray_test_details`, no Jira issue links).
- **AQA-56 is not a duplicate** of any scenario (different app behaviour: Logout → Login page vs AQA-59 AC-6 Logout → Home; placeholder viewport data). New summaries carry no TS number, so they cannot clash with its "TS-021" prefix.
- Confirmed duplicates: **0**. Potential duplicates: **0**. Tests proposed for creation: **36**.

## Proposed tests

| Scenario ID | Proposed Test Summary | Category | Priority | Story Key | Test Plan | Duplicate Status | Verification Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TS-001 | [AQA-58] Register with valid details | Positive | High | AQA-58 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-002 | [AQA-58] Submit an empty registration form | Negative | High | AQA-58 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-003 | [AQA-58] Reject an invalid email format | Validation | Medium | AQA-58 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-004 | [AQA-58] Reject a 7-character password | Boundary | High | AQA-58 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-005 | [AQA-58] Accept an 8-character password | Boundary | High | AQA-58 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-006 | [AQA-58] Reject a password without a number | Validation | Medium | AQA-58 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-007 | [AQA-58] Reject a confirm password that does not match | Validation | High | AQA-58 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-008 | [AQA-58] Reject a full name containing &lt; or &gt; | Security | Medium | AQA-58 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-009 | [AQA-58] Reject a 1-character full name | Boundary | Medium | AQA-58 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-010 | [AQA-58] Reject an already-registered email in different letter case | Negative | High | AQA-58 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-011 | [AQA-58] Server rejects invalid input when browser validation is off | Security | High | AQA-58 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-012 | [AQA-58] Show and hide the password | Positive | Low | AQA-58 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-013 | [AQA-59] Log in with valid credentials | Positive | High | AQA-59 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-014 | [AQA-59] Log in with the email in different letter case | Positive | Medium | AQA-59 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-015 | [AQA-59] Wrong password shows a generic error | Negative | High | AQA-59 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-016 | [AQA-59] Unknown email shows the same generic error | Security | High | AQA-59 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-017 | [AQA-59] Submit an empty login form | Negative | Medium | AQA-59 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-018 | [AQA-59] Log out | Positive | High | AQA-59 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-019 | [AQA-59] Logged-in user cannot open Login or Register | Positive | Medium | AQA-59 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-020 | [AQA-60] Anonymous dashboard access redirects to Login and back | Security | High | AQA-60 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-021 | [AQA-60] Dashboard shows the profile without sensitive data | Positive | High | AQA-60 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-022 | [AQA-60] Session cookie is HttpOnly and SameSite=Lax | Security | High | AQA-60 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-023 | [AQA-60] Session ID changes on login | Security | High | AQA-60 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-024 | [AQA-60] Login with a tampered CSRF token is blocked | Security | High | AQA-60 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-025 | [AQA-61] First visit shows the banner and sets no optional cookies | Positive | High | AQA-61 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-026 | [AQA-61] Accept all cookies | Positive | High | AQA-61 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-027 | [AQA-61] Reject non-essential cookies | Positive | High | AQA-61 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-028 | [AQA-61] Customize: allow analytics only | Positive | High | AQA-61 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-029 | [AQA-61] Closing the dialog is not consent | Negative | High | AQA-61 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-030 | [AQA-61] Withdraw consent via Cookie Settings | Positive | High | AQA-61 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-031 | [AQA-61] Outdated policy version shows the banner again | Positive | Medium | AQA-61 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-032 | [AQA-61] Dashboard shows the current consent choice | Positive | Low | AQA-61 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-033 | [AQA-62] Guest header navigation | Positive | Medium | AQA-62 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-034 | [AQA-62] Footer legal links open the legal pages | Positive | Medium | AQA-62 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-035 | [AQA-62] Unknown URL shows the 404 page | Negative | Medium | AQA-62 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |
| TS-036 | [AQA-62] Mobile menu opens and closes | Positive | Low | AQA-62 | AQA-57 (not added by tool) | New test | Full-title search: 0 results |

## What will and will not happen

- `create_xray_manual_test` (Xray MCP, write) creates the Xray Manual Test only: projectKey, summary, steps, folderPath.
- **Story link ("Tests"):** `create_xray_manual_test` cannot do this. A separate supported operation exists: Atlassian MCP `createJiraIssueLink` (via `executeWrite`) with linkType **"Test"** (site link type id 10006, outward "tests", inward "is tested by"), inwardIssue = new test key, outwardIssue = story key → "AQA-xx tests AQA-58". Needs **separate approval**; verified afterwards with `getJiraIssue` (issuelinks). Not performed otherwise.
- **Test Plan AQA-57 membership:** **no available tool can do this.** The Xray MCP server has only the read-only `get_xray_test_plan_tests`; the repo's `XrayClient` only reads plans; the Atlassian MCP has no Xray Test Plan operation (Xray Cloud stores plan membership in Xray, not as Jira links). Will be reported as **Not completed – no supported operation**. Membership is re-checked with `get_xray_test_plan_tests` after step 7's `npm run xray:import-results` (which imports a Test Execution into AQA-57); if the tests are still not members, add them manually in Xray (Test Plan AQA-57 → Add Tests).

## Not populated by `create_xray_manual_test`

| Scenario ID | Free-text precondition | Priority | Category | Requirement references |
| --- | --- | --- | --- | --- |
| TS-001 | The email is not registered. | High | Positive | REQ-01, REQ-08 |
| TS-002 | None (any visitor). | High | Negative | REQ-01 |
| TS-003 | None (any visitor). | Medium | Validation | REQ-03 |
| TS-004 | None (any visitor). | High | Boundary | REQ-04 |
| TS-005 | The email is not registered. | High | Boundary | REQ-04 |
| TS-006 | None (any visitor). | Medium | Validation | REQ-04 |
| TS-007 | None (any visitor). | High | Validation | REQ-05 |
| TS-008 | None (any visitor). | Medium | Security | REQ-02 |
| TS-009 | None (any visitor). | Medium | Boundary | REQ-02 |
| TS-010 | Registered user created in a precondition | High | Negative | REQ-07 |
| TS-011 | JavaScript is disabled in the browser. | High | Security | REQ-06 |
| TS-012 | None (any visitor). | Low | Positive | REQ-09 |
| TS-013 | Registered user created in a precondition | High | Positive | REQ-12, REQ-18 |
| TS-014 | Registered user created in a precondition | Medium | Positive | REQ-13 |
| TS-015 | Registered user created in a precondition | High | Negative | REQ-14 |
| TS-016 | None (any visitor). | High | Security | REQ-14 |
| TS-017 | None (any visitor). | Medium | Negative | REQ-11 |
| TS-018 | User is logged in. | High | Positive | REQ-16 |
| TS-019 | User is logged in. | Medium | Positive | REQ-17 |
| TS-020 | Registered user created in a precondition User is logged out. | High | Security | REQ-19, REQ-20 |
| TS-021 | User is logged in. | High | Positive | REQ-21 |
| TS-022 | User is logged in. | High | Security | REQ-22 |
| TS-023 | Registered user created in a precondition | High | Security | REQ-23 |
| TS-024 | Registered user created in a precondition | High | Security | REQ-24 |
| TS-025 | Fresh browser with no cookies. | High | Positive | REQ-25, REQ-26 |
| TS-026 | Fresh browser with no cookies. | High | Positive | REQ-27, REQ-31, REQ-33 |
| TS-027 | Fresh browser with no cookies. | High | Positive | REQ-28 |
| TS-028 | Fresh browser with no cookies. | High | Positive | REQ-29 |
| TS-029 | Fresh browser with no cookies. | High | Negative | REQ-30 |
| TS-030 | Visitor has accepted all cookies. | High | Positive | REQ-32 |
| TS-031 | A cookie_consent cookie for an older policy version exists. | Medium | Positive | REQ-34 |
| TS-032 | User is logged in and has customized: Analytics on, Marketing off. | Low | Positive | REQ-35 |
| TS-033 | None (any visitor). | Medium | Positive | REQ-36 |
| TS-034 | None (any visitor). | Medium | Positive | REQ-38 |
| TS-035 | None (any visitor). | Medium | Negative | REQ-39 |
| TS-036 | Viewport 375 × 812. | Low | Positive | REQ-37 |

`preconditionIssueIds`: None for all tests (no Precondition issues exist). Story key is carried only in the summary prefix until the "Tests" link is created.

## Decisions

- **TS-024 step 1** Expected Result set to "The hidden _csrf field holds the tampered value" (approved 2026-11-13; test design updated to match).

## Exact payloads

All payloads use `projectKey: "AQA"` and `preconditionIssueIds: None`.

### TS-001 – [AQA-58] Register with valid details

folderPath: `/DemoSite/User registration`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /register | – | Register page shows Full name, Email address, Password and Confirm password |
| 2 | Fill all fields and click Create account | Unique generated user, e.g. "Ada Lovelace" / e2e-&lt;id&gt;@example.com / Passw0rd! | User is redirected to /login |
| 3 | Check the message on the Login page | – | "Your account has been created and is active. Please log in." is shown |
| 4 | Log in with the new credentials | Same credentials | Dashboard opens (account is active immediately) |

### TS-002 – [AQA-58] Submit an empty registration form

folderPath: `/DemoSite/User registration`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /register and click Create account without filling anything | All fields empty | Form is not submitted; URL stays /register |
| 2 | Check the field errors | – | "Full name is required.", "Email address is required.", "Password is required." and "Please confirm your password." are shown, and each field is marked invalid |

### TS-003 – [AQA-58] Reject an invalid email format

folderPath: `/DemoSite/User registration`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /register and enter an invalid email, then leave the field | ada@example | "Enter a valid email address." is shown |

### TS-004 – [AQA-58] Reject a 7-character password

folderPath: `/DemoSite/User registration`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /register and enter a 7-character password, then leave the field | abc1234 | "Password must be at least 8 characters." is shown |

### TS-005 – [AQA-58] Accept an 8-character password

folderPath: `/DemoSite/User registration`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Register with an 8-character password containing a letter and a number | abcdefg1 | Account is created and the user is redirected to /login |

### TS-006 – [AQA-58] Reject a password without a number

folderPath: `/DemoSite/User registration`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /register and enter a letters-only password, then leave the field | abcdefgh | "Password must contain at least one letter and one number." is shown |

### TS-007 – [AQA-58] Reject a confirm password that does not match

folderPath: `/DemoSite/User registration`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Enter a valid password and a different confirmation, then leave the field | Passw0rd! / Passw0rd? | "Passwords do not match." is shown |

### TS-008 – [AQA-58] Reject a full name containing &lt; or &gt;

folderPath: `/DemoSite/User registration`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Enter a full name containing angle brackets, then leave the field | &lt;b&gt;Ada&lt;/b&gt; | "Full name contains invalid characters." is shown |

### TS-009 – [AQA-58] Reject a 1-character full name

folderPath: `/DemoSite/User registration`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Enter a 1-character full name, then leave the field | A | "Full name must be between 2 and 100 characters." is shown |

### TS-010 – [AQA-58] Reject an already-registered email in different letter case

folderPath: `/DemoSite/User registration`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Register again with the same email in upper case | Same email, upper case | Registration fails; "We could not create your account." is shown |
| 2 | Check the email field error | – | "An account with this email already exists. Try logging in instead." is shown |

### TS-011 – [AQA-58] Server rejects invalid input when browser validation is off

folderPath: `/DemoSite/User registration`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /register and submit invalid data | Name "A", email "bad", password "short" | Server returns the Register page with "Please correct the highlighted fields." |
| 2 | Check the field errors | – | Server-side errors are shown for Full name, Email address, Password and Confirm password |

### TS-012 – [AQA-58] Show and hide the password

folderPath: `/DemoSite/User registration`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Type a password and click Show | Passw0rd! | Password is visible as text; button reads Hide |
| 2 | Click Hide | – | Password is masked again; button reads Show |

### TS-013 – [AQA-59] Log in with valid credentials

folderPath: `/DemoSite/User login and logout`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /login and enter valid credentials, click Log in | Registered email and password | Dashboard opens |
| 2 | Check the message and header | – | "Welcome back, &lt;full name&gt;!" is shown; header shows name, email, initials and Log out; Login/Register links are gone |

### TS-014 – [AQA-59] Log in with the email in different letter case

folderPath: `/DemoSite/User login and logout`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Log in with the email in upper case | Upper-case email, correct password | Dashboard opens |

### TS-015 – [AQA-59] Wrong password shows a generic error

folderPath: `/DemoSite/User login and logout`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Log in with a wrong password | Registered email, WrongPass1 | "Invalid email or password." is shown; user stays on /login |

### TS-016 – [AQA-59] Unknown email shows the same generic error

folderPath: `/DemoSite/User login and logout`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Log in with an email that is not registered | nobody-&lt;id&gt;@example.com, Passw0rd! | The exact same "Invalid email or password." message is shown |

### TS-017 – [AQA-59] Submit an empty login form

folderPath: `/DemoSite/User login and logout`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /login and click Log in without filling anything | All fields empty | "Email address is required." and "Password is required." are shown; URL stays /login |

### TS-018 – [AQA-59] Log out

folderPath: `/DemoSite/User login and logout`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Click Log out in the header | – | Home opens with "You have been logged out." |
| 2 | Check the header | – | Login and Register links are shown again |
| 3 | Open /dashboard | – | User is redirected to /login |

### TS-019 – [AQA-59] Logged-in user cannot open Login or Register

folderPath: `/DemoSite/User login and logout`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /login | – | Redirected to /dashboard with "You are already logged in." |
| 2 | Open /register | – | Redirected to /dashboard |

### TS-020 – [AQA-60] Anonymous dashboard access redirects to Login and back

folderPath: `/DemoSite/Protected dashboard and session security`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /dashboard | – | Redirected to /login with "Please log in to view that page." |
| 2 | Log in | Registered credentials | User lands on /dashboard (the page originally requested) |

### TS-021 – [AQA-60] Dashboard shows the profile without sensitive data

folderPath: `/DemoSite/Protected dashboard and session security`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /dashboard | – | Full name, email (lower case), status "Active" and member-since date are shown |
| 2 | Inspect the page content | – | No password, password hash or "passwordHash" text appears |

### TS-022 – [AQA-60] Session cookie is HttpOnly and SameSite=Lax

folderPath: `/DemoSite/Protected dashboard and session security`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Inspect the "sid" cookie | – | Cookie is HttpOnly, SameSite=Lax, path "/" |
| 2 | Read document.cookie in the page | – | "sid" is not readable by scripts |

### TS-023 – [AQA-60] Session ID changes on login

folderPath: `/DemoSite/Protected dashboard and session security`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /login and note the "sid" cookie value | – | A "sid" cookie exists |
| 2 | Log in | Registered credentials | The "sid" cookie value is different from before |

### TS-024 – [AQA-60] Login with a tampered CSRF token is blocked

folderPath: `/DemoSite/Protected dashboard and session security`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /login and change the hidden _csrf value | tampered-token | The hidden _csrf field holds the tampered value |
| 2 | Submit valid credentials | Registered credentials | 403 "Request blocked" page is shown; user is not logged in |

### TS-025 – [AQA-61] First visit shows the banner and sets no optional cookies

folderPath: `/DemoSite/GDPR cookie consent`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open the Home page | – | Banner "Your privacy choices" shows Reject non-essential, Accept all and Customize |
| 2 | Inspect cookies and loaded scripts | – | No cookie_consent, _demo_analytics or _demo_marketing cookie; no /js/vendor/ script is loaded |

### TS-026 – [AQA-61] Accept all cookies

folderPath: `/DemoSite/GDPR cookie consent`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Click Accept all | – | Banner closes; POST /api/consent returns 204 |
| 2 | Inspect cookies | – | cookie_consent has analytics=true and marketing=true and expires in about 180 days; _demo_analytics and _demo_marketing are set |
| 3 | Open another page | /privacy | Banner is not shown again |

### TS-027 – [AQA-61] Reject non-essential cookies

folderPath: `/DemoSite/GDPR cookie consent`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Click Reject non-essential | – | Banner closes |
| 2 | Inspect cookies | – | cookie_consent has analytics=false and marketing=false; no _demo_analytics or _demo_marketing cookie |

### TS-028 – [AQA-61] Customize: allow analytics only

folderPath: `/DemoSite/GDPR cookie consent`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Click Customize | – | Cookie preferences dialog opens; Strictly necessary is ticked and disabled; Analytics and Marketing are unticked |
| 2 | Tick Analytics and click Save my choices | Analytics on, Marketing off | Dialog and banner close |
| 3 | Inspect cookies | – | _demo_analytics is set; _demo_marketing is not |

### TS-029 – [AQA-61] Closing the dialog is not consent

folderPath: `/DemoSite/GDPR cookie consent`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Click Customize, then close the dialog with × | – | Dialog closes; banner is still shown |
| 2 | Inspect cookies | – | No cookie_consent cookie exists |

### TS-030 – [AQA-61] Withdraw consent via Cookie Settings

folderPath: `/DemoSite/GDPR cookie consent`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Click Cookie Settings in the footer | – | Dialog opens with Analytics and Marketing ticked |
| 2 | Untick both and click Save my choices | Both off | Dialog closes |
| 3 | Inspect cookies | – | _demo_analytics and _demo_marketing are deleted; cookie_consent shows both false |

### TS-031 – [AQA-61] Outdated policy version shows the banner again

folderPath: `/DemoSite/GDPR cookie consent`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open the Home page | cookie_consent with v="0" | Banner is shown again |

### TS-032 – [AQA-61] Dashboard shows the current consent choice

folderPath: `/DemoSite/GDPR cookie consent`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open /dashboard | – | Analytics shows "Allowed" and Marketing shows "Refused" |

### TS-033 – [AQA-62] Guest header navigation

folderPath: `/DemoSite/Site navigation, legal pages and error pages`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open Home | – | Header shows Home, Login and Register; Home is marked as the current page |
| 2 | Click Login, then Register | – | The matching page opens and its link is marked as current |

### TS-034 – [AQA-62] Footer legal links open the legal pages

folderPath: `/DemoSite/Site navigation, legal pages and error pages`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Click Privacy Policy, Cookie Policy and Terms of Use in the footer in turn | – | Each page opens with the matching heading |

### TS-035 – [AQA-62] Unknown URL shows the 404 page

folderPath: `/DemoSite/Site navigation, legal pages and error pages`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Open a URL that does not exist | /this-page-does-not-exist | Status 404; "Page not found" is shown |
| 2 | Click Back to home | – | Home opens |

### TS-036 – [AQA-62] Mobile menu opens and closes

folderPath: `/DemoSite/Site navigation, legal pages and error pages`

| Step # | Action | Data | Expected Result |
| --- | --- | --- | --- |
| 1 | Click the menu button | – | Navigation opens; button has aria-expanded="true" |
| 2 | Press Escape | – | Navigation closes; aria-expanded="false" |
