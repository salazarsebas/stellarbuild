import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { withTokenRefresh } from "@/lib/with-token-refresh";

function makeSession(overrides: Partial<{ accessToken: string; refreshToken: string }> = {}) {
  return {
    accessToken: "old-token",
    refreshToken: "refresh-token",
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const credentials = { clientId: "client-id", clientSecret: "client-secret" };

describe("withTokenRefresh", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the result of a successful first attempt without refreshing", async () => {
    const session = makeSession();
    const attempt = vi.fn().mockResolvedValue("ok");

    const result = await withTokenRefresh(session, attempt, credentials);

    expect(result).toBe("ok");
    expect(attempt).toHaveBeenCalledTimes(1);
    expect(attempt).toHaveBeenCalledWith("old-token");
    expect(session.save).not.toHaveBeenCalled();
  });

  it("refreshes the token and retries once when the first attempt is unauthorized", async () => {
    const session = makeSession();
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ access_token: "new-token", refresh_token: "new-refresh-token" }),
    });
    const attempt = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("Bad credentials"), { status: 401 }))
      .mockResolvedValueOnce("ok after refresh");

    const result = await withTokenRefresh(session, attempt, credentials);

    expect(result).toBe("ok after refresh");
    expect(attempt).toHaveBeenNthCalledWith(1, "old-token");
    expect(attempt).toHaveBeenNthCalledWith(2, "new-token");
    expect(session.accessToken).toBe("new-token");
    expect(session.refreshToken).toBe("new-refresh-token");
    expect(session.save).toHaveBeenCalledTimes(1);
  });

  it("rethrows the original error when there is no refresh token to fall back on", async () => {
    const session = makeSession({ refreshToken: undefined });
    const error = Object.assign(new Error("Bad credentials"), { status: 401 });
    const attempt = vi.fn().mockRejectedValue(error);

    await expect(withTokenRefresh(session, attempt, credentials)).rejects.toBe(error);
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it("rethrows the original error when client credentials are not configured", async () => {
    const session = makeSession();
    const error = Object.assign(new Error("Bad credentials"), { status: 401 });
    const attempt = vi.fn().mockRejectedValue(error);

    await expect(withTokenRefresh(session, attempt, {})).rejects.toBe(error);
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it("rethrows non-401 errors without attempting a refresh", async () => {
    const session = makeSession();
    const error = new Error("boom");
    const attempt = vi.fn().mockRejectedValue(error);

    await expect(withTokenRefresh(session, attempt, credentials)).rejects.toBe(error);
    expect(attempt).toHaveBeenCalledTimes(1);
    expect(session.save).not.toHaveBeenCalled();
  });
});
