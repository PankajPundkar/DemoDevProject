import fs from "node:fs";
import path from "node:path";

type XrayAuthPayload =
  | string
  | {
      token?: string;
      access_token?: string;
      expires_in?: number;
      [key: string]: unknown;
    };

const REQUIRED_ENV_VARS = [
  "XRAY_CLIENT_ID",
  "XRAY_CLIENT_SECRET",
  "XRAY_BASE_URL",
] as const;

let envLoaded = false;

/**
 * Loads the project's `.env` file once, if it exists.
 *
 * When `.env` is absent (CI, cloud agents, MCP hosts that inject `env`),
 * variables already present in `process.env` are used as-is. Missing
 * required variables are still reported by `getRequiredEnv()` and
 * `getXrayEnvironmentState()`.
 */
function ensureEnvLoaded(): void {
  if (envLoaded) {
    return;
  }

  const envPath = path.resolve(__dirname, "../../.env");

  if (!fs.existsSync(envPath)) {
    envLoaded = true;
    return;
  }

  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(envPath);
    envLoaded = true;
    return;
  }

  throw new Error(
    "Node.js runtime does not support .env file loading. Use a Node.js version with process.loadEnvFile() or load the environment before this module runs.",
  );
}

function getRequiredEnv(name: keyof typeof process.env): string {
  ensureEnvLoaded();

  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

function getXrayAuthenticateUrl(baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  if (!normalizedBaseUrl) {
    throw new Error("Missing required environment variable: XRAY_BASE_URL");
  }

  return `${normalizedBaseUrl}/authenticate`;
}

function extractTokenFromResponse(responseText: string): string {
  if (!responseText || responseText.trim() === "") {
    throw new Error("Xray authentication succeeded but no token was returned.");
  }

  let parsed: XrayAuthPayload;

  try {
    parsed = JSON.parse(responseText) as XrayAuthPayload;
  } catch {
    throw new Error("Xray authentication response was not valid JSON.");
  }

  if (typeof parsed === "string") {
    const token = parsed.trim();

    if (!token) {
      throw new Error(
        "Xray authentication succeeded but no token was returned.",
      );
    }

    return token;
  }

  const token = parsed?.token ?? parsed?.access_token;

  if (typeof token !== "string" || token.trim() === "") {
    throw new Error("Xray authentication succeeded but no token was returned.");
  }

  return token.trim();
}

export function getXrayEnvironmentState(): {
  configured: boolean;
  missing: string[];
  baseUrl?: string;
} {
  ensureEnvLoaded();

  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]?.trim());
  const baseUrl = process.env.XRAY_BASE_URL?.trim();

  return {
    configured: missing.length === 0,
    missing: [...missing],
    baseUrl: baseUrl ? baseUrl.replace(/\/+$/, "") : undefined,
  };
}

export async function getXrayAuthToken(): Promise<string> {
  const clientId = getRequiredEnv("XRAY_CLIENT_ID");
  const clientSecret = getRequiredEnv("XRAY_CLIENT_SECRET");
  const baseUrl = getRequiredEnv("XRAY_BASE_URL");
  const authUrl = getXrayAuthenticateUrl(baseUrl);

  let response: Response;

  try {
    response = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
  } catch (error) {
    throw new Error("Unable to connect to the Xray authentication endpoint.");
  }

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `Xray authentication failed (${response.status} ${response.statusText}).`,
    );
  }

  return extractTokenFromResponse(responseText);
}

export class XrayAuth {
  static async authenticate(): Promise<string> {
    return getXrayAuthToken();
  }

  static async getToken(): Promise<string> {
    return getXrayAuthToken();
  }
}

export { REQUIRED_ENV_VARS };
