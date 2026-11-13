import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";

import { getXrayAuthToken, getXrayEnvironmentState } from "../xray/XrayAuth";
import { MAX_RESOLVE_ISSUE_IDS, XrayClient } from "../xray/XrayClient";
import { XrayTestParser } from "../xray/XrayTestParser";

const mcpServer = new McpServer({
  name: "xray-mcp-server",
  version: "1.0.0",
});

function sanitizeText(value: string): string {
  if (!value) {
    return value;
  }

  return value
    .replace(/(Authorization\s*:\s*Bearer\s+)[A-Za-z0-9._-]+/gi, "$1[REDACTED]")
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, "$1[REDACTED]")
    .replace(/("access_token"\s*:\s*")([^"]+)"/gi, '$1[REDACTED]"')
    .replace(/("token"\s*:\s*")([^"]+)"/gi, '$1[REDACTED]"')
    .replace(/("client_secret"\s*:\s*")([^"]+)"/gi, '$1[REDACTED]"')
    .replace(/("authorization"\s*:\s*")([^"]+)"/gi, '$1[REDACTED]"')
    .replace(
      /(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/g,
      "[REDACTED_JWT]",
    );
}

function sanitizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function getConfiguredEnvState(): {
  configured: boolean;
  missing: string[];
  baseUrl?: string;
} {
  return getXrayEnvironmentState();
}

async function getAuthStatusResponse() {
  const envState = getConfiguredEnvState();

  if (!envState.configured) {
    return {
      configured: false,
      status: "missing_environment_variables",
      missing: envState.missing,
      baseUrl: envState.baseUrl ?? null,
      message:
        "Xray configuration is incomplete. Set the required environment variables before using the server.",
    };
  }

  try {
    await getXrayAuthToken();

    return {
      configured: true,
      status: "authenticated",
      baseUrl: envState.baseUrl ?? null,
      authMethod: "client_credentials",
      message: "Xray authentication succeeded.",
    };
  } catch (error) {
    const message = sanitizeText(
      error instanceof Error ? error.message : "Xray authentication failed.",
    );

    return {
      configured: true,
      status: "authentication_failed",
      baseUrl: envState.baseUrl ?? null,
      authMethod: "client_credentials",
      message:
        "Xray authentication failed. Check the configured credentials and endpoint.",
      error: message,
    };
  }
}

mcpServer.registerTool(
  "get_xray_auth_status",
  {
    description:
      "Check whether required Xray environment variables are present and whether the client credentials authenticate successfully.",
    inputSchema: {},
    annotations: {
      title: "Check Xray auth status",
      readOnlyHint: true,
      openWorldHint: true,
    },
  },
  async () => {
    const result = await getAuthStatusResponse();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
      structuredContent: result,
    };
  },
);

mcpServer.registerTool(
  "get_expanded_test",
  {
    description:
      "Fetch an expanded Xray test payload by issue ID and return a sanitized, structured result.",
    inputSchema: {
      issueId: z
        .string()
        .min(1)
        .describe("The Xray issue identifier, for example 10013."),
    },
    annotations: {
      title: "Get expanded Xray test",
      readOnlyHint: true,
      openWorldHint: true,
    },
  },
  async ({ issueId }) => {
    try {
      const expandedTest = await XrayClient.getExpandedTest(issueId);
      const parsed = XrayTestParser.parse(expandedTest, "");

      const preconditionsValue = expandedTest.preconditions as
        | {
            total?: number;
            results?: Array<{
              issueId?: string;
              definition?: string;
              preconditionType?: unknown;
            }>;
          }
        | undefined;

      const sanitizedPayload = {
        issueId: expandedTest.issueId ?? issueId,
        testType: expandedTest.testType ?? null,
        scenarioType: expandedTest.scenarioType ?? null,
        steps: Array.isArray(expandedTest.steps)
          ? expandedTest.steps.map((step) => ({
              id: step.id ?? null,
              action: step.action ?? "",
              data: step.data ?? "",
              result: step.result ?? "",
            }))
          : [],
        preconditions: Array.isArray(preconditionsValue?.results)
          ? preconditionsValue.results.map((precondition) => ({
              issueId: precondition.issueId ?? null,
              definition: precondition.definition ?? "",
              preconditionType: precondition.preconditionType ?? null,
            }))
          : [],
        parsed: {
          issueId: parsed.issueId,
          testName: parsed.testName,
          testType: parsed.testType,
          preconditions: parsed.preconditions,
          steps: parsed.steps,
          expectedResult: parsed.expectedResult,
        },
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: true,
                data: sanitizedPayload,
              },
              null,
              2,
            ),
          },
        ],
        structuredContent: {
          ok: true,
          data: sanitizedPayload,
        },
      };
    } catch (error) {
      const message = sanitizeText(
        error instanceof Error ? error.message : "Unknown Xray error.",
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: false,
                error: message,
              },
              null,
              2,
            ),
          },
        ],
        structuredContent: {
          ok: false,
          error: message,
        },
        isError: true,
      };
    }
  },
);

