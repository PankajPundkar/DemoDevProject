/**
 * Imports a Playwright JUnit report into Xray as a new Test Execution.
 *
 * Usage:
 *   npm run xray:import-results                      # test-results/junit-results.xml
 *   npm run xray:import-results -- path/to/junit.xml # any JUnit report, e.g. from DemoDevProject
 *
 * Configuration (from .env locally, or from the environment in CI):
 *   XRAY_CLIENT_ID, XRAY_CLIENT_SECRET, XRAY_BASE_URL   Xray Cloud API credentials
 *   JIRA_PROJECT_KEY                                    Jira project for the Test Execution, e.g. AQA
 *   XRAY_TEST_PLAN_KEY                                  Test Plan the execution is added to, e.g. AQA-20
 *
 * Every test case in the report must carry exactly one `test_key` property (a Playwright
 * annotation of type "test_key" with embedAnnotationsAsProperties), so results are attached
 * to existing Xray tests and Xray never creates new ones.
 */
import path from "node:path";

import { getXrayEnvironmentState } from "./XrayAuth";
import { XrayJUnitImporter } from "./XrayJUnitImporter";

const DEFAULT_REPORT = "test-results/junit-results.xml";

async function main(): Promise<void> {
  // Also loads .env (if present) so the keys below can come from it.
  const xrayEnv = getXrayEnvironmentState();

  const missing = [...xrayEnv.missing];
  const projectKey = process.env.JIRA_PROJECT_KEY?.trim() ?? "";
  const testPlanKey = process.env.XRAY_TEST_PLAN_KEY?.trim() ?? "";
  if (!projectKey) missing.push("JIRA_PROJECT_KEY");
  if (!testPlanKey) missing.push("XRAY_TEST_PLAN_KEY");

  if (missing.length > 0) {
    console.error(`Xray import not started. Missing configuration: ${missing.join(", ")}.`);
    process.exitCode = 1;
    return;
  }

  const reportPath = path.resolve(process.argv[2] ?? DEFAULT_REPORT);

  try {
    const result = await XrayJUnitImporter.importFromFile(reportPath, {
      projectKey,
      testPlanKey,
    });
    console.log(
      `Xray import succeeded: Test Execution ${result.testExecutionKey || "(key not returned)"} in Test Plan ${result.testPlanKey}.`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Xray import failed: ${message}`);
    process.exitCode = 1;
  }
}

void main();
