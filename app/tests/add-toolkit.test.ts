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
        createBlob: vi.fn().mockImplementation(async ({ content }: { content: string }) => ({
          data: { sha: `blob-${content}` },
        })),
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
  it("remaps every file under each selected target's folder", async () => {
    const octokit = makeOctokit();
    const files = [{ path: ".claude/skills/example-skill/SKILL.md", content: "hello" }];

    const result = await addToolkitToRepo(octokit as never, "salazarsebas", "x", ["claude", "codex"], files);

    const treeCall = octokit.rest.git.createTree.mock.calls[0][0];
    const paths = treeCall.tree.map((item: { path: string }) => item.path).sort();
    expect(paths).toEqual([
      ".claude/skills/example-skill/SKILL.md",
      ".codex/skills/example-skill/SKILL.md",
    ]);
    expect(octokit.rest.git.createBlob).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      prUrl: "https://github.com/salazarsebas/x/pull/1",
      branch: "stellar-build/add-toolkit",
    });
  });

  it("mentions the selected target labels in the PR body", async () => {
    const octokit = makeOctokit();
    const files = [{ path: ".claude/skills/example-skill/SKILL.md", content: "hello" }];

    await addToolkitToRepo(octokit as never, "salazarsebas", "x", ["gemini", "other"], files);

    const prCall = octokit.rest.pulls.create.mock.calls[0][0];
    expect(prCall.body).toContain("Gemini CLI");
    expect(prCall.body).toContain("Others");
  });

  it("throws when no targets are given", async () => {
    const octokit = makeOctokit();
    await expect(addToolkitToRepo(octokit as never, "salazarsebas", "x", [], [])).rejects.toThrow(
      "At least one target must be selected"
    );
  });

  it("falls back to updateRef when the branch already exists", async () => {
    const octokit = makeOctokit();
    octokit.rest.git.createRef.mockRejectedValue(new Error("Reference already exists"));
    const files = [{ path: ".claude/skills/example-skill/SKILL.md", content: "hello" }];

    await addToolkitToRepo(octokit as never, "salazarsebas", "x", ["claude"], files);

    expect(octokit.rest.git.updateRef).toHaveBeenCalledWith(
      expect.objectContaining({ ref: "heads/stellar-build/add-toolkit", force: true })
    );
  });
});