mcpServer.registerTool(
  "search_xray_tests",
  {
    description:
      "Search Xray tests by project key and optional summary text, with pagination and optional manual-only filtering.",
    inputSchema: {
      projectKey: z.string().trim().min(1).describe("Project key such as AQA."),
      searchText: z
        .string()
        .trim()
        .min(1)
        .optional()
        .describe("Optional summary text to search for in the Xray test list."),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(50)
        .describe("Maximum number of matching tests to return."),
      start: z
        .number()
        .int()
        .min(0)
        .default(0)
        .describe("Pagination offset for the results set."),
      manualOnly: z
        .boolean()
        .default(false)
        .describe("When true, include only Manual tests."),
    },
    annotations: {
      title: "Search Xray tests",
      readOnlyHint: true,
      openWorldHint: true,
    },
  },
  async ({
    projectKey,
    searchText,
    limit = 50,
    start = 0,
    manualOnly = false,
  }) => {
    try {
      const result = await XrayClient.searchTests({
        projectKey,
        searchText,
        limit,
        start,
        manualOnly,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: true,
                data: result,
              },
              null,
              2,
            ),
          },
        ],
        structuredContent: {
          ok: true,
          data: result,
        },
      };
    } catch (error) {
      const message = sanitizeText(
        error instanceof Error ? error.message : "Unknown Xray error.",
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: false,
                error: message,
              },
              null,
              2,
            ),
          },
        ],
        structuredContent: {
          ok: false,
          error: message,
        },
        isError: true,
      };
    }
  },
);

mcpServer.registerTool(
  "get_xray_test",
  {
    description:
      "Get a single Xray test by Jira issue key or issue ID and return the resolved metadata.",
    inputSchema: {
      issueKeyOrId: z
        .string()
        .trim()
        .min(1)
        .describe(
          "The Xray issue key such as AQA-6 or a numeric Xray issue ID.",
        ),
    },
    annotations: {
      title: "Get Xray test",
      readOnlyHint: true,
      openWorldHint: true,
    },
  },
  async ({ issueKeyOrId }) => {
    try {
      const result = await XrayClient.getTest(issueKeyOrId);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: true,
                data: result,
              },
              null,
              2,
            ),
          },
        ],
        structuredContent: {
          ok: true,
          data: result,
        },
      };
    } catch (error) {
      const message = sanitizeText(
        error instanceof Error ? error.message : "Unknown Xray error.",
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: false,
                error: message,
              },
              null,
              2,
            ),
          },
        ],
        structuredContent: {
          ok: false,
          error: message,
        },
        isError: true,
      };
    }
  },
);

