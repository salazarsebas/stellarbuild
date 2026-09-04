import { describe, expect, it, vi } from "vitest";
import { listInstallationRepos } from "@/lib/list-repos";

describe("listInstallationRepos", () => {
  it("maps the installation's accessible repos to owner/name pairs", async () => {
    const octokit = {
      rest: {
        apps: {
          listReposAccessibleToInstallation: vi.fn().mockResolvedValue({
            data: {
              repositories: [
                { name: "stellar-build-test-target", owner: { login: "salazarsebas" } },
              ],
            },
          }),
        },
      },
    };

    const result = await listInstallationRepos(octokit);

    expect(result).toEqual([{ owner: "salazarsebas", name: "stellar-build-test-target" }]);
    expect(octokit.rest.apps.listReposAccessibleToInstallation).toHaveBeenCalledOnce();
  });
});
