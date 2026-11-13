import { getXrayAuthToken } from "./XrayAuth";

async function runGraphQL<T = unknown>(query: string): Promise<T> {
  const token = await getXrayAuthToken();
  const baseUrl = process.env.XRAY_BASE_URL?.trim();

  if (!baseUrl) {
    throw new Error("Missing required environment variable: XRAY_BASE_URL");
  }

  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  });

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
      throw new Error(messages.join("; "));
    }
  }

  if (!record.data) {
    throw new Error("GraphQL response did not contain data.");
  }

  return record.data as T;
}

function formatType(type: any): string {
  if (!type) return "unknown";
  if (type.kind === "NON_NULL") return `${formatType(type.ofType)}!`;
  if (type.kind === "LIST") return `[${formatType(type.ofType)}]`;
  return type.name ?? type.kind;
}

async function inspectType(typeName: string) {
  const query = `
    query IntrospectType {
      __type(name: "${typeName}") {
        name
        kind
        fields {
          name
          type {
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
          }
        }
      }
    }
  `;

  const result = await runGraphQL<{ __type?: any }>(query);
  return result.__type;
}

async function inspectQueryArgs() {
  const query = `
    query IntrospectQuery {
      __schema {
        queryType {
          fields {
            name
            args {
              name
              type {
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
            }
          }
        }
      }
    }
  `;

  const result = await runGraphQL<{ __schema?: any }>(query);
  return result.__schema?.queryType?.fields ?? [];
}

async function main() {
  const expanded = await inspectType("ExpandedTest");
  const getExpandedTestField = (await inspectQueryArgs()).find(
    (field: any) => field.name === "getExpandedTest",
  );

  console.log("ExpandedTest type:");
  console.log(
    JSON.stringify(
      {
        name: expanded?.name ?? null,
        kind: expanded?.kind ?? null,
        fields: (expanded?.fields ?? []).map((field: any) => ({
          name: field.name,
          type: formatType(field.type),
        })),
      },
      null,
      2,
    ),
  );

  console.log("\ngetExpandedTest argument schema:");
  console.log(
    JSON.stringify(
      {
        name: getExpandedTestField?.name ?? null,
        args: (getExpandedTestField?.args ?? []).map((arg: any) => ({
          name: arg.name,
          type: formatType(arg.type),
        })),
      },
      null,
      2,
    ),
  );

  const nestedTypeNames = [
    "ExpandedStep",
    "Precondition",
    "PreconditionResults",
    "TestType",
    "Attachment",
  ];

  if (nestedTypeNames.length > 0) {
    console.log("\nNested object types discovered:");
    for (const typeName of nestedTypeNames) {
      const nested = await inspectType(typeName);
      console.log(`\n${typeName}:`);
      console.log(
        JSON.stringify(
          (nested?.fields ?? []).map((field: any) => ({
            name: field.name,
            type: formatType(field.type),
          })),
          null,
          2,
        ),
      );
    }
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(message);
  process.exitCode = 1;
});
