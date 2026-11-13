# Xray Test Creation Preview – DemoSite

> **Agent:** Xray Test Creation Agent (`mcp-qa-lab/.github/agents/xray-test-creation-agent.agent.md`) · **Date:** 2026-11-13
>
> **Status: PREVIEW ONLY – nothing was created in Xray.** The Xray and Atlassian MCP servers are
> not connected in this session, and the stories are not in Jira yet. This preview stops at the
> agent's Step 7 (human approval gate). The exact `create_xray_manual_test` payloads are in
> `qa/05-xray-payloads.json`.

## Header

- **Project key:** `<JIRA_PROJECT_KEY>` (mcp-qa-lab's `.env.example` uses `AQA` – confirm)
- **Story keys:** DRAFT-1 … DRAFT-5 – **blocked** until the stories exist in Jira
- **Test Plan key:** not provided – **required** before Step 10
- **Folder path:** `/DemoSite/<story summary>` (proposed)

## Proposed tests

| Scenario ID | Proposed Test Summary | Category | Priority | Story Key | Test Plan | Duplicate Status | Verification Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TS-001 | [DRAFT-1] Register with valid details | Positive | High | DRAFT-1 | Not provided | Not verified | Xray search not run |
| TS-002 | [DRAFT-1] Submit an empty registration form | Negative | High | DRAFT-1 | Not provided | Not verified | Xray search not run |
| TS-003 | [DRAFT-1] Reject an invalid email format | Validation | Medium | DRAFT-1 | Not provided | Not verified | Xray search not run |
| TS-004 | [DRAFT-1] Reject a 7-character password | Boundary | High | DRAFT-1 | Not provided | Not verified | Xray search not run |
| TS-005 | [DRAFT-1] Accept an 8-character password | Boundary | High | DRAFT-1 | Not provided | Not verified | Xray search not run |
| TS-006 | [DRAFT-1] Reject a password without a number | Validation | Medium | DRAFT-1 | Not provided | Not verified | Xray search not run |
| TS-007 | [DRAFT-1] Reject a confirm password that does not match | Validation | High | DRAFT-1 | Not provided | Not verified | Xray search not run |
| TS-008 | [DRAFT-1] Reject a full name containing &lt; or &gt; | Security | Medium | DRAFT-1 | Not provided | Not verified | Xray search not run |
| TS-009 | [DRAFT-1] Reject a 1-character full name | Boundary | Medium | DRAFT-1 | Not provided | Not verified | Xray search not run |
| TS-010 | [DRAFT-1] Reject an already-registered email in different letter case | Negative | High | DRAFT-1 | Not provided | Not verified | Xray search not run |
| TS-011 | [DRAFT-1] Server rejects invalid input when browser validation is off | Security | High | DRAFT-1 | Not provided | Not verified | Xray search not run |
| TS-012 | [DRAFT-1] Show and hide the password | Positive | Low | DRAFT-1 | Not provided | Not verified | Xray search not run |
| TS-013 | [DRAFT-2] Log in with valid credentials | Positive | High | DRAFT-2 | Not provided | Not verified | Xray search not run |
| TS-014 | [DRAFT-2] Log in with the email in different letter case | Positive | Medium | DRAFT-2 | Not provided | Not verified | Xray search not run |
| TS-015 | [DRAFT-2] Wrong password shows a generic error | Negative | High | DRAFT-2 | Not provided | Not verified | Xray search not run |
| TS-016 | [DRAFT-2] Unknown email shows the same generic error | Security | High | DRAFT-2 | Not provided | Not verified | Xray search not run |
| TS-017 | [DRAFT-2] Submit an empty login form | Negative | Medium | DRAFT-2 | Not provided | Not verified | Xray search not run |
| TS-018 | [DRAFT-2] Log out | Positive | High | DRAFT-2 | Not provided | Not verified | Xray search not run |
| TS-019 | [DRAFT-2] Logged-in user cannot open Login or Register | Positive | Medium | DRAFT-2 | Not provided | Not verified | Xray search not run |
| TS-020 | [DRAFT-3] Anonymous dashboard access redirects to Login and back | Security | High | DRAFT-3 | Not provided | Not verified | Xray search not run |
| TS-021 | [DRAFT-3] Dashboard shows the profile without sensitive data | Positive | High | DRAFT-3 | Not provided | Not verified | Xray search not run |
| TS-022 | [DRAFT-3] Session cookie is HttpOnly and SameSite=Lax | Security | High | DRAFT-3 | Not provided | Not verified | Xray search not run |
| TS-023 | [DRAFT-3] Session ID changes on login | Security | High | DRAFT-3 | Not provided | Not verified | Xray search not run |
| TS-024 | [DRAFT-3] Login with a tampered CSRF token is blocked | Security | High | DRAFT-3 | Not provided | Not verified | Xray search not run |
| TS-025 | [DRAFT-4] First visit shows the banner and sets no optional cookies | Positive | High | DRAFT-4 | Not provided | Not verified | Xray search not run |
| TS-026 | [DRAFT-4] Accept all cookies | Positive | High | DRAFT-4 | Not provided | Not verified | Xray search not run |
| TS-027 | [DRAFT-4] Reject non-essential cookies | Positive | High | DRAFT-4 | Not provided | Not verified | Xray search not run |
| TS-028 | [DRAFT-4] Customize: allow analytics only | Positive | High | DRAFT-4 | Not provided | Not verified | Xray search not run |
| TS-029 | [DRAFT-4] Closing the dialog is not consent | Negative | High | DRAFT-4 | Not provided | Not verified | Xray search not run |
| TS-030 | [DRAFT-4] Withdraw consent via Cookie Settings | Positive | High | DRAFT-4 | Not provided | Not verified | Xray search not run |
| TS-031 | [DRAFT-4] Outdated policy version shows the banner again | Positive | Medium | DRAFT-4 | Not provided | Not verified | Xray search not run |
| TS-032 | [DRAFT-4] Dashboard shows the current consent choice | Positive | Low | DRAFT-4 | Not provided | Not verified | Xray search not run |
| TS-033 | [DRAFT-5] Guest header navigation | Positive | Medium | DRAFT-5 | Not provided | Not verified | Xray search not run |
| TS-034 | [DRAFT-5] Footer legal links open the legal pages | Positive | Medium | DRAFT-5 | Not provided | Not verified | Xray search not run |
| TS-035 | [DRAFT-5] Unknown URL shows the 404 page | Negative | Medium | DRAFT-5 | Not provided | Not verified | Xray search not run |
| TS-036 | [DRAFT-5] Mobile menu opens and closes | Positive | Low | DRAFT-5 | Not provided | Not verified | Xray search not run |

## What `create_xray_manual_test` will and will not do

- `create_xray_manual_test` creates the Xray Manual Test only.
- Story linking will be performed only if a separate supported linking tool is available; otherwise it will be reported as not completed.
- Test Plan membership will be performed only if a separate supported Test Plan tool is available; otherwise it will be reported as not completed.
- Not populated by the tool: preconditions text (no Precondition issues exist, so `preconditionIssueIds` is None), priority, category, requirement references and story key. Keep these in the summary prefix or add them manually.

## Blocked – needs input before creation

1. Create DRAFT-1 … DRAFT-5 in Jira and replace the placeholder keys.
2. Provide the Jira project key and Xray Test Plan key.
3. Run `search_xray_tests` for each summary to check duplicates.
4. Approve the list (all, or specific scenario IDs).

## How to run it

In VS Code with mcp-qa-lab open and the Xray MCP server running, invoke the **Xray Test Creation Agent** with:

- Jira Story key(s), Jira Project key, Xray Test Plan key
- Approved test design: `DemoDevProject/qa/04-test-design.md` (or the payload file `qa/05-xray-payloads.json`)
