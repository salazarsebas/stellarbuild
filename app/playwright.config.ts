import { defineConfig } from "@playwright/test";
import { generateKeyPairSync } from "node:crypto";

const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
  publicKeyEncoding: { type: "pkcs1", format: "pem" },
});

export const E2E_SESSION_SECRET = "e2e-test-session-secret-do-not-use-in-prod-32c";
// Next.js derives req.nextUrl.origin from its own bound hostname rather than
// the incoming Host header, so every redirect this app issues always lands on
// "localhost", never "127.0.0.1". Matching that here keeps the session cookie
// (host-only, set on whichever origin a test first hits) visible across the
// login -> callback -> dashboard redirect chain.
export const E2E_BASE_URL = "http://localhost:3100";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: E2E_BASE_URL,
    // Pins the browser's Accept-Language and navigator.language to English so
    // next-intl's locale auto-detection resolves to the default locale
    // deterministically, regardless of the host machine's own locale.
    locale: "en-US",
  },
  webServer: {
    command: "bun run build && bun run start -- --port 3100",
    url: E2E_BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      SESSION_SECRET: E2E_SESSION_SECRET,
      GITHUB_OAUTH_CLIENT_ID: "e2e-oauth-client-id",
      GITHUB_OAUTH_CLIENT_SECRET: "e2e-oauth-client-secret",
      GITHUB_APP_ID: "123456",
      GITHUB_APP_PRIVATE_KEY: privateKey,
      E2E_MOCK_GITHUB: "1",
    },
  },
});
