import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { exchangeCodeForToken, refreshAccessToken } from "@/lib/oauth";

describe("exchangeCodeForToken", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the access token and refresh token on success", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ access_token: "tok-123", refresh_token: "refresh-456" }),
    });

    const result = await exchangeCodeForToken({
      code: "abc",
      redirectUri: "https://example.com/api/auth/callback",
      clientId: "client-id",
      clientSecret: "client-secret",
    });

    expect(result).toEqual({ accessToken: "tok-123", refreshToken: "refresh-456" });
    expect(fetch).toHaveBeenCalledWith(
      "https://github.com/login/oauth/access_token",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Accept: "application/json" }),
      })
    );
  });

  it("throws when GitHub returns no access token", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ error_description: "bad_verification_code" }),
    });

    await expect(
      exchangeCodeForToken({
        code: "abc",
        redirectUri: "https://example.com/api/auth/callback",
        clientId: "client-id",
        clientSecret: "client-secret",
      })
    ).rejects.toThrow("bad_verification_code");
  });
});

describe("refreshAccessToken", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a new access token and refresh token on success", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ access_token: "new-tok", refresh_token: "new-refresh" }),
    });

    const result = await refreshAccessToken({
      refreshToken: "old-refresh",
      clientId: "client-id",
      clientSecret: "client-secret",
    });

    expect(result).toEqual({ accessToken: "new-tok", refreshToken: "new-refresh" });
    const [, requestInit] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(requestInit.body)).toEqual(
      expect.objectContaining({ grant_type: "refresh_token", refresh_token: "old-refresh" })
    );
  });

  it("throws when GitHub rejects the refresh token", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ error_description: "bad_refresh_token" }),
    });

    await expect(
      refreshAccessToken({ refreshToken: "old-refresh", clientId: "client-id", clientSecret: "client-secret" })
    ).rejects.toThrow("bad_refresh_token");
  });
});
