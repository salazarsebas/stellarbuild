import { test, expect } from "@playwright/test";

test("landing page shows both entry points", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "stellar-build" })).toBeVisible();
  await expect(page.getByText("Use this template")).toBeVisible();
  await expect(page.locator('a[href="/api/auth/login"]')).toBeVisible();
});

test("links that leave the app without a way back open in a new tab", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('a[href^="https://github.com/new?"]')).toHaveAttribute("target", "_blank");
  await expect(
    page.locator('a[href="https://github.com/salazarsebas/stellar-build-toolkit"]')
  ).toHaveAttribute("target", "_blank");
  // The sign-in link redirects back to /dashboard on its own, it must stay in the same tab.
  await expect(page.locator('a[href="/api/auth/login"]')).not.toHaveAttribute("target", "_blank");
});

test("dashboard shows a sign-in prompt for unauthenticated visitors", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("Sign in to continue")).toBeVisible();
});

test("dashboard shows a friendly message when authError is present", async ({ page }) => {
  await page.goto("/dashboard?authError=invalid_state");
  await expect(
    page.getByText("Your sign-in session expired or was tampered with. Please try again.")
  ).toBeVisible();
});
