import { getXrayAuthToken } from "./XrayAuth";

/** Mirrors the GraphQL `CreateStepInput` fields used for Manual test steps. */
export interface CreateTestStepInput {
  action: string;
  data?: string;
  result?: string;
}

export interface CreateTestOptions {
  projectKey: string;
  summary: string;
  /** Xray test type name (GraphQL `UpdateTestTypeInput.name`). Defaults to "Manual". */
  testType?: string;
  steps: CreateTestStepInput[];
  preconditionIssueIds?: string[];
  folderPath?: string;
}

export interface CreateTestResult {
  issueId: string;
  summary: string;
  testType: string;
  warnings: string[];
}

export type ResolvedTestIssueStatus =
  | "resolved"
  | "not_found"
  | "key_not_resolved";

export interface ResolvedTestIssue {
  issueId: string;
  issueKey: string | null;
  summary: string | null;
  /** Jira issue type name (for example "Test"), not the Xray test type. */
  issueType: string | null;
  projectKey: string | null;
  status: ResolvedTestIssueStatus;
}

export interface ResolveTestIssuesResult {
  results: ResolvedTestIssue[];
  warnings: string[];
}

export const MAX_RESOLVE_ISSUE_IDS = 100;

const RESOLVE_TEST_ISSUES_QUERY = `
  query ResolveTestIssues($issueIds: [String], $limit: Int!) {
    getTests(issueIds: $issueIds, limit: $limit) {
      total
      results {
        issueId
        jira(fields: ["key", "summary", "issuetype", "project"])
      }
      warnings
    }
  }
`;

const DEFAULT_TEST_TYPE = "Manual";

const CREATE_TEST_MUTATION = `
  mutation CreateTest(
    $testType: UpdateTestTypeInput
    $steps: [CreateStepInput]
    $preconditionIssueIds: [String]
    $folderPath: String
    $jira: JSON!
  ) {
    createTest(
      testType: $testType
      steps: $steps
      preconditionIssueIds: $preconditionIssueIds
      folderPath: $folderPath
      jira: $jira
    ) {
      test {
        issueId
      }
      warnings
    }
  }
`;

function ensureXrayBaseUrl(): string {
  const baseUrl = process.env.XRAY_BASE_URL?.trim();

  if (!baseUrl) {
    throw new Error("Missing required environment variable: XRAY_BASE_URL");
  }

  return baseUrl.replace(/\/+$/, "");
}

function validateIssueId(issueId: string): string {
  const trimmed = issueId.trim();

  if (!trimmed) {
    throw new Error("Issue ID is required.");
  }

  return trimmed;
}

function validateIssueKey(issueKey: string): string {
  const trimmed = issueKey.trim();

  if (!trimmed) {
    throw new Error("Issue key is required.");
  }

  return trimmed;
}

function normalizeProjectKey(projectKey: string): string {
  const trimmed = projectKey.trim();

  if (!trimmed) {
    throw new Error("Project key is required.");
  }

  return trimmed.toUpperCase();
}

function validateCreateTestOptions(options: CreateTestOptions): {
  projectKey: string;
  summary: string;
  testType: string;
  steps: Array<{ action: string; data: string; result: string }>;
  preconditionIssueIds?: string[];
  folderPath?: string;
} {
  if (!options || typeof options !== "object") {
    throw new Error("createTest options are required.");
  }

  const projectKey = normalizeProjectKey(options.projectKey ?? "");

  const summary = options.summary?.trim();
  if (!summary) {
    throw new Error("Test summary is required.");
  }

  const testType = options.testType?.trim() || DEFAULT_TEST_TYPE;

  if (!Array.isArray(options.steps) || options.steps.length === 0) {
    throw new Error("At least one test step is required.");
  }

  const steps = options.steps.map((step, index) => {
    const action = step?.action?.trim();

    if (!action) {
      throw new Error(`Test step ${index + 1} is missing a required action.`);
    }

    return {
      action,
      data: step.data?.trim() ?? "",
      result: step.result?.trim() ?? "",
    };
  });

  let preconditionIssueIds: string[] | undefined;

  if (options.preconditionIssueIds !== undefined) {
    if (!Array.isArray(options.preconditionIssueIds)) {
      throw new Error("preconditionIssueIds must be an array of issue IDs.");
    }

    const ids = options.preconditionIssueIds
      .map((id) => (typeof id === "string" ? id.trim() : ""))
      .filter(Boolean);

    preconditionIssueIds = ids.length > 0 ? ids : undefined;
  }

  const folderPath = options.folderPath?.trim() || undefined;

  return {
    projectKey,
    summary,
    testType,
    steps,
    preconditionIssueIds,
    folderPath,
  };
}

