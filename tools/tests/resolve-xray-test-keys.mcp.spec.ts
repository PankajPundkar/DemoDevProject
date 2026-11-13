import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import path from "node:path";

import { expect, test } from "@playwright/test";

/**
 * MCP-level tests for the resolve_xray_test_keys tool.
 *
 * The server is started over stdio with dummy XRAY_* variables pointing at an
 * unreachable local address (pre-set variables take precedence over .env), so
 * no request can reach Xray. Only tools/list and invalid tools/call requests
 * (rejected by input validation before the handler runs) are sent.
 */

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const SERVER_ENTRY = path.join(
  PROJECT_ROOT,
  "tools/xray-mcp/server.ts",
);
const TSX_CLI = path.join(PROJECT_ROOT, "node_modules/tsx/dist/cli.mjs");

type JsonRpcResponse = {
  id?: number;
  result?: Record<string, any>;
  error?: { code: number; message: string };
};

class McpStdioClient {
  private nextId = 1;
  private buffer = "";
  private pending = new Map<number, (message: JsonRpcResponse) => void>();

  constructor(private readonly child: ChildProcessWithoutNullStreams) {
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      this.buffer += chunk;
      let newline: number;
      while ((newline = this.buffer.indexOf("\n")) >= 0) {
        const line = this.buffer.slice(0, newline).trim();
        this.buffer = this.buffer.slice(newline + 1);
        if (!line.startsWith("{")) continue;
        const message = JSON.parse(line) as JsonRpcResponse;
        if (typeof message.id === "number") {
          this.pending.get(message.id)?.(message);
          this.pending.delete(message.id);
        }
      }
    });
  }

  request(method: string, params: unknown = {}): Promise<JsonRpcResponse> {
    const id = this.nextId++;
    const response = new Promise<JsonRpcResponse>((resolve) =>
      this.pending.set(id, resolve),
    );
    this.child.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n",
    );
    return response;
  }

  notify(method: string): void {
    this.child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method }) + "\n");
  }
}

test.describe("resolve_xray_test_keys MCP tool", () => {
  test.describe.configure({ mode: "serial", timeout: 60_000 });

  let child: ChildProcessWithoutNullStreams;
  let client: McpStdioClient;

  test.beforeAll(async () => {
    child = spawn(process.execPath, [TSX_CLI, SERVER_ENTRY], {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        XRAY_CLIENT_ID: "dummy-client-id",
        XRAY_CLIENT_SECRET: "dummy-client-secret",
        XRAY_BASE_URL: "http://127.0.0.1:9/api/v2",
      },
    });
    client = new McpStdioClient(child);

    const init = await client.request("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "playwright-mcp-test", version: "0.0.0" },
    });
    expect(init.result?.serverInfo?.name).toBe("xray-mcp-server");
    client.notify("notifications/initialized");
  });

  test.afterAll(() => {
    child?.kill();
  });

  test("is registered alongside the existing tools", async () => {
    const list = await client.request("tools/list");
    const names = (list.result?.tools ?? []).map((t: any) => t.name);

    expect(names).toEqual(
      expect.arrayContaining([
        "get_xray_auth_status",
        "get_expanded_test",
        "search_xray_tests",
        "get_xray_test",
        "get_xray_test_details",
        "get_xray_test_plan_tests",
        "create_xray_manual_test",
        "resolve_xray_test_keys",
      ]),
    );
    expect(names).toHaveLength(8);
  });

  test("is annotated read-only and validates 1-100 numeric IDs", async () => {
    const list = await client.request("tools/list");
    const tool = (list.result?.tools ?? []).find(
      (t: any) => t.name === "resolve_xray_test_keys",
    );

    expect(tool.annotations).toMatchObject({ readOnlyHint: true });
    expect(tool.inputSchema.required).toEqual(["issueIds"]);
    expect(tool.inputSchema.properties.issueIds).toMatchObject({
      type: "array",
      minItems: 1,
      maxItems: 100,
      items: { type: "string", pattern: "^\\d+$" },
    });
  });

  for (const [label, issueIds] of [
    ["an empty list", []],
    ["a non-numeric ID", ["AQA-13"]],
    ["more than 100 IDs", Array.from({ length: 101 }, (_, i) => `${i + 1}`)],
  ] as Array<[string, string[]]>) {
    test(`rejects ${label} with a validation error`, async () => {
      const response = await client.request("tools/call", {
        name: "resolve_xray_test_keys",
        arguments: { issueIds },
      });

      const isValidationError =
        response.error !== undefined ||
        (response.result?.isError === true &&
          JSON.stringify(response.result?.content).includes("issueIds"));

      expect(isValidationError).toBe(true);
    });
  }
});
