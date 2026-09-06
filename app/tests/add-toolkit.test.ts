import { describe, expect, it, vi } from "vitest";
import { addToolkitToRepo, EmptyRepositoryError } from "@/lib/add-toolkit";

function makeOctokit() {
  return {
    rest: {
      repos: {
        get: vi.fn().mockResolvedValue({ data: { default_branch: "main" } }),
        update: vi.fn().mockResolvedValue({}),
      },
      git: {
        getRef: vi.fn().mockResolvedValue({ data: { object: { sha: "base-sha" } } }),
        createTree: vi.fn().mockResolvedValue({ data: { sha: "tree-sha" } }),
        createCommit: vi.fn().mockResolvedValue({ data: { sha: "commit-sha" } }),
        createRef: vi.fn().mockResolvedValue({}),
        updateRef: vi.fn().mockResolvedValue({}),
      },
      pulls: {
        create: vi
          .fn()
          .mockResolvedValue({ data: { html_url: "https://github.com/salazarsebas/x/pull/1" } }),
        list: vi.fn().mockResolvedValue({ data: [] }),
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
    expect(treeCall.tree.every((item: { content: string }) => item.content === "hello")).toBe(true);
    expect(result).toEqual({
      prUrl: "https://github.com/salazarsebas/x/pull/1",
      branch: "stellar-build/add-toolkit-claude-codex",
    });
  });

  it("derives the branch name from the sorted list of selected targets", async () => {
    const octokit = makeOctokit();
    const files = [{ path: ".claude/skills/example-skill/SKILL.md", content: "hello" }];

    const result = await addToolkitToRepo(octokit as never, "salazarsebas", "x", ["grok", "cursor"], files);

    expect(result.branch).toBe("stellar-build/add-toolkit-cursor-grok");
    expect(octokit.rest.git.createRef).toHaveBeenCalledWith(
      expect.objectContaining({ ref: "refs/heads/stellar-build/add-toolkit-cursor-grok" })
    );
  });

  it("opens the pull request with a conventional-commit title and matching commit message", async () => {
    const octokit = makeOctokit();
    const files = [{ path: ".claude/skills/example-skill/SKILL.md", content: "hello" }];

    await addToolkitToRepo(octokit as never, "salazarsebas", "x", ["claude"], files);

    const commitCall = octokit.rest.git.createCommit.mock.calls[0][0];
    const prCall = octokit.rest.pulls.create.mock.calls[0][0];
    expect(commitCall.message).toBe("feat: integrate stellar-build claude code skill");
    expect(prCall.title).toBe("feat: integrate stellar-build claude code skill");
  });

  it("mentions the selected target labels in the PR body", async () => {
    const octokit = makeOctokit();
    const files = [{ path: ".claude/skills/example-skill/SKILL.md", content: "hello" }];

    await addToolkitToRepo(octokit as never, "salazarsebas", "x", ["gemini", "other"], files);

    const prCall = octokit.rest.pulls.create.mock.calls[0][0];
    expect(prCall.body).toContain("Gemini CLI");
    expect(prCall.body).toContain("Others");
  });

  it("requests branch deletion on merge", async () => {
    const octokit = makeOctokit();
    const files = [{ path: ".claude/skills/example-skill/SKILL.md", content: "hello" }];

    await addToolkitToRepo(octokit as never, "salazarsebas", "x", ["claude"], files);

    expect(octokit.rest.repos.update).toHaveBeenCalledWith(
      expect.objectContaining({ owner: "salazarsebas", repo: "x", delete_branch_on_merge: true })
    );
  });

  it("still returns a PR url when the app lacks permission to set branch deletion", async () => {
    const octokit = makeOctokit();
    octokit.rest.repos.update.mockRejectedValue(new Error("Resource not accessible by integration"));
    const files = [{ path: ".claude/skills/example-skill/SKILL.md", content: "hello" }];

    const result = await addToolkitToRepo(octokit as never, "salazarsebas", "x", ["claude"], files);

    expect(result.prUrl).toBe("https://github.com/salazarsebas/x/pull/1");
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
      expect.objectContaining({ ref: "heads/stellar-build/add-toolkit-claude", force: true })
    );
  });

  it("throws an EmptyRepositoryError when the target repository has no commits yet", async () => {
    const octokit = makeOctokit();
    octokit.rest.git.getRef.mockRejectedValue(
      Object.assign(new Error("Git Repository is empty."), { status: 409 })
    );
    const files = [{ path: ".claude/skills/example-skill/SKILL.md", content: "hello" }];

    await expect(
      addToolkitToRepo(octokit as never, "salazarsebas", "x", ["claude"], files)
    ).rejects.toThrow(EmptyRepositoryError);
  });

  it("returns the existing open PR instead of failing when one is already open for the branch", async () => {
    const octokit = makeOctokit();
    octokit.rest.pulls.create.mockRejectedValue(
      Object.assign(new Error("Validation Failed"), {
        status: 422,
        response: {
          data: {
            errors: [{ message: "A pull request already exists for salazarsebas:stellar-build/add-toolkit-claude." }],
          },
        },
      })
    );
    octokit.rest.pulls.list.mockResolvedValue({
      data: [{ html_url: "https://github.com/salazarsebas/x/pull/7" }],
    });
    const files = [{ path: ".claude/skills/example-skill/SKILL.md", content: "hello" }];

    const result = await addToolkitToRepo(octokit as never, "salazarsebas", "x", ["claude"], files);

    expect(result).toEqual({
      prUrl: "https://github.com/salazarsebas/x/pull/7",
      branch: "stellar-build/add-toolkit-claude",
    });
    expect(octokit.rest.pulls.list).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "salazarsebas",
        repo: "x",
        head: "salazarsebas:stellar-build/add-toolkit-claude",
        state: "open",
      })
    );
  });
});
