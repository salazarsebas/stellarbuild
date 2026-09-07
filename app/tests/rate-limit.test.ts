import { describe, expect, it } from "vitest";
import { isRateLimited } from "@/lib/rate-limit";

describe("isRateLimited", () => {
  it("allows requests up to the limit and blocks the next one", () => {
    const key = "user-a";
    expect(isRateLimited(key, 3, 60_000)).toBe(false);
    expect(isRateLimited(key, 3, 60_000)).toBe(false);
    expect(isRateLimited(key, 3, 60_000)).toBe(false);
    expect(isRateLimited(key, 3, 60_000)).toBe(true);
  });

  it("tracks separate keys independently", () => {
    expect(isRateLimited("user-b", 1, 60_000)).toBe(false);
    expect(isRateLimited("user-c", 1, 60_000)).toBe(false);
    expect(isRateLimited("user-b", 1, 60_000)).toBe(true);
    expect(isRateLimited("user-c", 1, 60_000)).toBe(true);
  });

  it("resets the count once the window elapses", async () => {
    const key = "user-d";
    expect(isRateLimited(key, 1, 10)).toBe(false);
    expect(isRateLimited(key, 1, 10)).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(isRateLimited(key, 1, 10)).toBe(false);
  });
});
