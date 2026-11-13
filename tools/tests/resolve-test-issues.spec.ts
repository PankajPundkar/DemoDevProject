import { expect, test } from "@playwright/test";

import {
  MAX_RESOLVE_ISSUE_IDS,
  XrayClient,
} from "../xray/XrayClient";

/**
 * Unit tests for XrayClient.resolveTestIssues().
 *
 * `fetch` is replaced with an in-memory stub, so no request ever reaches Xray.
 * Pre-set dummy XRAY_* variables take precedence over any local .env file.
 */

type GraphQLCall = { query: string; variables: Record<string, unknown> };

const DUMMY_ENV = {
  XRAY_CLIENT_ID: "dummy-client-id",
  XRAY_CLIENT_SECRET: "dummy-client-secret",
  XRAY_BASE_URL: "http://127.0.0.1:9/api/v2",
};

const originalFetch = globalThis.fetch;
const originalEnv: Record<string, string | undefined> = {};

let graphqlCalls: GraphQLCall[];
let networkCalls: number;
let graphqlResponse: unknown;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getTestsResponse(
  results: unknown[],
  warnings: unknown[] | null = [],
): unknown {
  return {
    data: {
      getTests: { total: results.length, results, warnings },
    },
  };
}

test.describe("XrayClient.resolveTestIssues", () => {
  test.beforeAll(() => {
    for (const [name, value] of Object.entries(DUMMY_ENV)) {
      originalEnv[name] = process.env[name];
      process.env[name] = value;
    }
  });

  test.afterAll(() => {
    for (const [name, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  });

  test.beforeEach(() => {
    graphqlCalls = [];
    networkCalls = 0;
    graphqlResponse = getTestsResponse([]);

    globalThis.fetch = (async (
      input: string | URL | Request,
      init?: RequestInit,
    ) => {
      networkCalls += 1;
      const url = String(input instanceof Request ? input.url : input);

      if (url.endsWith("/authenticate")) {
        return jsonResponse("dummy-token");
      }

      if (url.endsWith("/graphql")) {
        graphqlCalls.push(JSON.parse(String(init?.body)) as GraphQLCall);
        return jsonResponse(graphqlResponse);
      }

      throw new Error(`Unexpected request in test: ${url}`);
    }) as typeof fetch;
  });

  test.afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("resolves keys, summaries, issue types and project keys", async () => {
    graphqlResponse = getTestsResponse([
      {
        issueId: "10013",
        jira: {
          key: "AQA-13",
          summary: "Verify user login",
          issuetype: { name: "Test" },
          project: { key: "AQA" },
        },
      },
    ]);

    const { results, warnings } = await XrayClient.resolveTestIssues([
      "10013",
    ]);

    expect(results).toEqual([
      {
        issueId: "10013",
        issueKey: "AQA-13",
        summary: "Verify user login",
        issueType: "Test",
        projectKey: "AQA",
        status: "resolved",
      },
    ]);
    expect(warnings).toEqual([]);
  });

  test("sends a read-only getTests query with the requested IDs", async () => {
    await XrayClient.resolveTestIssues(["10013", "10014"]);

    expect(graphqlCalls).toHaveLength(1);
    const [call] = graphqlCalls;
    expect(call.query).toMatch(/^\s*query\s+ResolveTestIssues/);
    expect(call.query).not.toMatch(/\bmutation\b/);
    expect(call.query).toContain("getTests(issueIds: $issueIds");
    expect(call.variables).toEqual({
      issueIds: ["10013", "10014"],
      limit: 2,
    });
  });

  test("reports IDs not returned by Xray as not_found", async () => {
    graphqlResponse = getTestsResponse([
      {
        issueId: "10013",
        jira: { key: "AQA-13", summary: "Login" },
      },
    ]);

    const { results } = await XrayClient.resolveTestIssues([
      "10013",
      "99999",
    ]);

    expect(results[1]).toEqual({
      issueId: "99999",
      issueKey: null,
      summary: null,
      issueType: null,
      projectKey: null,
      status: "not_found",
    });
  });

  test("reports key_not_resolved without guessing a key", async () => {
    graphqlResponse = getTestsResponse([
      {
        issueId: "10013",
        jira: {
          summary: "Login without key",
          issuetype: { name: "Test" },
          project: { key: "AQA" },
        },
      },
      { issueId: "10014", jira: null },
    ]);

    const { results } = await XrayClient.resolveTestIssues([
      "10013",
      "10014",
    ]);

    expect(results[0]).toEqual({
      issueId: "10013",
      issueKey: null,
      summary: "Login without key",
      issueType: "Test",
      projectKey: "AQA",
      status: "key_not_resolved",
    });
    expect(results[1]).toMatchObject({
      issueId: "10014",
      issueKey: null,
      status: "key_not_resolved",
    });
  });

  test("supports jira payloads nested under fields", async () => {
    graphqlResponse = getTestsResponse([
      {
        issueId: "10013",
        jira: {
          fields: {
            key: "AQA-13",
            summary: "Nested",
            issuetype: { name: "Test" },
            project: { key: "AQA" },
          },
        },
      },
    ]);

    const { results } = await XrayClient.resolveTestIssues(["10013"]);

    expect(results[0]).toMatchObject({
      issueKey: "AQA-13",
      summary: "Nested",
      issueType: "Test",
      projectKey: "AQA",
      status: "resolved",
    });
  });

  test("de-duplicates IDs and preserves input order", async () => {
    graphqlResponse = getTestsResponse([
      { issueId: "10014", jira: { key: "AQA-14" } },
      { issueId: "10013", jira: { key: "AQA-13" } },
    ]);

    const { results } = await XrayClient.resolveTestIssues([
      " 10013 ",
      "10014",
      "10013",
    ]);

    expect(results.map((r) => r.issueKey)).toEqual(["AQA-13", "AQA-14"]);
    expect(graphqlCalls[0].variables.issueIds).toEqual(["10013", "10014"]);
  });

  test("returns non-empty Xray warnings", async () => {
    graphqlResponse = getTestsResponse(
      [{ issueId: "10013", jira: { key: "AQA-13" } }],
      ["Some issues were not found", null, "  "],
    );

    const { warnings } = await XrayClient.resolveTestIssues(["10013"]);

    expect(warnings).toEqual(["Some issues were not found"]);
  });

  test("throws GraphQL errors instead of returning partial data", async () => {
    graphqlResponse = { errors: [{ message: "Field error from Xray" }] };

    await expect(XrayClient.resolveTestIssues(["10013"])).rejects.toThrow(
      "Field error from Xray",
    );
  });

  for (const [label, input, message] of [
    ["an empty list", [], "At least one issue ID is required."],
    ["a non-numeric ID", ["AQA-13"], "position 1 must be a numeric"],
    ["a blank ID", ["10013", "  "], "position 2 must be a numeric"],
    [
      "more than the maximum",
      Array.from({ length: MAX_RESOLVE_ISSUE_IDS + 1 }, (_, i) => `${i + 1}`),
      `At most ${MAX_RESOLVE_ISSUE_IDS} issue IDs`,
    ],
  ] as Array<[string, string[], string]>) {
    test(`rejects ${label} before any network call`, async () => {
      await expect(XrayClient.resolveTestIssues(input)).rejects.toThrow(
        message,
      );
      expect(networkCalls).toBe(0);
    });
  }

  test("accepts exactly the maximum number of IDs", async () => {
    const ids = Array.from(
      { length: MAX_RESOLVE_ISSUE_IDS },
      (_, i) => `${10000 + i}`,
    );

    const { results } = await XrayClient.resolveTestIssues(ids);

    expect(results).toHaveLength(MAX_RESOLVE_ISSUE_IDS);
    expect(results.every((r) => r.status === "not_found")).toBe(true);
    expect(graphqlCalls[0].variables.limit).toBe(MAX_RESOLVE_ISSUE_IDS);
  });
});
