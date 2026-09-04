export interface RepoRef {
  owner: string;
  name: string;
}

interface InstallationOctokit {
  rest: {
    apps: {
      listReposAccessibleToInstallation: () => Promise<{
        data: { repositories: Array<{ name: string; owner: { login: string } }> };
      }>;
    };
  };
}

export async function listInstallationRepos(octokit: InstallationOctokit): Promise<RepoRef[]> {
  const { data } = await octokit.rest.apps.listReposAccessibleToInstallation();
  return data.repositories.map((r) => ({ owner: r.owner.login, name: r.name }));
}
