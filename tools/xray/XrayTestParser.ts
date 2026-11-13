export interface XrayTestStep {
  stepNumber: number;
  action: string;
  testData: string;
  expectedResult: string;
}

export interface ParsedXrayTest {
  issueId: string;
  testName: string;
  testType: string;
  preconditions: string[];
  steps: XrayTestStep[];
  expectedResult: string;
}

interface XrayExpandedStep {
  id?: string;
  action?: string;
  data?: string;
  result?: string;
}

interface XrayExpandedTest {
  issueId?: string;
  testType?: {
    id?: string;
    name?: string;
    kind?: string;
  };
  unstructured?: string;
  steps?: XrayExpandedStep[];
  preconditions?: {
    results?: Array<{
      definition?: string;
    }>;
  };
}

interface ParsedSections {
  testName: string;
  preconditions: string[];
  testSteps: string[];
  expectedResult: string;
}

export class XrayTestParser {
  static parse(
    expandedTest: XrayExpandedTest,
    issueSummary = "",
  ): ParsedXrayTest {
    const testType = expandedTest.testType?.name ?? "Unknown";

    const structuredSteps = Array.isArray(expandedTest.steps)
      ? expandedTest.steps
      : [];

    const isGenericTest =
      testType.toLowerCase() === "generic" || structuredSteps.length === 0;

    if (isGenericTest) {
      return this.parseGenericTest(expandedTest, issueSummary);
    }

    return this.parseManualTest(expandedTest, issueSummary);
  }

  private static getLinkedPreconditions(
    expandedTest: XrayExpandedTest,
  ): string[] {
    return (
      expandedTest.preconditions?.results
        ?.map((item) => item.definition?.trim() ?? "")
        .filter(Boolean) ?? []
    );
  }

  private static parseGenericTest(
    expandedTest: XrayExpandedTest,
    issueSummary: string,
  ): ParsedXrayTest {
    const sections = this.extractSections(expandedTest.unstructured ?? "");

    const preconditions = [
      ...sections.preconditions,
      ...this.getLinkedPreconditions(expandedTest),
    ];

    const steps = sections.testSteps.map((action, index) => ({
      stepNumber: index + 1,
      action,
      testData: "",
      expectedResult: "",
    }));

    return {
      issueId: expandedTest.issueId ?? "",
      testName: sections.testName || issueSummary,
      testType: expandedTest.testType?.name ?? "Generic",
      preconditions,
      steps,
      expectedResult: sections.expectedResult,
    };
  }

  private static parseManualTest(
    expandedTest: XrayExpandedTest,
    issueSummary: string,
  ): ParsedXrayTest {
    const structuredSteps = expandedTest.steps ?? [];

    const steps = structuredSteps.map((step, index) => ({
      stepNumber: index + 1,
      action: step.action?.trim() ?? "",
      testData: step.data?.trim() ?? "",
      expectedResult: step.result?.trim() ?? "",
    }));

    return {
      issueId: expandedTest.issueId ?? "",
      testName: issueSummary,
      testType: expandedTest.testType?.name ?? "Manual",
      preconditions: this.getLinkedPreconditions(expandedTest),
      steps,
      expectedResult: "",
    };
  }

  private static extractSections(definition: string): ParsedSections {
    const lines = definition.split(/\r?\n/).map((line) => line.trim());

    let currentSection = "name";

    let testName = "";
    let expectedResult = "";

    const preconditions: string[] = [];
    const testSteps: string[] = [];

    for (const line of lines) {
      if (!line) continue;

      const normalizedHeading = line
        .replace(/[:#*]+$/g, "")
        .trim()
        .toLowerCase();

      if (/^precondition(s)?$/.test(normalizedHeading)) {
        currentSection = "preconditions";
        continue;
      }

      if (/^(test|test steps|steps)$/.test(normalizedHeading)) {
        currentSection = "steps";
        continue;
      }

      if (/^(expected result|expected results)$/.test(normalizedHeading)) {
        currentSection = "expectedResult";
        continue;
      }

      const cleanedLine = line
        .replace(/^\s*(?:#+\s*|[-*•]\s*|\d+[.)]\s*)/, "")
        .trim();

      if (!cleanedLine) continue;

      switch (currentSection) {
        case "name":
          testName = testName ? `${testName} ${cleanedLine}` : cleanedLine;
          break;

        case "preconditions":
          preconditions.push(cleanedLine);
          break;

        case "steps":
          testSteps.push(cleanedLine);
          break;

        case "expectedResult":
          expectedResult = expectedResult
            ? `${expectedResult} ${cleanedLine}`
            : cleanedLine;
          break;
      }
    }

    return {
      testName,
      preconditions,
      testSteps,
      expectedResult,
    };
  }
}
