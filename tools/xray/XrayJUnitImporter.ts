import { readFile } from "node:fs/promises";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { getXrayAuthToken } from "./XrayAuth";

/** A Jira issue key such as AQA-12 (project key, dash, number). */
const ISSUE_KEY_PATTERN = /^[A-Z][A-Z0-9_]*-\d+$/;

export interface XrayImportLogger {
  info?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
}

export interface XrayJUnitImportOptions {
  projectKey: string;
  testPlanKey: string;
  baseUrl?: string;
  logger?: XrayImportLogger;
  /**
   * Optional: the exact set of Xray test keys the report must contain. When given,
   * the import is refused if any key is missing or unexpected. When omitted, every
   * test case still needs exactly one valid, unique test_key.
   */
  expectedTestKeys?: readonly string[];
}

export interface XrayJUnitImportResult {
  status: number;
  projectKey: string;
  testPlanKey: string;
  testExecutionKey: string;
  response: unknown;
}

function ensureXrayBaseUrl(baseUrl?: string): string {
  const value = (baseUrl ?? process.env.XRAY_BASE_URL ?? "").trim();

  if (!value) {
    throw new Error("Missing required environment variable: XRAY_BASE_URL");
  }

  return value.replace(/\/+$/, "");
}

function ensureArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function parseJUnitXml(xmlContent: string): Record<string, unknown> {
  const validationResult = XMLValidator.validate(xmlContent);

  if (validationResult !== true) {
    throw new Error(
      `JUnit XML is not valid XML: ${validationResult.err?.msg ?? "unknown XML parsing error"}`,
    );
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    parseTagValue: true,
    trimValues: true,
  });

  return parser.parse(xmlContent) as Record<string, unknown>;
}

function collectTestCases(parsedXml: unknown): Record<string, unknown>[] {
  const testCases: Record<string, unknown>[] = [];
  const seen = new Set<object>();

  const visit = (value: unknown): void => {
    if (value === null || value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item);
      }
      return;
    }

    if (typeof value !== "object") {
      return;
    }

    if (seen.has(value)) {
      return;
    }

    seen.add(value);

    if (Object.prototype.hasOwnProperty.call(value, "testcase")) {
      const testcaseValue = (value as Record<string, unknown>).testcase;
      for (const testcase of ensureArray(testcaseValue)) {
        if (testcase && typeof testcase === "object") {
          testCases.push(testcase as Record<string, unknown>);
        }
      }
    }

    for (const child of Object.values(value as Record<string, unknown>)) {
      visit(child);
    }
  };

  visit(parsedXml);
  return testCases;
}

