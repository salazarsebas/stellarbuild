import { sealData } from "iron-session";
import type { BrowserContext } from "@playwright/test";
import { E2E_SESSION_SECRET } from "../playwright.config";

export async function signInAs(
  context: BrowserContext,
  baseURL: string,
  accessToken: string
): Promise<void> {
  const sealed = await sealData({ accessToken }, { password: E2E_SESSION_SECRET });
  await context.addCookies([
    {
      name: "stellar_build_session",
      value: sealed,
      url: baseURL,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}
