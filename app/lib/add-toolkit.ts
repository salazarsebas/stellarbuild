import { getToolkitFiles, type ToolkitFile } from "./toolkit-files";
import { TARGETS, type TargetKey } from "./targets";

export interface AddToolkitResult {
  prUrl: string;
  branch: string;
}

const COMMIT_MESSAGE = "feat: integrate stellar-build claude code skill";

export class EmptyRepositoryError extends Error {
  constructor() {
    super(
      "This repository has no commits yet. Add an initial commit, for example a README, before adding the toolkit."
    );
    this.name = "EmptyRepositoryError";
  }
}

interface AddToolkitOctokit {
  rest: {
    repos: {
      get: (params: { owner: string; repo: string }) => Promise<{ data: { default_branch: string } }>;
      update: (params: {
        owner: string;
        repo: string;
        delete_branch_on_merge: boolean;
      }) => Promise<unknown>;
    };
    git: {
      getRef: (params: {
        owner: string;
        repo: string;
        ref: string;
      }) => Promise<{ data: { object: { sha: string } } }>;
      createTree: (params: {
        owner: string;
        repo: string;
        base_tree: string;
        tree: Array<{ path: string; mode: "100644"; type: "blob"; content: string }>;
      }) => Promise<{ data: { sha: string } }>;
      createCommit: (params: {
        owner: string;
        repo: string;
        message: string;
        tree: string;
        parents: string[];
      }) => Promise<{ data: { sha: string } }>;
      createRef: (params: { owner: string; repo: string; ref: string; sha: string }) => Promise<unknown>;
      updateRef: (params: {
        owner: string;
        repo: string;
        ref: string;
        sha: string;
        force: boolean;
      }) => Promise<unknown>;
    };
    pulls: {
      create: (params: {
        owner: string;
        repo: string;
        title: string;
        head: string;
        base: string;
        body: string;
      }) => Promise<{ data: { html_url: string } }>;
      list: (params: {
        owner: string;
        repo: string;
        head: string;
        state: "open";
      }) => Promise<{ data: Array<{ html_url: string }> }>;
    };
  };
}

function branchNameForTargets(targets: TargetKey[]): string {
  const sorted = [...targets].sort();
  return `stellar-build/add-toolkit-${sorted.join("-")}`;
}

function hasStatus(err: unknown, status: number): boolean {
  return typeof err === "object" && err !== null && "status" in err && (err as { status?: unknown }).status === status;
}

function isDuplicatePullRequestError(err: unknown): boolean {
  if (!hasStatus(err, 422)) return false;
  const response = (err as { response?: { data?: { errors?: Array<{ message?: string }> } } }).response;
  return Boolean(
    response?.data?.errors?.some((entry) => entry.message?.includes("A pull request already exists"))
  );
}

function buildPrBody(targetLabels: string): string {
  return [
    "## Summary",
    "",
    `This pull request adds the [stellar-build](https://github.com/salazarsebas/stellar-build-toolkit) Claude Code skills toolkit to this repository, configured for ${targetLabels}.`,
    "",
    "stellar-build is a curated collection of skills for Stellar and Soroban development, covering smart contract patterns, wallet integrations, asset issuance, data access, and the supporting process and agent skills that go with them.",
    "",
    "## What's included",
    "",
    "- Skill files added under the folder your selected tooling reads from",
    "- No existing files in this repository are modified or removed",
    "- Ready to use as soon as this pull request is merged, no additional setup required",
    "",
    "## Why a pull request",
    "",
    "Nothing is pushed directly to this repository's default branch. This gives you the chance to review the added files before they land, the same as any other change to this repository.",
    "",
    "---",
    "",
    "Opened automatically by the stellar-build GitHub App, on request of an authenticated member of this installation.",
  ].join("\n");
}

export async function addToolkitToRepo(
  octokit: AddToolkitOctokit,
  owner: string,
  repo: string,
  targets: TargetKey[],
  files: ToolkitFile[] = getToolkitFiles()
): Promise<AddToolkitResult> {
  if (targets.length === 0) {
    throw new Error("At least one target must be selected");
  }

  const branchName = branchNameForTargets(targets);

  const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
  const baseBranch = repoData.default_branch;

  let baseSha: string;
  try {
    const { data: refData } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });
    baseSha = refData.object.sha;
  } catch (err) {
    if (hasStatus(err, 409)) {
      throw new EmptyRepositoryError();
    }
    throw err;
  }

  const selectedTargets = TARGETS.filter((t) => targets.includes(t.key));

  const entries: Array<{ path: string; content: string }> = [];
  for (const target of selectedTargets) {
    for (const file of files) {
      entries.push({ path: file.path.replace(/^\.claude/, target.folder), content: file.content });
    }
  }

  const treeItems = entries.map((entry) => ({
    path: entry.path,
    mode: "100644" as const,
    type: "blob" as const,
    content: entry.content,
  }));

  const { data: tree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: baseSha,
    tree: treeItems,
  });

  const { data: commit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message: COMMIT_MESSAGE,
    tree: tree.sha,
    parents: [baseSha],
  });

  try {
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: commit.sha,
    });
  } catch {
    await octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${branchName}`,
      sha: commit.sha,
      force: true,
    });
  }

  // Best-effort: requires the "Administration" permission, which the GitHub
  // App may not have been granted. When it fails, the branch simply isn't
  // auto-deleted after merge, the toolkit PR itself is unaffected.
  await octokit.rest.repos.update({ owner, repo, delete_branch_on_merge: true }).catch(() => {});

  const targetLabels = selectedTargets.map((t) => t.label).join(", ");

  try {
    const { data: pr } = await octokit.rest.pulls.create({
      owner,
      repo,
      title: COMMIT_MESSAGE,
      head: branchName,
      base: baseBranch,
      body: buildPrBody(targetLabels),
    });
    return { prUrl: pr.html_url, branch: branchName };
  } catch (err) {
    if (isDuplicatePullRequestError(err)) {
      const { data: openPulls } = await octokit.rest.pulls.list({
        owner,
        repo,
        head: `${owner}:${branchName}`,
        state: "open",
      });
      const existing = openPulls[0];
      if (existing) {
        return { prUrl: existing.html_url, branch: branchName };
      }
    }
    throw err;
  }
}