mcpServer.registerTool(
  "get_xray_test_details",
  {
    description:
      "Fetch the expanded Xray test definition for a test issue key or issue ID, including preconditions and steps.",
    inputSchema: {
      issueKeyOrId: z
        .string()
        .trim()
        .min(1)
        .describe(
          "The Xray issue key such as AQA-6 or a numeric Xray issue ID.",
        ),
    },
    annotations: {
      title: "Get Xray test details",
      readOnlyHint: true,
      openWorldHint: true,
    },
  },
  async ({ issueKeyOrId }) => {
    try {
      const resolved = await XrayClient.getTest(issueKeyOrId);

      if (!resolved.issueId) {
        throw new Error(
          `Unable to resolve a valid Xray issue ID for: ${issueKeyOrId}`,
        );
      }

      const expandedTest = await XrayClient.getExpandedTest(resolved.issueId);
      const parsed = XrayTestParser.parse(expandedTest, resolved.summary ?? "");
      const preconditionsValue = expandedTest.preconditions as
        | {
            total?: number;
            results?: Array<{
              issueId?: string;
              definition?: string;
              preconditionType?: unknown;
            }>;
          }
        | undefined;

      const rawSteps = Array.isArray(expandedTest.steps)
        ? expandedTest.steps.map((step) => ({
            id: step.id ?? null,
            action: step.action ?? "",
            data: step.data ?? "",
            result: step.result ?? "",
          }))
        : [];

      const rawPreconditions = Array.isArray(preconditionsValue?.results)
        ? preconditionsValue.results.map((precondition) => ({
            issueId: precondition.issueId ?? null,
            definition: precondition.definition ?? "",
            preconditionType: precondition.preconditionType ?? null,
          }))
        : [];

      const hasDefinitionContent =
        rawSteps.length > 0 ||
        rawPreconditions.length > 0 ||
        (typeof expandedTest.unstructured === "string" &&
          expandedTest.unstructured.trim().length > 0);

      const payload = {
        issueId: expandedTest.issueId ?? resolved.issueId,
        issueKey: resolved.issueKey,
        summary: resolved.summary,
        testType: parsed.testType,
        definitionState: hasDefinitionContent ? "populated" : "empty",
        stepCount: rawSteps.length,
        preconditionCount: rawPreconditions.length,
        preconditions: parsed.preconditions,
        steps: parsed.steps.map((step) => ({
          stepNumber: step.stepNumber,
          action: step.action,
          testData: step.testData,
          expectedResult: step.expectedResult,
        })),
        raw: {
          testType: expandedTest.testType ?? null,
          scenarioType: expandedTest.scenarioType ?? null,
          steps: rawSteps,
          preconditions: rawPreconditions,
        },
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: true,
                data: payload,
              },
              null,
              2,
            ),
          },
        ],
        structuredContent: {
          ok: true,
          data: payload,
        },
      };
    } catch (error) {
      const message = sanitizeText(
        error instanceof Error ? error.message : "Unknown Xray error.",
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: false,
                error: message,
                definitionState: "error",
              },
              null,
              2,
            ),
          },
        ],
        structuredContent: {
          ok: false,
          error: message,
          definitionState: "error",
        },
        isError: true,
      };
    }
  },
);

mcpServer.registerTool(
  "get_xray_test_plan_tests",
  {
    description:
      "List the tests associated with a specific Xray test plan, with explicit empty/unsupported/failed status handling.",
    inputSchema: {
      issueKeyOrId: z
        .string()
        .trim()
        .min(1)
        .describe(
          "The test plan Jira issue key such as AQA-16 or a numeric Xray issue ID.",
        ),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(50)
        .describe("Maximum number of tests to return from the plan."),
      start: z
        .number()
        .int()
        .min(0)
        .default(0)
        .describe("Pagination offset for the plan’s tests."),
    },
    annotations: {
      title: "Get Xray Test Plan tests",
      readOnlyHint: true,
      openWorldHint: true,
    },
  },
  async ({ issueKeyOrId, limit = 50, start = 0 }) => {
    try {
      const result = await XrayClient.getTestPlanTests({
        issueKeyOrId,
        limit,
        start,
      });

      const ok = result.status === "success" || result.status === "empty";

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok,
                data: result,
              },
              null,
              2,
            ),
          },
        ],
        structuredContent: {
          ok,
          data: result,
        },
        isError: result.status === "failed" || result.status === "unsupported",
      };
    } catch (error) {
      const message = sanitizeText(
        error instanceof Error ? error.message : "Unknown Xray error.",
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: false,
                error: message,
              },
              null,
              2,
            ),
          },
        ],
        structuredContent: {
          ok: false,
          error: message,
        },
        isError: true,
      };
    }
  },
);

