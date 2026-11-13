import fs from 'node:fs';
import path from 'node:path';

/**
 * Links each automated test to its scenario in qa/04-test-design.md.
 *
 * Once the scenarios exist as Xray tests, map scenario IDs to Xray keys in
 * e2e/xray-test-keys.json, e.g. { "TS-001": "AQA-101" }. Mapped tests then get a
 * `test_key` annotation, which the JUnit reporter writes as a property so
 * mcp-qa-lab's XrayJUnitImporter can import the results.
 */
const keysFile = path.join(__dirname, '..', 'xray-test-keys.json');
const xrayKeys: Record<string, string> = fs.existsSync(keysFile)
  ? (JSON.parse(fs.readFileSync(keysFile, 'utf8')) as Record<string, string>)
  : {};

export interface ScenarioDetails {
  tag: string[];
  annotation: { type: string; description: string }[];
}

export function scenario(id: string, story: string, requirements: string): ScenarioDetails {
  const key = xrayKeys[id];
  return {
    tag: [`@${id}`, `@${story}`],
    annotation: [
      { type: 'scenario_id', description: id },
      { type: 'story', description: story },
      { type: 'requirements', description: requirements },
      ...(key ? [{ type: 'test_key', description: key }] : []),
    ],
  };
}