function validateJUnitXml(
  xmlContent: string,
  expectedTestKeys?: readonly string[],
): string[] {
  const trimmedXml = xmlContent.trim();

  if (!trimmedXml) {
    throw new Error("JUnit XML is empty.");
  }

  const parsedXml = parseJUnitXml(trimmedXml);
  const testcaseNodes = collectTestCases(parsedXml);

  if (testcaseNodes.length === 0) {
    throw new Error("JUnit XML does not contain any test cases.");
  }

  if (expectedTestKeys && testcaseNodes.length !== expectedTestKeys.length) {
    throw new Error(
      `JUnit XML must contain exactly ${expectedTestKeys.length} test cases. Found ${testcaseNodes.length}.`,
    );
  }

  const testKeys: string[] = [];

  for (const testcase of testcaseNodes) {
    const propertyEntries = ensureArray(
      (testcase.properties as { property?: unknown } | undefined)?.property,
    );
    const testKeyEntries = propertyEntries.filter(
      (property): property is Record<string, unknown> =>
        !!property &&
        typeof property === "object" &&
        (property as Record<string, unknown>).name === "test_key",
    );

    if (testKeyEntries.length !== 1) {
      const name =
        typeof testcase.name === "string" ? ` ("${testcase.name}")` : "";
      throw new Error(
        `Each testcase must contain exactly one test_key property. Found ${testKeyEntries.length}${name}. ` +
          "Add a test_key annotation to the test, or Xray would create a new test for it.",
      );
    }

    const testKeyValue = testKeyEntries[0].value;

    if (typeof testKeyValue !== "string" || testKeyValue.trim() === "") {
      throw new Error("A testcase test_key property is missing a valid value.");
    }

    if (!ISSUE_KEY_PATTERN.test(testKeyValue.trim())) {
      throw new Error(
        `test_key "${testKeyValue.trim()}" is not a valid Jira issue key.`,
      );
    }

    testKeys.push(testKeyValue.trim());
  }

  const duplicates = testKeys.filter(
    (key, index) => testKeys.indexOf(key) !== index,
  );

  if (duplicates.length > 0) {
    throw new Error(
      `JUnit XML contains duplicate test_key values: ${[...new Set(duplicates)].join(", ")}.`,
    );
  }

  if (!expectedTestKeys) {
    return testKeys;
  }

  const expectedSet = new Set<string>(expectedTestKeys);
  const missingKeys = expectedTestKeys.filter(
    (key) => !testKeys.includes(key),
  );
  const unexpectedKeys = testKeys.filter((key) => !expectedSet.has(key));

  if (missingKeys.length > 0 || unexpectedKeys.length > 0) {
    const details = [
      missingKeys.length > 0 ? `missing=${missingKeys.join(", ")}` : null,
      unexpectedKeys.length > 0
        ? `unexpected=${unexpectedKeys.join(", ")}`
        : null,
    ]
      .filter((value): value is string => value !== null)
      .join("; ");

    throw new Error(
      `JUnit XML does not match the expected Xray test key set. ${details}`,
    );
  }

  return testKeys;
}

function extractExecutionKeyFromResponse(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const response = payload as Record<string, unknown>;

  const rootKey = response.key;
  if (typeof rootKey === "string" && ISSUE_KEY_PATTERN.test(rootKey.trim())) {
    return rootKey.trim();
  }

  const testExecutionIssue = response.testExecutionIssue;
  if (testExecutionIssue && typeof testExecutionIssue === "object") {
    const executionIssue = testExecutionIssue as Record<string, unknown>;
    const executionKey = executionIssue.key;
    if (
      typeof executionKey === "string" &&
      ISSUE_KEY_PATTERN.test(executionKey.trim())
    ) {
      return executionKey.trim();
    }
  }

  return null;
}

function extractErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  for (const candidate of ["message", "error", "errors", "detail", "details"]) {
    const value = record[candidate];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (Array.isArray(value)) {
      const message = value
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (item && typeof item === "object") {
            const nested = item as Record<string, unknown>;
            const nestedMessage = nested.message;
            return typeof nestedMessage === "string" ? nestedMessage : null;
          }

          return null;
        })
        .filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0,
        );

      if (message.length > 0) {
        return message.join("; ");
      }
    }

    if (value && typeof value === "object") {
      const nested = extractErrorMessage(value);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

function redactSecrets(value: string): string {
  if (!value) {
    return value;
  }

  return value
    .replace(/(Authorization\s*:\s*Bearer\s+)[A-Za-z0-9._-]+/gi, "$1[REDACTED]")
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, "$1[REDACTED]")
    .replace(/("access_token"\s*:\s*")([^"]+)"/gi, '$1[REDACTED]"')
    .replace(/("token"\s*:\s*")([^"]+)"/gi, '$1[REDACTED]"')
    .replace(/("client_secret"\s*:\s*")([^"]+)"/gi, '$1[REDACTED]"')
    .replace(/("clientSecret"\s*:\s*")([^"]+)"/gi, '$1[REDACTED]"')
    .replace(/("jwt"\s*:\s*")([^"]+)"/gi, '$1[REDACTED]"')
    .replace(/("authorization"\s*:\s*")([^"]+)"/gi, '$1[REDACTED]"')
    .replace(
      /(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/g,
      "[REDACTED_JWT]",
    );
}

function logXrayResponse(
  logger: XrayImportLogger,
  status: number,
  statusText: string,
  rawBody: string,
): void {
  const sanitizedBody = redactSecrets(rawBody);
  const sanitizedText = sanitizedBody.trim();

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(sanitizedText || '""') as unknown;
  } catch {
    parsedBody = sanitizedText || "";
  }

  logger.info?.("Xray HTTP response received", {
    status,
    statusText,
    response: parsedBody,
  });
}