mcpServer.registerTool(
  "create_xray_manual_test",
  {
    description:
      "Create a new Xray Manual test in Jira with structured steps, optional linked preconditions and an optional Test Repository folder. This is a write operation that creates a Jira issue.",
    inputSchema: {
      projectKey: z
        .string()
        .trim()
        .min(1)
        .describe("Jira project key in which to create the test, such as AQA."),
      summary: z
        .string()
        .trim()
        .min(1)
        .max(255)
        .describe("Jira summary (title) for the new test issue."),
      steps: z
        .array(
          z.object({
            action: z
              .string()
              .trim()
              .min(1)
              .describe("The step action the tester performs."),
            data: z
              .string()
              .trim()
              .default("")
              .describe("Optional test data for the step."),
            result: z
              .string()
              .trim()
              .default("")
              .describe("Expected result of the step."),
          }),
        )
        .min(1)
        .describe("Ordered manual test steps. At least one step is required."),
      preconditionIssueIds: z
        .array(z.string().trim().min(1))
        .optional()
        .describe(
          "Optional numeric Xray issue IDs of existing Preconditions to link to the test.",
        ),
      folderPath: z
        .string()
        .trim()
        .min(1)
        .optional()
        .describe(
          "Optional Test Repository folder path, for example /Regression/Login.",
        ),
    },
    annotations: {
      title: "Create Xray Manual test",
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  async ({ projectKey, summary, steps, preconditionIssueIds, folderPath }) => {
    try {
      const result = await XrayClient.createTest({
        projectKey,
        summary,
        testType: "Manual",
        steps,
        preconditionIssueIds,
        folderPath,
      });

      const payload = {
        issueId: result.issueId,
        summary: result.summary,
        testType: result.testType,
        warnings: result.warnings,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: true,
                data: payload,
              },
              null,
              2,
            ),
          },
        ],
        structuredContent: {
          ok: true,
          data: payload,
        },
      };
    } catch (error) {
      const message = sanitizeText(
        error instanceof Error ? error.message : "Unknown Xray error.",
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: false,
                error: message,
              },
              null,
              2,
            ),
          },
        ],
        structuredContent: {
          ok: false,
          error: message,
        },
        isError: true,
      };
    }
  },
);

mcpServer.registerTool(
  "resolve_xray_test_keys",
  {
    description:
      "Read-only. Resolve numeric Xray test issue IDs (for example the issueId returned by create_xray_manual_test) into Jira issue keys, summaries, issue types and project keys. IDs that are not Xray tests are returned as not_found and tests without a Jira key as key_not_resolved; keys are never guessed.",
    inputSchema: {
      issueIds: z
        .array(
          z
            .string()
            .trim()
            .regex(/^\d+$/, "Each issue ID must be a numeric Xray issue ID."),
        )
        .min(1)
        .max(MAX_RESOLVE_ISSUE_IDS)
        .describe(
          `Numeric Xray test issue IDs to resolve, for example ["10013"]. Between 1 and ${MAX_RESOLVE_ISSUE_IDS} IDs.`,
        ),
    },
    annotations: {
      title: "Resolve Xray test keys",
      readOnlyHint: true,
      openWorldHint: true,
    },
  },
  async ({ issueIds }) => {
    try {
      const { results, warnings } = await XrayClient.resolveTestIssues(issueIds);

      const payload = {
        requested: results.length,
        resolved: results.filter((r) => r.status === "resolved").length,
        notFound: results.filter((r) => r.status === "not_found").length,
        keyNotResolved: results.filter((r) => r.status === "key_not_resolved")
          .length,
        results,
        warnings,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: true,
                data: payload,
              },
              null,
              2,
            ),
          },
        ],
        structuredContent: {
          ok: true,
          data: payload,
        },
      };
    } catch (error) {
      const message = sanitizeText(
        error instanceof Error ? error.message : "Unknown Xray error.",
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: false,
                error: message,
              },
              null,
              2,
            ),
          },
        ],
        structuredContent: {
          ok: false,
          error: message,
        },
        isError: true,
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
}

void main();
