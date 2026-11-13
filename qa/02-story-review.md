# Story Review Report – DemoSite (DRAFT-1 … DRAFT-5)

> **Agent:** Story Review Agent (`mcp-qa-lab/.github/agents/story-review-agent.agent.md`)
> **Review date:** 2026-11-13
>
> **Deviation from the agent's retrieval gate:** the agent requires each story to be
> retrieved from Jira via Atlassian MCP. These stories are not in Jira yet, so this review
> was done on the draft text in `qa/01-user-stories.md`. Re-run the Story Review Agent
> against the real Jira issues once they exist. The application code was used only as
> supplementary evidence.

---

## DRAFT-1 – User registration

### 1. Story key and summary

- Story key: DRAFT-1 (placeholder) · Summary: User registration · Issue type: Story · Status: Draft · Source: `qa/01-user-stories.md`

### 2. Description assessment

Clear user goal and value. Gap: nothing says what happens to accounts later (deletion, data export), even though the Privacy Policy promises those rights.

### 3. Acceptance criteria assessment

| AC | Assessment | Notes |
| --- | --- | --- |
| AC-1 | Clear and testable | |
| AC-2 | Clear and testable | Boundaries 1/2 and 100/101 characters are testable. |
| AC-3 | Clear and testable | "Valid" is defined by a pattern, not full RFC 5322; acceptable for a demo. |
| AC-4 | Needs clarification | "72 bytes" differs from "72 characters" for non-ASCII passwords. The UI hint does not mention the maximum. |
| AC-5 | Clear and testable | |
| AC-6 | Clear and testable | Server-side check is testable with JavaScript disabled. |
| AC-7 | Needs clarification | **Conflicts with DRAFT-2 AC-4** (see section 5). |
| AC-8 | Clear and testable | |
| AC-9 | Clear and testable | |
| AC-10 | Needs clarification | Limit and window are not stated (code: 20 per hour per IP). Not testable without a configurable limit. |

### 4. Missing information

- Maximum password length in user-facing terms.
- The registration rate limit (number and window).
- Whether leading/trailing spaces in the password are kept (code: kept).

### 5. Ambiguities and conflicts

- **Conflict:** AC-7 tells visitors an email is already registered, while DRAFT-2 AC-4 is designed to stop account enumeration. The code accepts this trade-off and relies on the rate limiter. The product owner should confirm the trade-off is intended.

### 6. Testability

Partially testable: fully testable except AC-10, which needs the rate limit to be configurable in the test environment.

### 7. Dependencies and risks

- Rate limiting is per IP and in memory. Automated test runs from one machine share one counter, so repeated runs can trip the limit and cause false failures.

### 8. Recommended improvements

- Improvement 1: Make the registration limit configurable (e.g. `REGISTER_RATE_LIMIT_MAX`) and state the production value in AC-10.
- Improvement 2: Confirm the AC-7 vs DRAFT-2 AC-4 trade-off in writing.
- Improvement 3: Mention the maximum password length in the hint.

### 9. Overall result

**Needs Clarification** – the AC-7 conflict and the AC-10 limit should be confirmed. Everything else can proceed to test design.

---

## DRAFT-2 – User login and logout

### 1. Story key and summary

- Story key: DRAFT-2 (placeholder) · Summary: User login and logout · Issue type: Story · Status: Draft

### 2. Description assessment

Clear. Gaps: no password reset or "remember me" (both absent by design; should be stated as out of scope). Session lifetime (code: 120 minutes) is not mentioned.

### 3. Acceptance criteria assessment

| AC | Assessment | Notes |
| --- | --- | --- |
| AC-1 | Clear and testable | |
| AC-2 | Clear and testable | |
| AC-3 | Clear and testable | |
| AC-4 | Clear and testable | Response timing equality is not practically testable in UI tests; message equality is. |
| AC-5 | Needs clarification | Limit and window not stated (code default: 10 failed attempts per 15 minutes per IP). Only failed attempts count. |
| AC-6 | Clear and testable | |
| AC-7 | Clear and testable | |
| AC-8 | Clear and testable | |

### 4. Missing information

- Session timeout and what the user sees when the session expires.
- Explicit out-of-scope statement for password reset.

### 5. Ambiguities and conflicts

- See DRAFT-1 AC-7 conflict.

### 6. Testability

Partially testable: AC-5 needs a configurable limit (already available as `LOGIN_RATE_LIMIT_MAX`). Already covered by `tests/app.test.ts`.

### 7. Dependencies and risks

- Failed-login tests use up the shared per-IP limit; end-to-end runs need a raised limit or an isolated server.

### 8. Recommended improvements

- Improvement 1: State the throttling numbers in AC-5.
- Improvement 2: Add an AC for session expiry.
- Improvement 3: State that password reset is out of scope.

### 9. Overall result

