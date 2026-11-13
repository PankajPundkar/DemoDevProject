import { getExpandedTest } from "./XrayClient";

function formatOptionalText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim() || "(empty)";
  }

  return value == null ? "(empty)" : String(value);
}

function printJson(label: string, value: unknown): void {
  console.log(`\n${label}:`);

  if (value == null) {
    console.log("(empty)");
    return;
  }

  console.log(JSON.stringify(value, null, 2));
}

/** Numeric Xray issue ID from the command line, e.g. `npm run xray:verify-test -- 10013`. */
function issueIdFromArgs(script: string): string | null {
  const issueId = process.argv[2]?.trim();
  if (!issueId || !/^\d+$/.test(issueId)) {
    console.error(`Usage: npm run ${script} -- <numeric Xray issue ID>`);
    process.exitCode = 1;
    return null;
  }
  return issueId;
}

async function main(): Promise<void> {
  const issueId = issueIdFromArgs("xray:verify-test");
  if (!issueId) return;

  try {
    const test = await getExpandedTest(issueId);

    const testType = test.testType as
      | {
          id?: string | null;
          name?: string | null;
          kind?: string | null;
        }
      | undefined;

    const steps = Array.isArray(test.steps) ? test.steps : [];

    const preconditionsValue = test.preconditions as
      | {
          total?: number;
          results?: Array<Record<string, unknown>>;
        }
      | undefined;

    const preconditions = Array.isArray(preconditionsValue?.results)
      ? preconditionsValue.results
      : [];

    console.log("\n========== XRAY TEST DETAILS ==========");

    console.log(`Issue ID: ${formatOptionalText(test.issueId)}`);

    console.log(
      `Test type: ${formatOptionalText(testType?.name ?? testType?.kind)}`,
    );

    console.log(`Test type ID: ${formatOptionalText(testType?.id)}`);

    console.log(`Scenario type: ${formatOptionalText(test.scenarioType)}`);

    console.log(`Status: ${formatOptionalText(test.status)}`);

    // Structured test steps
    console.log("\n========== TEST STEPS ==========");

    if (steps.length === 0) {
      console.log("No structured steps found.");
    } else {
      steps.forEach((step, index) => {
        const currentStep = step as Record<string, unknown>;

        console.log(`\nStep ${index + 1}:`);
        console.log(`ID: ${formatOptionalText(currentStep.id)}`);
        console.log(`Action: ${formatOptionalText(currentStep.action)}`);
        console.log(`Data: ${formatOptionalText(currentStep.data)}`);
        console.log(
          `Expected result: ${formatOptionalText(currentStep.result)}`,
        );
      });
    }

    // Preconditions
    console.log("\n========== PRECONDITIONS ==========");

    console.log(
      `Total preconditions: ${formatOptionalText(preconditionsValue?.total)}`,
    );

    if (preconditions.length === 0) {
      console.log("No preconditions found.");
    } else {
      preconditions.forEach((precondition, index) => {
        const preconditionType = precondition.preconditionType as
          | {
              id?: string | null;
              name?: string | null;
              kind?: string | null;
            }
          | undefined;

        console.log(`\nPrecondition ${index + 1}:`);
        console.log(`Issue ID: ${formatOptionalText(precondition.issueId)}`);
        console.log(
          `Type: ${formatOptionalText(preconditionType?.name ?? preconditionType?.kind)}`,
        );
        console.log(
          `Definition: ${formatOptionalText(precondition.definition)}`,
        );
      });
    }

    // Unstructured test definition
    printJson("UNSTRUCTURED TEST DEFINITION", test.unstructured);

    // Gherkin definition
    printJson("GHERKIN DEFINITION", test.gherkin);

    // Jira metadata
    printJson("JIRA METADATA", test.jira);

    // Xray warnings
    printJson("XRAY WARNINGS", test.warnings);

    console.log("\n========== LOOKUP COMPLETED ==========");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    console.error(`Xray test lookup failed: ${message}`);
    process.exitCode = 1;
  }
}

main();
