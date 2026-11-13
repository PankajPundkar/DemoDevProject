# DemoSite – Project Instructions for Copilot and Agents

## Repository layout

- `src/`, `views/`, `public/`: the DemoSite web app (Express + TypeScript, EJS, plain JS/CSS).
- `tests/`: the app's unit and integration tests (Node test runner + supertest).
- `e2e/`: Playwright browser tests. Page objects in `e2e/pages/`, one spec per user story in `e2e/specs/`, shared setup in `e2e/fixtures.ts`.
- `qa/`: agent pipeline outputs (stories, story review, requirements, test design, Xray preview).
- `tools/`: the Xray client, the Xray MCP server and their tests (copied from mcp-qa-lab).

## Project standards

- Use TypeScript and Playwright Test for browser automation.
- Use the Page Object Model (POM): page objects under `e2e/pages/`, specs under `e2e/specs/`.
- Name and tag every browser test with its scenario from `qa/04-test-design.md`, using `scenario('TS-xxx', story, requirements)` from `e2e/support/scenarios.ts`.
- Prefer accessible locators (role, label). Use `data-testid` only where those are ambiguous.
- Keep UI interactions, locators, and reusable page actions in page objects.
- Keep test scenarios, assertions, and verifications in spec files.
- Reuse existing helpers, utilities, and page objects instead of duplicating logic.

## Working process

- Inspect the relevant files before proposing or implementing a change.
- Before editing code, explain the proposed changes and wait for approval.
- Keep changes minimal and explain the reasoning behind them.
- After implementation, review the Git diff and identify any unintended changes.
- Run only the tests explicitly approved by the user.
- Never commit, push, or modify Git history without explicit approval.

## Security and safety

- Never expose credentials, access tokens, secrets, or private data in code, logs, screenshots, or test output.
- Do not modify MCP configuration unless explicitly requested.
- Do not make unrelated edits or broad refactors.

## Scope discipline

- Prefer the smallest safe change that addresses the requirement.
- Do not create or delete files unless explicitly requested and approved.
- Do not introduce new frameworks or architecture patterns unless already established in the project.