**Ready** – AC-5 numbers should be added, but the behaviour is clear enough to test.

---

## DRAFT-3 – Protected dashboard and session security

### 1. Story key and summary

- Story key: DRAFT-3 (placeholder) · Summary: Protected dashboard and session security · Issue type: Story · Status: Draft

### 2. Description assessment

Clear and complete for the demo scope.

### 3. Acceptance criteria assessment

| AC | Assessment | Notes |
| --- | --- | --- |
| AC-1 | Clear and testable | |
| AC-2 | Clear and testable | Only same-site paths are allowed as return targets (open-redirect protection); worth stating. |
| AC-3 | Clear and testable | Member-since date format (`en-GB`, e.g. "13 November 2026") is not specified. |
| AC-4 | Clear and testable | `Secure` flag depends on HTTPS config; out of scope for local HTTP tests. |
| AC-5 | Clear and testable | Testable by comparing the `sid` cookie before and after login. |
| AC-6 | Clear and testable | Covered by existing integration tests. |

### 4. Missing information

- Behaviour when the account is deleted while logged in (code: session is dropped silently).

### 5. Ambiguities and conflicts

None found.

### 6. Testability

Fully testable.

### 7. Dependencies and risks

None beyond DRAFT-2.

### 8. Recommended improvements

- Improvement 1: Add the open-redirect rule to AC-2.

### 9. Overall result

**Ready**

---

## DRAFT-4 – GDPR cookie consent

### 1. Story key and summary

- Story key: DRAFT-4 (placeholder) · Summary: GDPR cookie consent · Issue type: Story · Status: Draft

### 2. Description assessment

Strong and specific. The legal basis is clear and the behaviour is observable through cookies and the UI.

### 3. Acceptance criteria assessment

| AC | Assessment | Notes |
| --- | --- | --- |
| AC-1 | Needs clarification | "Equally prominent" is subjective. In the UI, Accept and Reject share the same style; Customize is an outline button. Recommend "Accept and Reject have the same visual style". |
| AC-2 | Clear and testable | Check cookies and loaded scripts before any choice. |
| AC-3 | Clear and testable | |
| AC-4 | Clear and testable | |
| AC-5 | Clear and testable | |
| AC-6 | Clear and testable | |
| AC-7 | Clear and testable | 180-day lifetime is testable via the cookie expiry. |
| AC-8 | Clear and testable | |
| AC-9 | Clear and testable | Testable through the `POST /api/consent` network call (204). Storage is checked by integration tests. |
| AC-10 | Clear and testable | Testable by planting a consent cookie with an old version. |
| AC-11 | Clear and testable | |

### 4. Missing information

- What happens if recording consent on the server fails (code: ignored silently; the choice still applies locally). Should be stated.

### 5. Ambiguities and conflicts

- AC-1 wording (see table).

### 6. Testability

Fully testable.

### 7. Dependencies and risks

- Analytics and marketing scripts are simulated local files. Tests prove the consent logic, not real third-party behaviour.

### 8. Recommended improvements

- Improvement 1: Reword AC-1 to an objective rule.
- Improvement 2: Add an AC for server-recording failure.

### 9. Overall result

**Ready**

---

## DRAFT-5 – Site navigation, legal pages and error pages

### 1. Story key and summary

- Story key: DRAFT-5 (placeholder) · Summary: Site navigation, legal pages and error pages · Issue type: Story · Status: Draft

### 2. Description assessment

Clear. Lower risk than the other stories.

### 3. Acceptance criteria assessment

| AC | Assessment | Notes |
| --- | --- | --- |
| AC-1 | Clear and testable | |
| AC-2 | Needs clarification | Breakpoint not stated (code: below 768 px). |
| AC-3 | Clear and testable | |
| AC-4 | Clear and testable | |
| AC-5 | Needs clarification | "Strict" is undefined. Code: `script-src 'self'`, `style-src 'self'`. Covered by existing integration test. |

### 4. Missing information

- Mobile breakpoint; exact CSP directives.

### 5. Ambiguities and conflicts

None.

### 6. Testability

Fully testable once the breakpoint is stated (tests use a 375 px viewport).

### 7. Dependencies and risks

None.

### 8. Recommended improvements

- Improvement 1: State the breakpoint and CSP directives.

### 9. Overall result

**Ready**

---

## Summary

| Story | Result | Main point |
| --- | --- | --- |
| DRAFT-1 | Needs Clarification | Email-taken message vs. enumeration protection; registration limit unstated |
| DRAFT-2 | Ready | Add throttling numbers and session expiry |
| DRAFT-3 | Ready | |
| DRAFT-4 | Ready | Make "equally prominent" objective |
| DRAFT-5 | Ready | State breakpoint and CSP |

Proceeding to requirements analysis with DRAFT-1's open points recorded as assumptions.