function escapeJqlString(value: string): string {
  return value.replace(/(["\\])/g, "\\$1");
}

function extractGraphQLMessages(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((error) => {
      if (typeof error !== "object" || error === null) {
        return null;
      }

      const message = (error as Record<string, unknown>).message;

      return typeof message === "string" ? message : null;
    })
    .filter((message): message is string => message !== null);
}

function extractIssueKeyFromJira(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (typeof record.issueKey === "string" && record.issueKey.trim()) {
    return record.issueKey.trim();
  }

  if (typeof record.key === "string" && record.key.trim()) {
    return record.key.trim();
  }

  const fields = record.fields;

  if (fields && typeof fields === "object") {
    const fieldRecord = fields as Record<string, unknown>;
    const jiraKey = fieldRecord.key;
    if (typeof jiraKey === "string" && jiraKey.trim()) {
      return jiraKey.trim();
    }
  }

  return null;
}

function extractSummaryFromJira(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (typeof record.summary === "string" && record.summary.trim()) {
    return record.summary.trim();
  }

  const fields = record.fields;

  if (fields && typeof fields === "object") {
    const fieldRecord = fields as Record<string, unknown>;
    if (typeof fieldRecord.summary === "string" && fieldRecord.summary.trim()) {
      return fieldRecord.summary.trim();
    }
  }

  return null;
}

function extractNamedFieldFromJira(
  value: unknown,
  fieldName: string,
  property: "name" | "key",
): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const candidates = [record[fieldName]];

  if (record.fields && typeof record.fields === "object") {
    candidates.push((record.fields as Record<string, unknown>)[fieldName]);
  }

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object") {
      const nested = (candidate as Record<string, unknown>)[property];
      if (typeof nested === "string" && nested.trim()) {
        return nested.trim();
      }
    }
  }

  return null;
}

function extractIssueTypeFromJira(value: unknown): string | null {
  return extractNamedFieldFromJira(value, "issuetype", "name");
}

function extractProjectKeyFromJira(value: unknown): string | null {
  return extractNamedFieldFromJira(value, "project", "key");
}

function validateNumericIssueIds(issueIds: string[]): string[] {
  if (!Array.isArray(issueIds) || issueIds.length === 0) {
    throw new Error("At least one issue ID is required.");
  }

  if (issueIds.length > MAX_RESOLVE_ISSUE_IDS) {
    throw new Error(
      `At most ${MAX_RESOLVE_ISSUE_IDS} issue IDs can be resolved per request.`,
    );
  }

  const unique: string[] = [];

  issueIds.forEach((issueId, index) => {
    const trimmed = typeof issueId === "string" ? issueId.trim() : "";

    if (!/^\d+$/.test(trimmed)) {
      throw new Error(
        `Issue ID at position ${index + 1} must be a numeric Xray issue ID.`,
      );
    }

    if (!unique.includes(trimmed)) {
      unique.push(trimmed);
    }
  });

  return unique;
}

