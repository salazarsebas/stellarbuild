import { test, expect } from "@playwright/test";
import { signInAs } from "./fixtures";
import { FAKE_USER_INSTALLATION_ID, FAKE_ORG_LOGIN, FAKE_REPO_NAME } from "../mocks/github-handlers";

test("an authenticated user can list repos and open a toolkit PR", async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL!, "fake-user-access-token");
  await page.goto("/dashboard");

  await expect(page.getByText(FAKE_ORG_LOGIN)).toBeVisible();
  await expect(page.getByText(`${FAKE_ORG_LOGIN}/${FAKE_REPO_NAME}`)).toBeVisible();

  await page.getByRole("button", { name: "Add stellar-build tools" }).click();
  await expect(page.getByRole("link", { name: "View PR →" })).toBeVisible();
});

test("rejects a request for an installation the user does not own", async ({ context, baseURL }) => {
  await signInAs(context, baseURL!, "fake-user-access-token");
  const res = await context.request.post("/api/add-toolkit", {
    data: {
      installation_id: FAKE_USER_INSTALLATION_ID + 1,
      owner: FAKE_ORG_LOGIN,
      repo: FAKE_REPO_NAME,
      targets: ["claude"],
    },
    headers: { "content-type": "application/json" },
  });
  expect(res.status()).toBe(403);
});

test("shows an error instead of hanging when the repos request fails", async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL!, "fake-user-access-token");
  await page.route("**/api/repos**", (route) =>
    route.fulfill({ status: 500, body: JSON.stringify({ error: "boom" }) })
  );
  await page.goto("/dashboard");
  await expect(page.getByText("Could not load repositories for this account.")).toBeVisible();
});
