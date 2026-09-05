import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { exchangeCodeForToken } from "@/lib/oauth";

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