async function executeGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const authToken = await getXrayAuthToken();
  const baseUrl = ensureXrayBaseUrl();
  const url = `${baseUrl}/graphql`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });
  } catch {
    throw new Error("Unable to connect to the Xray GraphQL endpoint.");
  }

  const responseText = await response.text();

  if (!response.ok) {
    let parsed: Record<string, unknown> | undefined;

    try {
      parsed = JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      // Ignore invalid JSON responses.
    }

    const graphqlMessages = extractGraphQLMessages(parsed?.errors);

    if (graphqlMessages.length > 0) {
      throw new Error(graphqlMessages.join("; "));
    }

    throw new Error(
      `Xray GraphQL request failed (${response.status} ${response.statusText}).`,
    );
  }

  if (!responseText.trim()) {
    throw new Error(
      "Xray GraphQL request succeeded but no response body was returned.",
    );
  }

  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(responseText) as Record<string, unknown>;
  } catch {
    throw new Error("Xray GraphQL response was not valid JSON.");
  }

  const graphqlErrors = extractGraphQLMessages(parsed.errors);

  if (graphqlErrors.length > 0) {
    throw new Error(graphqlErrors.join("; "));
  }

  const payload = parsed.data as T | undefined;

  if (!payload) {
    throw new Error("Xray GraphQL response did not include a data payload.");
  }

  return payload;
}

