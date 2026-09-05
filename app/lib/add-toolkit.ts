import { getToolkitFiles, type ToolkitFile } from "./toolkit-files";
import { TARGETS, type TargetKey } from "./targets";

export interface AddToolkitResult {
  prUrl: string;
  branch: string;
}

const BRANCH_NAME = "stellar-build/add-toolkit";

interface AddToolkitOctokit {
  rest: {
    repos: {
      get: (params: { owner: string; repo: string }) => Promise<{ data: { default_branch: string } }>;
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
    };
  };
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

  const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
  const baseBranch = repoData.default_branch;

  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`,
  });
  const baseSha = refData.object.sha;

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
    message: "Add stellar-build toolkit",
    tree: tree.sha,
    parents: [baseSha],
  });

  try {
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${BRANCH_NAME}`,
      sha: commit.sha,
    });
  } catch {
    await octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${BRANCH_NAME}`,
      sha: commit.sha,
      force: true,
    });
  }

  const targetLabels = selectedTargets.map((t) => t.label).join(", ");
  const { data: pr } = await octokit.rest.pulls.create({
    owner,
    repo,
    title: "Add stellar-build toolkit",
    head: BRANCH_NAME,
    base: baseBranch,
    body:
      `Adds the stellar-build toolkit for: ${targetLabels}.\n\n` +
      "Opened automatically after installing the stellar-build GitHub App.",
  });

  return { prUrl: pr.html_url, branch: BRANCH_NAME };
}
