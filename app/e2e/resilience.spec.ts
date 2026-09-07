import { test, expect } from "@playwright/test";
import { signInAs } from "./fixtures";
import { FAKE_USER_INSTALLATION_ID, FAKE_ORG_LOGIN, FAKE_REPO_NAME, EXPIRED_ACCESS_TOKEN } from "../mocks/github-handlers";

test("refreshes an expired session token and retries the request instead of failing", async ({ context, baseURL }) => {
  await signInAs(context, baseURL!, EXPIRED_ACCESS_TOKEN, "valid-refresh-token");

  const res = await context.request.get("/api/installations");

  expect(res.status()).toBe(200);
  const data = await res.json();
  expect(data.installations).toHaveLength(1);
});

test("rate limits repeated add-toolkit requests from the same session", async ({ context, baseURL }) => {
  await signInAs(context, baseURL!, "fake-user-access-token-rate-limit-spec");
  const body = {
    installation_id: FAKE_USER_INSTALLATION_ID,
    owner: FAKE_ORG_LOGIN,
    repo: FAKE_REPO_NAME,
    targets: ["claude"],
  };

  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) {
    const res = await context.request.post("/api/add-toolkit", {
      data: body,
      headers: { "content-type": "application/json" },
    });
    statuses.push(res.status());
  }

  expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
  expect(statuses[5]).toBe(429);
});
