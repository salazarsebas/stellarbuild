import { describe, expect, it, vi } from "vitest";
import { listUserInstallations } from "@/lib/user-installations";

describe("listUserInstallations", () => {
  it("maps installations to id/login/type/avatarUrl", async () => {
    const octokit = {
      rest: {
        apps: {
          listInstallationsForAuthenticatedUser: vi.fn().mockResolvedValue({
            data: {
              installations: [
                { id: 1, account: { login: "salazarsebas", type: "User", avatar_url: "https://a" } },
                { id: 2, account: { login: "aizktec", type: "Organization", avatar_url: "https://b" } },
              ],
            },
          }),
        },
      },
    };

    const result = await listUserInstallations(octokit);

    expect(result).toEqual([
      { id: 1, login: "salazarsebas", type: "User", avatarUrl: "https://a" },
      { id: 2, login: "aizktec", type: "Organization", avatarUrl: "https://b" },
    ]);
  });

  it("defaults to type User when the account has no type", async () => {
    const octokit = {
      rest: {
        apps: {
          listInstallationsForAuthenticatedUser: vi.fn().mockResolvedValue({
            data: { installations: [{ id: 3, account: { login: "someone", avatar_url: "https://c" } }] },
          }),
        },
      },
    };

    const result = await listUserInstallations(octokit);

    expect(result).toEqual([{ id: 3, login: "someone", type: "User", avatarUrl: "https://c" }]);
  });
});
