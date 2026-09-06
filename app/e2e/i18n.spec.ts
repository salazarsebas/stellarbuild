import { test, expect } from "@playwright/test";

test("English is served at the unprefixed root", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "stellar-build" })).toBeVisible();
  await expect(page.getByText("Use this template")).toBeVisible();
});

test("Spanish is served at /es", async ({ page }) => {
  await page.goto("/es");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByText("Usar esta plantilla →")).toBeVisible();
  await expect(page.getByText("Iniciar sesión con GitHub →")).toBeVisible();
});

test("Portuguese is served at /pt", async ({ page }) => {
  await page.goto("/pt");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt");
  await expect(page.getByText("Usar este template →")).toBeVisible();
  await expect(page.getByText("Entrar com o GitHub →")).toBeVisible();
});

test("the dashboard's signed-out view is translated per locale", async ({ page }) => {
  await page.goto("/es/dashboard");
  await expect(page.getByText("Inicia sesión para continuar")).toBeVisible();

  await page.goto("/pt/dashboard");
  await expect(page.getByText("Entre para continuar")).toBeVisible();
});

test("a browser set to Spanish is redirected from / to /es", async ({ browser }) => {
  const context = await browser.newContext({ locale: "es-ES" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page).toHaveURL(/\/es$/);
  await context.close();
});

test("the language switcher navigates between locales and preserves the path", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "ES" }).click();
  await expect(page).toHaveURL(/\/es\/dashboard$/);
  await expect(page.getByText("Inicia sesión para continuar")).toBeVisible();

  await page.getByRole("button", { name: "PT" }).click();
  await expect(page).toHaveURL(/\/pt\/dashboard$/);
  await expect(page.getByText("Entre para continuar")).toBeVisible();

  await page.getByRole("button", { name: "EN" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Sign in to continue")).toBeVisible();
});
