import { describe, expect, it, vi } from "vitest";
import { addToolkitToRepo } from "@/lib/add-toolkit";

function makeOctokit() {
  return {
    rest: {
      repos: {
        get: vi.fn().mockResolvedValue({ data: { default_branch: "main" } }),
      },
      git: {
        getRef: vi.fn().mockResolvedValue({ data: { object: { sha: "base-sha" } } }),
        createBlob: vi.fn().mockResolvedValue({ data: { sha: "blob-sha" } }),
        createTree: vi.fn().mockResolvedValue({ data: { sha: "tree-sha" } }),
        createCommit: vi.fn().mockResolvedValue({ data: { sha: "commit-sha" } }),
        createRef: vi.fn().mockResolvedValue({}),
        updateRef: vi.fn().mockResolvedValue({}),
      },
      pulls: {
        create: vi
          .fn()
          .mockResolvedValue({ data: { html_url: "https://github.com/salazarsebas/x/pull/1" } }),
      },
    },
  };
}

describe("addToolkitToRepo", () => {
  it("creates a branch, commits the toolkit files, and opens a PR", async () => {
    const octokit = makeOctokit();
    const files = [{ path: ".claude/skills/example-skill/SKILL.md", content: "hello" }];

    const result = await addToolkitToRepo(octokit as never, "salazarsebas", "x", files);

    expect(octokit.rest.git.createBlob).toHaveBeenCalledWith(
      expect.objectContaining({ content: "hello", encoding: "utf-8" })
    );
    expect(octokit.rest.git.createTree).toHaveBeenCalledWith(
      expect.objectContaining({
        base_tree: "base-sha",
        tree: [
          expect.objectContaining({
            path: ".claude/skills/example-skill/SKILL.md",
            sha: "blob-sha",
          }),
        ],
      })
    );
    expect(octokit.rest.git.createRef).toHaveBeenCalledWith(
      expect.objectContaining({ ref: "refs/heads/stellar-build/add-toolkit", sha: "commit-sha" })
    );
    expect(octokit.rest.pulls.create).toHaveBeenCalledWith(
      expect.objectContaining({ head: "stellar-build/add-toolkit", base: "main" })
    );
    expect(result).toEqual({
      prUrl: "https://github.com/salazarsebas/x/pull/1",
      branch: "stellar-build/add-toolkit",
    });
  });

  it("falls back to updateRef when the branch already exists", async () => {
    const octokit = makeOctokit();
    octokit.rest.git.createRef.mockRejectedValue(new Error("Reference already exists"));
    const files = [{ path: ".claude/skills/example-skill/SKILL.md", content: "hello" }];

    await addToolkitToRepo(octokit as never, "salazarsebas", "x", files);

    expect(octokit.rest.git.updateRef).toHaveBeenCalledWith(
      expect.objectContaining({ ref: "heads/stellar-build/add-toolkit", force: true })
    );
  });
});
