import { describe, expect, it, vi, beforeEach } from "vitest";

const { appConstructor, getInstallationOctokitMock } = vi.hoisted(() => {
  const getInstallationOctokitMock = vi.fn().mockResolvedValue({ rest: {} });
  const appConstructor = vi.fn().mockImplementation(function () {
    return {
      getInstallationOctokit: getInstallationOctokitMock,
    };
  });
  return { appConstructor, getInstallationOctokitMock };
});

vi.mock("@octokit/app", () => ({
  App: appConstructor,
}));

describe("getInstallationOctokit", () => {
  beforeEach(() => {
    vi.resetModules();
    appConstructor.mockClear();
    getInstallationOctokitMock.mockClear();
    delete process.env.GITHUB_APP_ID;
    delete process.env.GITHUB_APP_PRIVATE_KEY;
  });

  it("throws when GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY are missing", async () => {
    const { getInstallationOctokit } = await import("@/lib/github-app");
    await expect(getInstallationOctokit(123)).rejects.toThrow(
      "GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY must be set"
    );
  });

  it("constructs the App once with the configured credentials and reuses it across calls", async () => {
    process.env.GITHUB_APP_ID = "1";
    process.env.GITHUB_APP_PRIVATE_KEY = "fake-key";
    const { getInstallationOctokit } = await import("@/lib/github-app");

    await getInstallationOctokit(123);
    await getInstallationOctokit(456);

    expect(appConstructor).toHaveBeenCalledTimes(1);
    expect(appConstructor).toHaveBeenCalledWith({ appId: "1", privateKey: "fake-key" });
    expect(getInstallationOctokitMock).toHaveBeenNthCalledWith(1, 123);
    expect(getInstallationOctokitMock).toHaveBeenNthCalledWith(2, 456);
  });
});