export class XrayClient {
  static async getExpandedTest(
    issueId: string,
  ): Promise<Record<string, unknown>> {
    const validatedIssueId = validateIssueId(issueId);

    const authToken = await getXrayAuthToken();
    const baseUrl = ensureXrayBaseUrl();
    const url = `${baseUrl}/graphql`;

    const query = `
      query GetExpandedTest($issueId: String!) {
        getExpandedTest(issueId: $issueId) {
          issueId

          testType {
            id
            name
            kind
          }

          steps {
            id
            action
            data
            result
          }

          preconditions(limit: 100) {
            total
            results {
              issueId
              definition
              preconditionType {
                id
                name
                kind
              }
            }
          }

          unstructured
          gherkin
          scenarioType
          warnings
        }
      }
    `;

    let response: Response;

    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          query,
          variables: {
            issueId: validatedIssueId,
          },
        }),
      });
    } catch {
      throw new Error("Unable to connect to the Xray GraphQL endpoint.");
    }

    const responseText = await response.text();

    if (!response.ok) {
      let parsed: Record<string, unknown> | undefined;

      try {
        parsed = JSON.parse(responseText) as Record<string, unknown>;
      } catch {
        // Ignore invalid JSON responses.
      }

      const graphqlMessages = extractGraphQLMessages(parsed?.errors);

      if (graphqlMessages.length > 0) {
        throw new Error(graphqlMessages.join("; "));
      }

      throw new Error(
        `Xray GraphQL request failed (${response.status} ${response.statusText}).`,
      );
    }

    if (!responseText.trim()) {
      throw new Error(
        "Xray GraphQL request succeeded but no response body was returned.",
      );
    }

    let parsed: Record<string, unknown>;

    try {
      parsed = JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      throw new Error("Xray GraphQL response was not valid JSON.");
    }

    const graphqlErrors = extractGraphQLMessages(parsed.errors);

    if (graphqlErrors.length > 0) {
      throw new Error(graphqlErrors.join("; "));
    }

    const payload =
      parsed.data && typeof parsed.data === "object"
        ? ((parsed.data as Record<string, unknown>).getExpandedTest as
            | Record<string, unknown>
            | undefined)
        : undefined;

    if (!payload) {
      throw new Error(
        "Xray GraphQL response did not include the expanded test payload.",
      );
    }

    return payload;
  }

  static async searchTests(options: {
    projectKey: string;
    searchText?: string;
    limit?: number;
    start?: number;
    manualOnly?: boolean;
  }): Promise<{
    total: number;
    limit: number;
    start: number;
    results: Array<{
      issueId: string | null;
      issueKey: string | null;
      summary: string | null;
      testType: string | null;
      raw: Record<string, unknown>;
    }>;
  }> {
    const projectKey = normalizeProjectKey(options.projectKey);
    const limit = Math.max(1, Number(options.limit ?? 50));
    const start = Math.max(0, Number(options.start ?? 0));
    const searchText = options.searchText?.trim();
    const manualOnly = !!options.manualOnly;

    const jql = searchText
      ? `project = ${projectKey} AND summary ~ "${escapeJqlString(searchText)}"`
      : `project = ${projectKey}`;

    const data = await executeGraphQL<{
      getTests?: {
        total?: number;
        results?: Array<{
          issueId?: string;
          testType?: {
            id?: string;
            name?: string;
            kind?: string;
          };
          [key: string]: unknown;
        }>;
      };
    }>(
      `
      query GetTests($jql: String!, $limit: Int!, $start: Int) {
        getTests(jql: $jql, limit: $limit, start: $start) {
          total
          results {
            issueId
            testType {
              id
              name
              kind
            }
          }
        }
      }
    `,
      {
        jql,
        limit,
        start,
      },
    );

    const results = data.getTests?.results ?? [];
    const filteredResults = results.filter((result) => {
      if (!manualOnly) {
        return true;
      }

      const testTypeName = result.testType?.name;
      return testTypeName?.toLowerCase() === "manual";
    });

    return {
      total: data.getTests?.total ?? filteredResults.length,
      limit,
      start,
      results: filteredResults.map((result) => ({
        issueId: result.issueId ?? null,
        issueKey: null,
        summary: null,
        testType: result.testType?.name ?? null,
        raw: result as Record<string, unknown>,
      })),
    };
  }

  static async getTest(issueKeyOrId: string): Promise<{
    issueId: string | null;
    issueKey: string | null;
    summary: string | null;
    testType: string | null;
    raw: Record<string, unknown>;
  }> {
    const normalizedInput = issueKeyOrId.trim();

    if (!normalizedInput) {
      throw new Error("Issue key or ID is required.");
    }

    if (/^\d+$/.test(normalizedInput)) {
      const data = await executeGraphQL<{
        getTest?: {
          issueId?: string;
          testType?: { id?: string; name?: string; kind?: string };
          [key: string]: unknown;
        };
      }>(
        `
        query GetTest($issueId: String!) {
          getTest(issueId: $issueId) {
            issueId
            testType {
              id
              name
              kind
            }
          }
        }
      `,
        {
          issueId: normalizedInput,
        },
      );

      const test = data.getTest;

      if (!test) {
        throw new Error(`Xray test not found for issue ID: ${normalizedInput}`);
      }

      return {
        issueId: test.issueId ?? normalizedInput,
        issueKey: null,
        summary: null,
        testType: test.testType?.name ?? null,
        raw: test as Record<string, unknown>,
      };
    }

    const issueKey = validateIssueKey(normalizedInput);
    const projectKey = issueKey.split("-")[0]?.trim();

    if (!projectKey) {
      throw new Error(
        `Issue key is not in a valid project-key format: ${issueKey}`,
      );
    }

    const data = await executeGraphQL<{
      getTests?: {
        total?: number;
        results?: Array<{
          issueId?: string;
          testType?: { id?: string; name?: string; kind?: string };
          [key: string]: unknown;
        }>;
      };
    }>(
      `
      query GetTestByIssueKey($jql: String!, $limit: Int!, $start: Int) {
        getTests(jql: $jql, limit: $limit, start: $start) {
          total
          results {
            issueId
            testType {
              id
              name
              kind
            }
          }
        }
      }
    `,
      {
        jql: `project = ${projectKey.toUpperCase()} AND issuekey = ${issueKey}`,
        limit: 1,
        start: 0,
      },
    );

    const test = data.getTests?.results?.[0];

    if (!test) {
      throw new Error(`Xray test not found for issue key: ${issueKey}`);
    }

    return {
      issueId: test.issueId ?? null,
      issueKey: issueKey,
      summary: null,
      testType: test.testType?.name ?? null,
      raw: test as Record<string, unknown>,
    };
  }

  static async getTestPlanTests(options: {
    issueKeyOrId: string;
    limit?: number;
    start?: number;
  }): Promise<{
    status: "success" | "empty" | "unsupported" | "failed";
    issueId: string | null;
    issueKey: string | null;
    total: number;
    limit: number;
    start: number;
    results: Array<{
      issueId: string | null;
      issueKey: string | null;
      summary: string | null;
      testType: string | null;
      raw: Record<string, unknown>;
    }>;
    message?: string;
  }> {
    const input = options.issueKeyOrId.trim();

    if (!input) {
      throw new Error("Test plan issue key or ID is required.");
    }

    let planIssueId = input;
    let planIssueKey: string | null = null;

    if (!/^\d+$/.test(input)) {
      const issueKey = validateIssueKey(input);
      planIssueKey = issueKey;
      const projectKey = issueKey.split("-")[0]?.trim();

      if (!projectKey) {
        throw new Error(
          `Issue key is not in a valid project-key format: ${issueKey}`,
        );
      }

      const resolved = await executeGraphQL<{
        getTestPlans?: {
          total?: number;
          results?: Array<{ issueId?: string; [key: string]: unknown }>;
        };
      }>(
        `
        query GetTestPlanByIssueKey($jql: String!, $limit: Int!, $start: Int) {
          getTestPlans(jql: $jql, limit: $limit, start: $start) {
            total
            results {
              issueId
            }
          }
        }
      `,
        {
          jql: `project = ${projectKey.toUpperCase()} AND issuekey = ${issueKey}`,
          limit: 1,
          start: 0,
        },
      );

      const foundPlan = resolved.getTestPlans?.results?.[0];

      if (!foundPlan?.issueId) {
        return {
          status: "empty",
          issueId: null,
          issueKey: planIssueKey,
          total: 0,
          limit: Math.max(1, Number(options.limit ?? 50)),
          start: Math.max(0, Number(options.start ?? 0)),
          results: [],
          message: `No Xray test plan found for issue key: ${issueKey}`,
        };
      }

      planIssueId = foundPlan.issueId;
    }

    const limit = Math.max(1, Number(options.limit ?? 50));
    const start = Math.max(0, Number(options.start ?? 0));

    try {
      const data = await executeGraphQL<{
        getTestPlan?: {
          issueId?: string;
          tests?: {
            total?: number;
            results?: Array<{
              issueId?: string;
              testType?: { id?: string; name?: string; kind?: string };
              [key: string]: unknown;
            }>;
          };
        };
      }>(
        `
        query GetTestPlanTests($issueId: String!, $limit: Int!, $start: Int) {
          getTestPlan(issueId: $issueId) {
            issueId
            tests(limit: $limit, start: $start) {
              total
              results {
                issueId
                testType {
                  id
                  name
                  kind
                }
              }
            }
          }
        }
      `,
        {
          issueId: planIssueId,
          limit,
          start,
        },
      );

      const plan = data.getTestPlan;
      const tests = plan?.tests?.results ?? [];
      const total = plan?.tests?.total ?? tests.length;

      if (total === 0) {
        return {
          status: "empty",
          issueId: plan?.issueId ?? planIssueId ?? null,
          issueKey: planIssueKey,
          total: 0,
          limit,
          start,
          results: [],
          message: "The Xray test plan exists but has no associated tests.",
        };
      }

      return {
        status: "success",
        issueId: plan?.issueId ?? planIssueId ?? null,
        issueKey: planIssueKey,
        total,
        limit,
        start,
        results: tests.map((result) => ({
          issueId: result.issueId ?? null,
          issueKey: null,
          summary: null,
          testType: result.testType?.name ?? null,
          raw: result as Record<string, unknown>,
        })),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown Xray GraphQL error.";

      if (
        message.includes("Cannot query field") ||
        message.includes("unknown field")
      ) {
        return {
          status: "unsupported",
          issueId: planIssueId ?? null,
          issueKey: planIssueKey,
          total: 0,
          limit,
          start,
          results: [],
          message,
        };
      }

      return {
        status: "failed",
        issueId: planIssueId ?? null,
        issueKey: planIssueKey,
        total: 0,
        limit,
        start,
        results: [],
        message,
      };
    }
  }

  /**
   * Creates an Xray test (Manual by default) via the `createTest` mutation.
   * This is a write operation: it creates a new Jira issue.
   */
  static async createTest(
    options: CreateTestOptions,
  ): Promise<CreateTestResult> {
    const input = validateCreateTestOptions(options);

    const variables: Record<string, unknown> = {
      testType: { name: input.testType },
      steps: input.steps,
      jira: {
        fields: {
          project: { key: input.projectKey },
          summary: input.summary,
        },
      },
    };

    if (input.preconditionIssueIds) {
      variables.preconditionIssueIds = input.preconditionIssueIds;
    }

    if (input.folderPath) {
      variables.folderPath = input.folderPath;
    }

    const data = await executeGraphQL<{
      createTest?: {
        test?: { issueId?: string | null } | null;
        warnings?: Array<string | null> | null;
      } | null;
    }>(CREATE_TEST_MUTATION, variables);

    const created = data.createTest;

    if (!created) {
      throw new Error(
        "Xray GraphQL response did not include the createTest result.",
      );
    }

    const warnings = (created.warnings ?? []).filter(
      (warning): warning is string =>
        typeof warning === "string" && warning.trim() !== "",
    );

    const issueId = created.test?.issueId?.trim();

    if (!issueId) {
      const detail =
        warnings.length > 0 ? ` Warnings: ${warnings.join("; ")}` : "";
      throw new Error(
        `Xray createTest did not return a created test issue ID.${detail}`,
      );
    }

    return {
      issueId,
      summary: input.summary,
      testType: input.testType,
      warnings,
    };
  }

  /**
   * Read-only. Resolves numeric Xray test issue IDs into Jira issue keys and
   * summaries using a single `getTests(issueIds:)` query.
   *
   * Results follow the order of the (de-duplicated) input IDs. IDs that Xray
   * does not return as tests are reported as `not_found`; tests whose Jira key
   * is absent are reported as `key_not_resolved`. Keys are never guessed.
   */
  static async resolveTestIssues(
    issueIds: string[],
  ): Promise<ResolveTestIssuesResult> {
    const requestedIds = validateNumericIssueIds(issueIds);

    const data = await executeGraphQL<{
      getTests?: {
        total?: number;
        results?: Array<{ issueId?: string | null; jira?: unknown } | null>;
        warnings?: Array<string | null> | null;
      } | null;
    }>(RESOLVE_TEST_ISSUES_QUERY, {
      issueIds: requestedIds,
      limit: requestedIds.length,
    });

    const testsById = new Map<string, unknown>();

    for (const test of data.getTests?.results ?? []) {
      const id = test?.issueId?.trim();
      if (id && !testsById.has(id)) {
        testsById.set(id, test?.jira ?? null);
      }
    }

    const results = requestedIds.map((issueId): ResolvedTestIssue => {
      if (!testsById.has(issueId)) {
        return {
          issueId,
          issueKey: null,
          summary: null,
          issueType: null,
          projectKey: null,
          status: "not_found",
        };
      }

      const jira = testsById.get(issueId);
      const issueKey = extractIssueKeyFromJira(jira);

      return {
        issueId,
        issueKey,
        summary: extractSummaryFromJira(jira),
        issueType: extractIssueTypeFromJira(jira),
        projectKey: extractProjectKeyFromJira(jira),
        status: issueKey ? "resolved" : "key_not_resolved",
      };
    });

    const warnings = (data.getTests?.warnings ?? []).filter(
      (warning): warning is string =>
        typeof warning === "string" && warning.trim() !== "",
    );

    return { results, warnings };
  }
}

export async function getExpandedTest(
  issueId: string,
): Promise<Record<string, unknown>> {
  return XrayClient.getExpandedTest(issueId);
}
