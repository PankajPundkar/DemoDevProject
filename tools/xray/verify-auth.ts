import { getXrayAuthToken } from "./XrayAuth";

async function main(): Promise<void> {
  try {
    await getXrayAuthToken();
    console.log("Xray authentication successful.");
  } catch {
    console.error(
      "Xray authentication failed. Check credentials and configuration.",
    );
    process.exitCode = 1;
  }
}

void main();