export class XrayJUnitImporter {
  static async importFromFile(
    xmlFilePath: string,
    options: XrayJUnitImportOptions,
  ): Promise<XrayJUnitImportResult> {
    const xml = await readFile(xmlFilePath, "utf8");
    return this.importXml(xml, options);
  }

  static async importXml(
    xmlContent: string,
    options: XrayJUnitImportOptions,
  ): Promise<XrayJUnitImportResult> {
    if (!options.projectKey || !options.projectKey.trim()) {
      throw new Error("projectKey is required for Xray JUnit import.");
    }

    if (!options.testPlanKey || !options.testPlanKey.trim()) {
      throw new Error("testPlanKey is required for Xray JUnit import.");
    }

    const trimmedXml = xmlContent.trim();
    const testKeys = validateJUnitXml(trimmedXml, options.expectedTestKeys);

    const projectKey = options.projectKey.trim();
    const testPlanKey = options.testPlanKey.trim();

    const authToken = await getXrayAuthToken();
    const baseUrl = ensureXrayBaseUrl(options.baseUrl);
    const logger = options.logger ?? console;

    const endpoint = `${baseUrl}/import/execution/junit`;
    const url = new URL(endpoint);
    url.searchParams.set("projectKey", projectKey);
    url.searchParams.set("testPlanKey", testPlanKey);

    logger.info?.("Submitting JUnit XML to Xray import endpoint", {
      projectKey,
      testPlanKey,
      testCount: testKeys.length,
      xmlLength: trimmedXml.length,
    });

    let response: Response;

    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "text/xml",
          Accept: "application/json",
        },
        body: trimmedXml,
      });
    } catch {
      throw new Error("Unable to connect to the Xray JUnit import endpoint.");
    }

    const responseText = await response.text();
    logXrayResponse(logger, response.status, response.statusText, responseText);

    if (!response.ok) {
      const parsedError = responseText.trim()
        ? (() => {
            try {
              return JSON.parse(responseText) as unknown;
            } catch {
              return responseText;
            }
          })()
        : null;

      const errorMessage =
        extractErrorMessage(parsedError) ?? responseText.trim();

      throw new Error(
        `Xray JUnit import failed (${response.status} ${response.statusText}). ${errorMessage || "No response details were returned."}`,
      );
    }

    if (!responseText.trim()) {
      throw new Error(
        "Xray JUnit import succeeded but no response body was returned.",
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(responseText) as unknown;
    } catch {
      parsed = responseText;
    }

    const executionKey = extractExecutionKeyFromResponse(parsed);

    logger.info?.("Xray JUnit import succeeded", {
      projectKey,
      testPlanKey,
      testExecutionKey: executionKey ?? "(not returned)",
    });

    return {
      status: response.status,
      projectKey,
      testPlanKey,
      testExecutionKey: executionKey ?? "",
      response: parsed,
    };
  }
}

export async function importJUnitResultsToXray(
  xmlContent: string,
  options: XrayJUnitImportOptions,
): Promise<XrayJUnitImportResult> {
  return XrayJUnitImporter.importXml(xmlContent, options);
}

export async function importJUnitResultsFileToXray(
  xmlFilePath: string,
  options: XrayJUnitImportOptions,
): Promise<XrayJUnitImportResult> {
  return XrayJUnitImporter.importFromFile(xmlFilePath, options);
}
