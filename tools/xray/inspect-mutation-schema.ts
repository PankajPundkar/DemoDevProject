import { getXrayAuthToken, getXrayEnvironmentState } from "./XrayAuth";

/**
 * Read-only diagnostic: introspects the Xray GraphQL schema to list mutation
 * field names and check for the types needed to create tests.
 *
 * Only a GraphQL introspection *query* is sent. No mutations are executed and
 * no Jira/Xray data is modified. Tokens and credentials are never printed.
 */

const TYPES_TO_CHECK = [
  "CreateTestResult",
  "CreateStepInput",
  "UpdateTestTypeInput",
] as const;

const SENSITIVE_KEY_PATTERN =
  /token|secret|password|authorization|credential|client_id|api[_-]?key/i;

const TYPE_REF_FRAGMENT = `
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
      }
    }
  }
`;

function typeAlias(typeName: string): string {
  return `type_${typeName}`;
}

function buildIntrospectionQuery(): string {
  const typeQueries = TYPES_TO_CHECK.map(
    (typeName) => `
      ${typeAlias(typeName)}: __type(name: "${typeName}") {
        name
        kind
        fields {
          name
          type { ${TYPE_REF_FRAGMENT} }
        }
        inputFields {
          name
          type { ${TYPE_REF_FRAGMENT} }
        }
      }
    `,
  ).join("\n");

  return `
    query IntrospectMutationSchema {
      __schema {
        mutationType {
          name
          fields {
            name
            args {
              name
              type { ${TYPE_REF_FRAGMENT} }
            }
            type { ${TYPE_REF_FRAGMENT} }
          }
        }
      }
      ${typeQueries}
    }
  `;
}

function getGraphQLUrl(): string {
  const { baseUrl } = getXrayEnvironmentState();

  if (!baseUrl) {
    throw new Error("Missing required environment variable: XRAY_BASE_URL");
  }

  return `${baseUrl}/graphql`;
}

async function runIntrospection<T = unknown>(query: string): Promise<T> {
  const token = await getXrayAuthToken();

  let response: Response;

  try {
    response = await fetch(getGraphQLUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    });
  } catch {
    throw new Error("Unable to connect to the Xray GraphQL endpoint.");
  }

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `GraphQL request failed (${response.status} ${response.statusText}).`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("GraphQL response was not valid JSON.");
  }

  const record = parsed as { errors?: Array<{ message?: string }>; data?: T };

  if (record.errors && record.errors.length > 0) {
    const messages = record.errors
      .map((err) => (typeof err?.message === "string" ? err.message : null))
      .filter((msg): msg is string => Boolean(msg));

    if (messages.length > 0) {
      throw new Error(sanitizeString(messages.join("; ")));
    }
  }

  if (!record.data) {
    throw new Error("GraphQL response did not contain data.");
  }

  return record.data as T;
}

function sanitizeString(value: string): string {
  let result = value;

  // Never let raw credential values leak, even if echoed back by the API.
  for (const name of ["XRAY_CLIENT_ID", "XRAY_CLIENT_SECRET"]) {
    const secret = process.env[name]?.trim();
    if (secret) {
      result = result.split(secret).join("[REDACTED]");
    }
  }

  // Redact anything that looks like a bearer token or JWT.
  return result
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [REDACTED]")
    .replace(
      /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
      "[REDACTED]",
    );
}

/**
 * Deep-sanitizes a value. Schema metadata keys (`name`, `kind`, ...) are kept;
 * any object key that looks like a credential has its value redacted.
 */
function sanitize(value: unknown): unknown {
  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : sanitize(entry),
      ]),
    );
  }

  return value;
}

function formatType(type: any): string {
  if (!type) return "unknown";
  if (type.kind === "NON_NULL") return `${formatType(type.ofType)}!`;
  if (type.kind === "LIST") return `[${formatType(type.ofType)}]`;
  return type.name ?? type.kind;
}

function summarizeType(typeName: string, type: any) {
  if (!type) {
    return { name: typeName, exists: false };
  }

  const members = (type.fields ?? type.inputFields ?? []) as any[];

  return {
    name: type.name,
    exists: true,
    kind: type.kind,
    fields: members.map((field) => ({
      name: field.name,
      type: formatType(field.type),
    })),
  };
}

async function main(): Promise<void> {
  const data = await runIntrospection<Record<string, any>>(
    buildIntrospectionQuery(),
  );

  const mutationFields = (data.__schema?.mutationType?.fields ?? []) as any[];
  const mutationNames = mutationFields.map((field) => field.name as string);
  const createTestField = mutationFields.find(
    (field) => field.name === "createTest",
  );

  const report = {
    mutationType: data.__schema?.mutationType?.name ?? null,
    mutationCount: mutationNames.length,
    mutationNames: [...mutationNames].sort(),
    createTest: createTestField
      ? {
          available: true,
          returns: formatType(createTestField.type),
          args: (createTestField.args ?? []).map((arg: any) => ({
            name: arg.name,
            type: formatType(arg.type),
          })),
        }
      : { available: false },
    types: Object.fromEntries(
      TYPES_TO_CHECK.map((typeName) => [
        typeName,
        summarizeType(typeName, data[typeAlias(typeName)]),
      ]),
    ),
  };

  console.log("Xray GraphQL mutation schema (sanitized):");
  console.log(JSON.stringify(sanitize(report), null, 2));

  console.log("\nSummary:");
  console.log(
    `  createTest mutation: ${createTestField ? "AVAILABLE" : "NOT AVAILABLE"}`,
  );
  for (const typeName of TYPES_TO_CHECK) {
    const exists = Boolean(data[typeAlias(typeName)]);
    console.log(`  ${typeName}: ${exists ? "exists" : "MISSING"}`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(sanitizeString(message));
  process.exitCode = 1;
});
