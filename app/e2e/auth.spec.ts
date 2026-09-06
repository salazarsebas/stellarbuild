import { test, expect } from "@playwright/test";

test("signing in redirects to GitHub's authorize endpoint with the right params", async ({ context, baseURL }) => {
  const res = await context.request.get("/api/auth/login", { maxRedirects: 0 });
  expect(res.status()).toBe(307);

  const location = res.headers()["location"]!;
  const url = new URL(location, baseURL);
  expect(`${url.origin}${url.pathname}`).toBe("https://github.com/login/oauth/authorize");
  expect(url.searchParams.get("client_id")).toBe("e2e-oauth-client-id");
  expect(url.searchParams.get("redirect_uri")).toBe(`${baseURL}/api/auth/callback`);
  expect(url.searchParams.get("state")).toBeTruthy();
});

test("completing the OAuth callback signs the user in and redirects to the dashboard", async ({ page, context, baseURL }) => {
  const loginRes = await context.request.get("/api/auth/login", { maxRedirects: 0 });
  const location = loginRes.headers()["location"]!;
  const state = new URL(location, baseURL).searchParams.get("state")!;

  await page.goto(`/api/auth/callback?code=test-code&state=${state}`);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Add the stellar-build toolkit" })).toBeVisible();
});
