import { getExpandedTest } from "./XrayClient";
import { XrayTestParser } from "./XrayTestParser";

/** Numeric Xray issue ID from the command line, e.g. `npm run xray:verify-parser -- 10013 "Optional summary"`. */
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
  const issueId = issueIdFromArgs("xray:verify-parser");
  if (!issueId) return;

  try {
    const expandedTest = await getExpandedTest(issueId);

    // Optional second argument: the Jira summary, used as the test name fallback.
    const issueSummary = process.argv[3]?.trim() ?? "";

    const parsedTest = XrayTestParser.parse(expandedTest, issueSummary);

    console.log("\n========== PARSED XRAY TEST ==========\n");

    console.log(JSON.stringify(parsedTest, null, 2));

    console.log("\n========== VERIFICATION ==========");

    console.log(`Test name: ${parsedTest.testName}`);
    console.log(`Test type: ${parsedTest.testType}`);
    console.log(`Preconditions: ${parsedTest.preconditions.length}`);
    console.log(`Test steps: ${parsedTest.steps.length}`);
    console.log(`Expected result: ${parsedTest.expectedResult}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    console.error(`Parser verification failed: ${message}`);

    process.exitCode = 1;
  }
}

main();
